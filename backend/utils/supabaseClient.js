const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are missing. Please check your .env file.');
  console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Database helper functions
const db = {
  /**
   * Check if a user with the given email already exists
   * @param {string} email - User's email address
   * @returns {Promise<boolean>} - True if user exists, false otherwise
   */
  async userExists(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[SUPABASE] Error checking user existence:', error.message);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('[SUPABASE] Exception checking user existence:', error.message);
      return false;
    }
  },

  /**
   * Create a new user or get existing user
   * @param {string} email - User's email address
   * @returns {Promise<object>} - User object
   */
  async createOrGetUser(email) {
    try {
      const normalizedEmail = email.toLowerCase();
      
      // First, check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .single();

      if (existingUser) {
        // Update login count and last login
        const { data: updatedUser } = await supabase
          .from('users')
          .update({
            login_count: (existingUser.login_count || 0) + 1,
            last_login_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        return updatedUser || existingUser;
      }

      // Extract name from email (e.g., john.doe@bcah.christuniversity.in -> John Doe)
      const emailPrefix = normalizedEmail.split('@')[0];
      const fullName = emailPrefix
        .split(/[._]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          full_name: fullName,
          department: 'BCA-B',
          is_active: true,
          login_count: 1,
          first_login_at: new Date().toISOString(),
          last_login_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[SUPABASE] Error creating user:', error.message);
        throw error;
      }

      return newUser;
    } catch (error) {
      console.error('[SUPABASE] Exception in createOrGetUser:', error.message);
      throw error;
    }
  },

  /**
   * Log OTP attempt
   * @param {string} email - User's email
   * @param {string} otpCode - OTP code (plain text, will be hashed in controller)
   * @param {string} otpHash - Hashed OTP
   * @param {number} expiresInSeconds - OTP expiry in seconds
   * @returns {Promise<object>} - OTP log entry
   */
  async logOtp(email, otpCode, otpHash, expiresInSeconds = 90) {
    try {
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
      
      const { data, error } = await supabase
        .from('otp_logs')
        .insert({
          email: email.toLowerCase(),
          otp_code: otpCode,
          otp_hash: otpHash,
          expires_at: expiresAt.toISOString(),
          is_verified: false,
          verification_attempts: 0,
          max_attempts: 5
        })
        .select()
        .single();

      if (error) {
        console.error('[SUPABASE] Error logging OTP:', error.message);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[SUPABASE] Exception logging OTP:', error.message);
      throw error;
    }
  },

  /**
   * Verify OTP and update log
   * @param {string} email - User's email
   * @param {string} otpCode - OTP code to verify
   * @returns {Promise<object|null>} - OTP log if valid, null otherwise
   */
  async verifyOtp(email, otpCode) {
    try {
      const normalizedEmail = email.toLowerCase();
      const now = new Date().toISOString();
      
      // Find active OTP for this email
      const { data: otpLog, error } = await supabase
        .from('otp_logs')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('is_verified', false)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !otpLog) {
        return null;
      }

      // Update verification attempts
      const updatedAttempts = (otpLog.verification_attempts || 0) + 1;
      
      const { data: updatedLog } = await supabase
        .from('otp_logs')
        .update({
          verification_attempts: updatedAttempts,
          is_verified: true,
          verified_at: now
        })
        .eq('id', otpLog.id)
        .select()
        .single();

      return updatedLog;
    } catch (error) {
      console.error('[SUPABASE] Exception verifying OTP:', error.message);
      return null;
    }
  },

  /**
   * Get OTP verification attempts for an email
   * @param {string} email - User's email
   * @returns {Promise<number>} - Number of failed attempts in last 2 minutes
   */
  async getRecentFailedAttempts(email) {
    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      
      const { count, error } = await supabase
        .from('otp_logs')
        .select('*', { count: 'exact', head: true })
        .eq('email', email.toLowerCase())
        .eq('is_verified', false)
        .gte('created_at', twoMinutesAgo);

      if (error) {
        console.error('[SUPABASE] Error getting failed attempts:', error.message);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[SUPABASE] Exception getting failed attempts:', error.message);
      return 0;
    }
  },

  /**
   * Log user activity
   * @param {string} userId - User ID
   * @param {string} activityType - Type of activity
   * @param {object} activityDetails - Additional details
   */
  async logActivity(userId, activityType, activityDetails = {}) {
    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          activity_type: activityType,
          activity_details: activityDetails,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('[SUPABASE] Error logging activity:', error.message);
    }
  }
};

module.exports = { supabase, db };