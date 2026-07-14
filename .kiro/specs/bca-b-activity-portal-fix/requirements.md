# Requirements Document

## Introduction

The BCA-B Activity Portal is a Next.js frontend with Node.js Express backend system for managing classroom activities with OTP-based authentication. Currently, the system has multiple issues preventing proper functionality:

1. **OTP Email Delivery Failure**: OTP emails are not being delivered to Gmail due to incorrect Brevo SMTP configuration
2. **Codebase Confusion**: Multiple duplicate controller files exist (4 versions of OTP controller)
3. **Configuration Issues**: Environment files contain incorrect or missing credentials
4. **Testing Gaps**: Incomplete end-to-end testing of the entire website functionality
5. **Integration Issues**: Frontend-backend communication and Supabase database connectivity problems

This requirements document outlines the necessary fixes and comprehensive testing needed to make the BCA-B Activity Portal fully operational.

## Glossary

- **System**: BCA-B Activity Portal consisting of frontend (Next.js) and backend (Node.js Express)
- **Brevo**: Email service provider for sending OTP emails
- **OTP**: One-Time Password for user authentication
- **Supabase**: PostgreSQL database service used for data persistence
- **Christ University Email**: Email addresses ending with @bcah.christuniversity.in
- **Environment Configuration**: .env files containing sensitive credentials and settings

## Requirements

### Requirement 1: Fix OTP Email Delivery System

**User Story:** As a student, I want to receive OTP emails reliably, so that I can log in to the activity portal and access classroom resources.

#### Acceptance Criteria

1. WHEN the correct Brevo SMTP key is configured, THE Email_Service SHALL successfully send OTP emails to Christ University email addresses
2. WHEN an email fails to send, THE System SHALL log detailed error information and provide helpful troubleshooting guidance
3. WHEN sending an OTP email, THE System SHALL use the properly configured Brevo SMTP key from environment variables
4. WHEN configuring email services, THE System SHALL fall back to Ethereal testing service if production services fail
5. FOR ALL valid Christ University email addresses, OTP delivery success rate SHALL be 100% when credentials are correct

### Requirement 2: Clean Up Codebase Structure

**User Story:** As a developer, I want a clean, organized codebase, so that I can maintain and extend the system efficiently.

#### Acceptance Criteria

1. WHEN reviewing the controllers directory, THE System SHALL have only one OTP controller file
2. WHEN removing duplicate files, THE System SHALL preserve the most complete and functional OTP controller implementation
3. WHEN cleaning up files, THE System SHALL delete all temporary test files and backup files from production directories
4. WHEN organizing code, THE System SHALL maintain clear separation between frontend and backend components
5. THE Cleanup_Process SHALL not break any existing working functionality

### Requirement 3: Update Environment Configuration

**User Story:** As a system administrator, I want properly configured environment variables, so that all services connect correctly.

#### Acceptance Criteria

1. WHEN examining the .env files, THE System SHALL contain correct Brevo SMTP credentials
2. WHEN configuring Supabase, THE System SHALL use valid API keys and service role keys
3. WHEN setting email service, THE System SHALL specify Brevo as the primary service with fallback options
4. WHERE development environment, THE System SHALL use Ethereal for testing without requiring production credentials
5. WHEN environment variables are missing, THE System SHALL provide clear error messages and guidance

### Requirement 4: Implement End-to-End Website Testing

**User Story:** As a quality assurance engineer, I want comprehensive testing of all website features, so that I can ensure the portal works correctly for students.

#### Acceptance Criteria

1. WHEN testing OTP flow, THE Tester SHALL verify email sending, delivery, and verification from frontend to backend
2. WHEN testing authentication, THE Tester SHALL verify login state persistence across page navigation
3. WHEN testing database operations, THE Tester SHALL verify user creation, activity logging, and data retrieval
4. WHEN testing frontend components, THE Tester SHALL verify all pages render correctly and interact properly
5. WHERE testing reveals bugs, THE System SHALL log detailed reproduction steps and error information

### Requirement 5: Fix Database Connectivity Issues

**User Story:** As a database administrator, I want reliable database connections, so that user data is properly stored and retrieved.

#### Acceptance Criteria

1. WHEN connecting to Supabase, THE System SHALL establish successful connections with provided credentials
2. WHEN Row Level Security policies block operations, THE System SHALL either adjust policies or handle errors gracefully
3. WHEN storing user data, THE System SHALL prevent duplicate entries for the same email address
4. WHEN retrieving activity logs, THE System SHALL return accurate and complete records
5. WHERE database operations fail, THE System SHALL provide informative error messages without exposing sensitive data

### Requirement 6: Verify System Health Monitoring

**User Story:** As a system operator, I want health monitoring and logging, so that I can diagnose issues quickly.

#### Acceptance Criteria

1. THE System SHALL provide a health check endpoint that reports backend status
2. WHEN errors occur, THE System SHALL log detailed information with timestamps and context
3. WHERE email service fails, THE System SHALL log specific authentication or connection errors
4. WHEN OTP verification fails, THE System SHALL log attempt counts and lockout information
5. THE Logging_System SHALL not expose sensitive credentials in log output

### Requirement 7: Complete OTP System Implementation

**User Story:** As a user, I want a complete OTP authentication system, so that I can securely access the portal.

#### Acceptance Criteria

1. WHEN requesting OTP, THE System SHALL validate email domain format (@bcah.christuniversity.in)
2. WHERE invalid email domain, THE System SHALL reject the request with clear error message
3. WHEN OTP is sent, THE System SHALL enforce 30-second cooldown before resend
4. WHERE multiple failed attempts, THE System SHALL implement temporary lockout (2 minutes after 5 attempts)
5. WHEN OTP expires, THE System SHALL require new OTP request after 90 seconds
6. WHERE successful verification, THE System SHALL create or update user record and maintain login session

### Requirement 8: Test Frontend-Backend Integration

**User Story:** As a full-stack developer, I want seamless frontend-backend integration, so that the application works as a cohesive unit.

#### Acceptance Criteria

1. WHEN frontend sends OTP request, THE Backend SHALL receive and process it correctly
2. WHERE CORS issues, THE System SHALL properly configure cross-origin resource sharing
3. WHEN frontend submits OTP verification, THE Backend SHALL validate and respond appropriately
4. WHERE API responses contain errors, THE Frontend SHALL display user-friendly messages
5. WHEN user logs in, THE Frontend SHALL maintain authentication state across page loads
6. WHERE session expires, THE System SHALL redirect to login page with appropriate message

### Requirement 9: Document System Configuration

**User Story:** As a new team member, I want comprehensive documentation, so that I can understand and work with the system.

#### Acceptance Criteria

1. THE Documentation SHALL include environment setup instructions for both development and production
2. WHERE email configuration, THE Documentation SHALL provide step-by-step guides for Brevo and Gmail setup
3. WHEN database setup, THE Documentation SHALL explain Supabase configuration and RLS policies
4. WHERE testing procedures, THE Documentation SHALL outline comprehensive end-to-end test scenarios
5. THE Documentation SHALL be maintained in the repository alongside code changes

### Requirement 10: Validate All Bug Fixes

**User Story:** As a project manager, I want validated bug fixes, so that I can be confident the system is production-ready.

#### Acceptance Criteria

1. FOR EACH identified bug, THE System SHALL have a corresponding fix implemented and tested
2. WHERE fixes involve configuration changes, THE System SHALL verify all affected components work correctly
3. WHEN fixes are complete, THE System SHALL pass all defined test scenarios
4. WHERE new issues are discovered during testing, THE System SHALL address them before final validation
5. THE Final_Validation SHALL confirm OTP delivery, verification, and full website functionality