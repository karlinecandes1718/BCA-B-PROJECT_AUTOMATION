-- Supabase Database Schema for BCA-B Activity Portal
-- Created: July 13, 2026

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE - Stores student information
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    roll_number VARCHAR(50),
    department VARCHAR(100) DEFAULT 'BCA-B',
    is_active BOOLEAN DEFAULT TRUE,
    login_count INTEGER DEFAULT 0,
    last_login_at TIMESTAMP WITH TIME ZONE,
    first_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_roll_number ON users(roll_number);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- =============================================
-- 2. OTP_LOGS TABLE - Tracks OTP attempts and verifications
-- =============================================
CREATE TABLE IF NOT EXISTS otp_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for OTP logs
CREATE INDEX IF NOT EXISTS idx_otp_logs_email ON otp_logs(email);
CREATE INDEX IF NOT EXISTS idx_otp_logs_created_at ON otp_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_otp_logs_expires_at ON otp_logs(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_logs_is_verified ON otp_logs(is_verified);

-- =============================================
-- 3. ACTIVITY_LOGS TABLE - Tracks user activities
-- =============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- =============================================
-- 4. ADMIN_USERS TABLE - For admin access
-- =============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (password: 0987)
INSERT INTO admin_users (username, full_name, password_hash, role) 
VALUES ('admin', 'System Administrator', '$2b$10$YourHashedPasswordHere', 'admin')
ON CONFLICT (username) DO NOTHING;

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for admin_users table
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if email is from Christ University
CREATE OR REPLACE FUNCTION is_christ_email(email VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[a-z0-9._%+\-]+@bcah\.christuniversity\.in$';
END;
$$ LANGUAGE plpgsql;

-- Function to prevent duplicate Christ emails
CREATE OR REPLACE FUNCTION prevent_duplicate_christ_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM users WHERE LOWER(email) = LOWER(NEW.email)) THEN
        RAISE EXCEPTION 'Email % already exists in the system', NEW.email;
    END IF;
    
    -- Validate email domain
    IF NOT is_christ_email(NEW.email) THEN
        RAISE EXCEPTION 'Email must be from @bcah.christuniversity.in domain';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate email before insert
CREATE TRIGGER validate_user_email BEFORE INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_christ_email();

-- =============================================
-- VIEWS FOR REPORTING
-- =============================================

-- View for active users
CREATE OR REPLACE VIEW active_users_view AS
SELECT 
    id,
    email,
    full_name,
    roll_number,
    department,
    login_count,
    last_login_at,
    first_login_at
FROM users
WHERE is_active = TRUE
ORDER BY last_login_at DESC NULLS FIRST;

-- View for OTP statistics
CREATE OR REPLACE VIEW otp_statistics_view AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_otps_sent,
    COUNT(CASE WHEN is_verified = TRUE THEN 1 END) as verified_otps,
    COUNT(CASE WHEN is_verified = FALSE THEN 1 END) as unverified_otps,
    AVG(verification_attempts) as avg_attempts
FROM otp_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =============================================
-- SAMPLE DATA INSERTION (Optional)
-- =============================================

/*
-- Sample student data (uncomment if needed)
INSERT INTO users (email, full_name, roll_number, department) VALUES
('student1@bcah.christuniversity.in', 'John Doe', 'BCA2024001', 'BCA-B'),
('student2@bcah.christuniversity.in', 'Jane Smith', 'BCA2024002', 'BCA-B'),
('student3@bcah.christuniversity.in', 'Bob Johnson', 'BCA2024003', 'BCA-B')
ON CONFLICT (email) DO NOTHING;
*/

-- =============================================
-- HOW TO USE THIS SCHEMA:
-- =============================================
/*
1. Go to Supabase Dashboard > SQL Editor
2. Copy and paste this entire file
3. Run the SQL to create tables
4. Set up Row Level Security (RLS) policies as needed
5. Get your Supabase URL and API keys from Settings > API
6. Add Supabase credentials to your .env file:
   SUPABASE_URL=your-project-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
*/

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES (Basic)
-- =============================================
/*
-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for otp_logs table  
CREATE POLICY "Service role can manage OTP logs" ON otp_logs
    FOR ALL USING (auth.role() = 'service_role');
*/

-- End of Schema