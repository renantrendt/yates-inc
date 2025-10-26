# Inbox System - Supabase SQL Setup

Run these SQL commands in your Supabase SQL Editor to set up the inbox/messaging system.

## Step 1: Update Employees Table (Add Mail Handles)

```sql
-- Add mail_handle column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS mail_handle TEXT;

-- Update existing employees with their mail handles
UPDATE employees SET mail_handle = 'ceorequest.mail' WHERE id = '000001';
UPDATE employees SET mail_handle = 'micelCPS.mail' WHERE id = '39187';
UPDATE employees SET mail_handle = 'partnershiprqs.mail' WHERE id = '392318';
UPDATE employees SET mail_handle = 'custumerspp.mail' WHERE id = '007411';
```

## Step 2: Create Conversations Table

```sql
-- Create conversations table
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations (last_message_at DESC);
```

## Step 3: Create Messages Table

```sql
-- Create messages table
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
```

## Step 4: Optional - Add Sample Conversation for Testing

```sql
-- Create a sample conversation between Logan and Michael
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
```

## Features Implemented

✅ **Inbox Sidebar** - Opens from navbar with unread count badge  
✅ **Conversation List** - Shows all conversations sorted by Latest/Priority/Sent  
✅ **Message Detail** - Slides over inbox to show threaded messages  
✅ **Threading** - Back-and-forth conversation support  
✅ **Multiple Participants** - Support for group conversations  
✅ **Mail Handles** - Each employee has a unique .mail address  
✅ **Unread Counts** - Track unread messages per user  
✅ **Priority Messages** - High priority flag for important messages  
✅ **Real-time Updates** - Supabase real-time subscriptions  
✅ **Task Completion Messages** - Auto-sends message to Logan when task hits 100%

## Employee Mail Handles

- **Logan (CEO)**: ceorequest.mail
- **Michael**: micelCPS.mail
- **Bernardo**: partnershiprqs.mail
- **Dylan**: custumerspp.mail

## Usage

1. Login as an employee
2. Click the inbox icon (envelope) in the navbar
3. View conversations sorted by Latest/Priority/Sent
4. Click a conversation to view messages
5. Type and send replies
6. When a task reaches 100%, it auto-deletes and sends a high-priority message to Logan

## Notes

- Conversations support multiple participants (group messages)
- Messages are threaded in conversation style
- Unread counts update in real-time
- Task completion automatically creates a high-priority conversation with Logan

