-- =============================================
-- ADD MISSING COLUMNS: Relics, Talismans, Premium, Buildings, Stokens, Lottery
-- Run this on BOTH user_game_data and user_game_hard_data tables
-- =============================================

-- user_game_data (Normal Mode)
ALTER TABLE user_game_data
ADD COLUMN IF NOT EXISTS owned_relic_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS owned_talisman_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS owned_premium_product_ids INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS buildings_data TEXT,
ADD COLUMN IF NOT EXISTS stokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lottery_tickets INTEGER DEFAULT 0;

-- user_game_hard_data (Hard Mode)
ALTER TABLE user_game_hard_data
ADD COLUMN IF NOT EXISTS owned_relic_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS owned_talisman_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS owned_premium_product_ids INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS buildings_data TEXT,
ADD COLUMN IF NOT EXISTS stokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lottery_tickets INTEGER DEFAULT 0;
