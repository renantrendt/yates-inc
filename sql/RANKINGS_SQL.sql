-- =====================================================
-- RANKINGS SYSTEM
-- Tracks leaderboards: Most Money, Fastest Game, Most Prestiges
-- =====================================================

-- STEP 1: Add ranking columns to user_game_data (RUN THIS FIRST!)
-- These columns track all-time stats for leaderboards
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS total_money_earned BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS game_start_time BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS fastest_prestige_time BIGINT DEFAULT NULL;

-- STEP 2: Add Pro Player Title columns
ALTER TABLE user_game_data
ADD COLUMN IF NOT EXISTS owned_title_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipped_title_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS title_win_counts JSONB DEFAULT '{}';

-- Index for fast leaderboard queries on user_game_data
CREATE INDEX IF NOT EXISTS idx_user_game_data_money ON user_game_data (total_money_earned DESC);
CREATE INDEX IF NOT EXISTS idx_user_game_data_speed ON user_game_data (fastest_prestige_time ASC) WHERE fastest_prestige_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_game_data_prestiges ON user_game_data (prestige_count DESC);

-- =====================================================
-- OPTIONAL: Full Rankings System with Periods (for later)
-- Only run this if you want 3-day rotating periods with title awards
-- =====================================================

-- Rankings table - stores player scores for current period
CREATE TABLE IF NOT EXISTS rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('employee', 'client')),
  username TEXT NOT NULL,
  
  -- Ranking scores
  total_money_earned BIGINT DEFAULT 0,          -- All-time money earned this period
  fastest_prestige_time BIGINT DEFAULT NULL,    -- Time in ms from game start to first prestige (NULL = never prestiged)
  total_prestiges INTEGER DEFAULT 0,            -- Total prestiges this period
  
  -- Period tracking
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint per user per period
  UNIQUE(user_id, period_start)
);

-- Indexes for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_rankings_money ON rankings (total_money_earned DESC);
CREATE INDEX IF NOT EXISTS idx_rankings_speed ON rankings (fastest_prestige_time ASC) WHERE fastest_prestige_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rankings_prestiges ON rankings (total_prestiges DESC);
CREATE INDEX IF NOT EXISTS idx_rankings_period ON rankings (period_start, period_end);

-- Ranking periods table - tracks when periods start/end
CREATE TABLE IF NOT EXISTS ranking_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Winners (filled when period ends)
  money_1st_user_id TEXT,
  money_2nd_user_id TEXT,
  speed_1st_user_id TEXT,
  speed_2nd_user_id TEXT,
  prestige_1st_user_id TEXT,
  prestige_2nd_user_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Title wins tracking - how many times a user has won each title
CREATE TABLE IF NOT EXISTS title_wins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('employee', 'client')),
  
  -- Win counts per title
  money_greedy_wins INTEGER DEFAULT 0,      -- 1st place money
  almost_there_wins INTEGER DEFAULT 0,       -- 2nd place money
  speedrunner_wins INTEGER DEFAULT 0,        -- 1st place speed
  just_2_seconds_wins INTEGER DEFAULT 0,     -- 2nd place speed
  game_grinder_wins INTEGER DEFAULT 0,       -- 1st place prestiges
  how_many_hours_wins INTEGER DEFAULT 0,     -- 2nd place prestiges
  
  -- Total wins (for Da Goat tracking)
  total_title_wins INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Function to get current active period (creates one if none exists)
CREATE OR REPLACE FUNCTION get_or_create_current_period()
RETURNS ranking_periods AS $$
DECLARE
  current_period ranking_periods;
  period_duration INTERVAL := '3 days';
BEGIN
  -- Check for active period
  SELECT * INTO current_period
  FROM ranking_periods
  WHERE is_active = TRUE
  AND NOW() BETWEEN period_start AND period_end
  LIMIT 1;
  
  -- If no active period, create one
  IF current_period IS NULL THEN
    -- First, close any old periods
    UPDATE ranking_periods SET is_active = FALSE WHERE is_active = TRUE;
    
    -- Create new period
    INSERT INTO ranking_periods (period_start, period_end, is_active)
    VALUES (NOW(), NOW() + period_duration, TRUE)
    RETURNING * INTO current_period;
  END IF;
  
  RETURN current_period;
END;
$$ LANGUAGE plpgsql;

-- Function to update a user's ranking scores
CREATE OR REPLACE FUNCTION update_ranking_scores(
  p_user_id TEXT,
  p_user_type TEXT,
  p_username TEXT,
  p_money_earned BIGINT DEFAULT 0,
  p_prestige_time BIGINT DEFAULT NULL,
  p_prestiges INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  current_period ranking_periods;
BEGIN
  -- Get current period
  SELECT * INTO current_period FROM get_or_create_current_period();
  
  -- Upsert ranking entry
  INSERT INTO rankings (
    user_id, user_type, username,
    total_money_earned, fastest_prestige_time, total_prestiges,
    period_start, period_end
  )
  VALUES (
    p_user_id, p_user_type, p_username,
    p_money_earned, p_prestige_time, p_prestiges,
    current_period.period_start, current_period.period_end
  )
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    total_money_earned = GREATEST(rankings.total_money_earned, EXCLUDED.total_money_earned),
    fastest_prestige_time = CASE 
      WHEN rankings.fastest_prestige_time IS NULL THEN EXCLUDED.fastest_prestige_time
      WHEN EXCLUDED.fastest_prestige_time IS NULL THEN rankings.fastest_prestige_time
      ELSE LEAST(rankings.fastest_prestige_time, EXCLUDED.fastest_prestige_time)
    END,
    total_prestiges = GREATEST(rankings.total_prestiges, EXCLUDED.total_prestiges),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- View for current leaderboards
CREATE OR REPLACE VIEW current_leaderboards AS
SELECT 
  r.*,
  ROW_NUMBER() OVER (ORDER BY r.total_money_earned DESC) as money_rank,
  ROW_NUMBER() OVER (ORDER BY r.fastest_prestige_time ASC NULLS LAST) as speed_rank,
  ROW_NUMBER() OVER (ORDER BY r.total_prestiges DESC) as prestige_rank
FROM rankings r
JOIN ranking_periods p ON r.period_start = p.period_start
WHERE p.is_active = TRUE;

-- RLS Policies
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_wins ENABLE ROW LEVEL SECURITY;

-- Everyone can read rankings (leaderboards are public)
CREATE POLICY "Rankings are viewable by everyone" ON rankings
  FOR SELECT USING (true);

-- Users can only update their own rankings
CREATE POLICY "Users can update own rankings" ON rankings
  FOR ALL USING (true);

-- Periods are viewable by everyone
CREATE POLICY "Periods are viewable by everyone" ON ranking_periods
  FOR SELECT USING (true);

-- Title wins are viewable by everyone
CREATE POLICY "Title wins are viewable by everyone" ON title_wins
  FOR SELECT USING (true);

-- Users can update their own title wins
CREATE POLICY "Users can update own title wins" ON title_wins
  FOR ALL USING (true);
