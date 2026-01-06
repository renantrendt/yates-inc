-- ============================================
-- YATES INC. INBOX SYSTEM - COMPLETE SQL SETUP
-- ============================================
-- Run this entire script in your Supabase SQL Editor
-- This sets up the complete inbox/messaging system
-- ============================================

-- Step 1: Update Employees Table (Add Mail Handles)
-- ------------------------------------------------
ALTER TABLE employees ADD COLUMN IF NOT EXISTS mail_handle TEXT;

-- Update existing employees with their mail handles
UPDATE employees SET mail_handle = 'ceorequest.mail' WHERE id = '000001';
UPDATE employees SET mail_handle = 'micelCPS.mail' WHERE id = '39187';
UPDATE employees SET mail_handle = 'partnershiprqs.mail' WHERE id = '123456';
UPDATE employees SET mail_handle = 'custumerspp.mail' WHERE id = '007411';
UPDATE employees SET mail_handle = 'supplychainH.mail' WHERE id = '674121';


-- Step 2: Create Conversations Table
-- -----------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  participants TEXT[] NOT NULL, -- Array of employee IDs
  participant_names TEXT[] NOT NULL,
  participant_mails TEXT[] NOT NULL,
  last_message TEXT NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_for JSONB DEFAULT '{}', -- Object with employee_id as key and unread count as value
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations (last_message_at DESC);


-- Step 3: Create Messages Table
-- ------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES employees(id),
  sender_name TEXT NOT NULL,
  sender_mail TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);


-- Step 4: Optional - Add Sample Conversation for Testing
-- -------------------------------------------------------
DO $$
DECLARE
  conv_id UUID;
BEGIN
  -- Insert conversation
  INSERT INTO conversations (
    subject,
    participants,
    participant_names,
    participant_mails,
    last_message,
    last_message_at,
    unread_for,
    priority
  ) VALUES (
    'Test Inbox System',
    ARRAY['000001', '39187'],
    ARRAY['Logan Wall Fencer', 'Mr. Michael Mackenzy McKale Mackelayne'],
    ARRAY['ceorequest.mail', 'micelCPS.mail'],
    'Hey Logan, just testing out the new inbox system!',
    NOW(),
    '{"000001": 1, "39187": 0}'::jsonb,
    'normal'
  ) RETURNING id INTO conv_id;

  -- Insert initial message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    sender_name,
    sender_mail,
    content,
    is_read
  ) VALUES (
    conv_id,
    '39187',
    'Mr. Michael Mackenzy McKale Mackelayne',
    'micelCPS.mail',
    'Hey Logan, just testing out the new inbox system!',
    false
  );
END $$;


-- ============================================
-- DONE! Your inbox system is ready to use.
-- ============================================


