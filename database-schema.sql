-- Finlay Brewer International - Database Schema
-- Run this script in pgAdmin to create the database schema on Render PostgreSQL
-- This script is idempotent - safe to run multiple times

-- Create leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    name VARCHAR(255),
    email VARCHAR(255),
    email_address VARCHAR(255),
    phone VARCHAR(255),
    phone_number VARCHAR(255),
    country_code VARCHAR(50),
    phone_full VARCHAR(255),
    property VARCHAR(500),
    message TEXT,
    best_time_to_contact VARCHAR(50),
    budget_range VARCHAR(255),
    lead_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email, email_address);

-- Create index on timestamp for sorting
CREATE INDEX IF NOT EXISTS idx_leads_timestamp ON leads(timestamp DESC);

-- Create index on best_time_to_contact for filtering
CREATE INDEX IF NOT EXISTS idx_leads_best_time ON leads(best_time_to_contact);

-- Create index on budget_range for filtering
CREATE INDEX IF NOT EXISTS idx_leads_budget_range ON leads(budget_range);

-- Add comments to table and columns for documentation
COMMENT ON TABLE leads IS 'Stores contact form submissions and property inquiries';
COMMENT ON COLUMN leads.id IS 'Primary key, auto-incrementing';
COMMENT ON COLUMN leads.timestamp IS 'When the lead was submitted';
COMMENT ON COLUMN leads.first_name IS 'First name from contact form';
COMMENT ON COLUMN leads.last_name IS 'Last name from contact form';
COMMENT ON COLUMN leads.name IS 'Full name from property inquiry form';
COMMENT ON COLUMN leads.email IS 'Email from property inquiry form';
COMMENT ON COLUMN leads.email_address IS 'Email from contact form';
COMMENT ON COLUMN leads.phone IS 'Phone from property inquiry form';
COMMENT ON COLUMN leads.phone_number IS 'Phone number from contact form';
COMMENT ON COLUMN leads.country_code IS 'Country code (e.g., +1, +33)';
COMMENT ON COLUMN leads.phone_full IS 'Combined country code and phone number';
COMMENT ON COLUMN leads.property IS 'Property name/title for property inquiries';
COMMENT ON COLUMN leads.message IS 'Message from the user';
COMMENT ON COLUMN leads.best_time_to_contact IS 'Preferred contact time: morning time or afternoon time';
COMMENT ON COLUMN leads.budget_range IS 'Budget range from contact form (e.g., €500,000 - €1,000,000)';
COMMENT ON COLUMN leads.lead_data IS 'Full form data stored as JSONB for flexibility';
COMMENT ON COLUMN leads.created_at IS 'Record creation timestamp';

-- Verify table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

