-- ============================================
-- CLIENT REGISTRATION SYSTEM - SQL SETUP
-- ============================================
-- Run this in your Supabase SQL Editor AFTER running INBOX_COMPLETE_SQL.sql
-- ============================================

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  mail_handle TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_clients_username ON clients (username);
CREATE INDEX IF NOT EXISTS idx_clients_mail_handle ON clients (mail_handle);

-- ============================================
-- DONE! Clients can now register usernames.
-- ============================================

