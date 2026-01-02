-- User Game Data Table
-- Stores: game money, stocks, stock profits, premium wallet
-- Run this in your Supabase SQL Editor

-- Table for user game/stock data
CREATE TABLE IF NOT EXISTS user_game_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE, -- Can be employee ID or client ID
  user_type TEXT NOT NULL CHECK (user_type IN ('employee', 'client')),
  
  -- Game State
  yates_dollars DECIMAL(20, 2) DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  current_pickaxe_id INTEGER DEFAULT 1,
  current_rock_id INTEGER DEFAULT 1,
  current_rock_hp INTEGER DEFAULT 10,
  rocks_mined_count INTEGER DEFAULT 0,
  owned_pickaxe_ids INTEGER[] DEFAULT ARRAY[1],
  coupons_30 INTEGER DEFAULT 0,
  coupons_50 INTEGER DEFAULT 0,
  coupons_100 INTEGER DEFAULT 0,
  has_seen_cutscene BOOLEAN DEFAULT false,
  
  -- Stock State
  stocks_owned INTEGER DEFAULT 0,
  stock_profits DECIMAL(20, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for purchased premium items
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('employee', 'client')),
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('cash', 'stocks')),
  amount_paid DECIMAL(20, 2) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, product_id) -- Each user can only buy each item once
);

-- Enable RLS
ALTER TABLE user_game_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust for production)
CREATE POLICY "Allow all on user_game_data" ON user_game_data
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on user_purchases" ON user_purchases
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_game_data_user_id ON user_game_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);

