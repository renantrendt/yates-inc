-- =====================================================
-- RANKING PERIODS & AUTO TITLE AWARDS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Table to track ranking periods (just one row, ever)
CREATE TABLE IF NOT EXISTS ranking_period (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Only one row ever
  period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 days'),
  is_processing BOOLEAN DEFAULT FALSE, -- Lock to prevent race conditions
  last_processed_at TIMESTAMPTZ
);

-- Insert the first period if not exists
INSERT INTO ranking_period (id, period_start, period_end)
VALUES (1, NOW(), NOW() + INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Table to log title awards (so we don't give the same title twice)
CREATE TABLE IF NOT EXISTS title_award_log (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title_id TEXT NOT NULL,
  category TEXT NOT NULL, -- 'money', 'speed', 'prestiges'
  rank INTEGER NOT NULL, -- 1 or 2
  period_end TIMESTAMPTZ NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, title_id) -- Can't get same title twice
);

-- Function to process ranking period end
-- Returns: { processed: boolean, winners: array }
CREATE OR REPLACE FUNCTION process_ranking_period()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_period RECORD;
  winner RECORD;
  winners JSONB := '[]'::JSONB;
  title_map JSONB := '{
    "money_1": "money_greedy",
    "money_2": "almost_there",
    "speed_1": "speedrunner",
    "speed_2": "just_2_more_seconds",
    "prestiges_1": "game_grinder",
    "prestiges_2": "how_many_hours"
  }'::JSONB;
BEGIN
  -- Get current period with lock
  SELECT * INTO current_period
  FROM ranking_period
  WHERE id = 1
  FOR UPDATE;
  
  -- Check if period has ended
  IF current_period.period_end > NOW() THEN
    RETURN jsonb_build_object('processed', false, 'reason', 'Period not ended yet');
  END IF;
  
  -- Check if already processing
  IF current_period.is_processing THEN
    RETURN jsonb_build_object('processed', false, 'reason', 'Already processing');
  END IF;
  
  -- Set processing flag
  UPDATE ranking_period SET is_processing = TRUE WHERE id = 1;
  
  -- Award titles for MONEY category (top 2)
  FOR winner IN
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_money_earned DESC) as rank
    FROM user_game_data
    WHERE total_money_earned > 0
    ORDER BY total_money_earned DESC
    LIMIT 2
  LOOP
    IF winner.rank <= 2 THEN
      -- Try to award title (will fail silently if already has it)
      INSERT INTO title_award_log (user_id, title_id, category, rank, period_end)
      VALUES (
        winner.user_id,
        title_map->>('money_' || winner.rank),
        'money',
        winner.rank,
        current_period.period_end
      )
      ON CONFLICT (user_id, title_id) DO NOTHING;
      
      -- Add to user's owned titles
      UPDATE user_game_data
      SET owned_title_ids = array_append(
        COALESCE(owned_title_ids, '{}'),
        title_map->>'money_' || winner.rank
      )
      WHERE user_id = winner.user_id
        AND NOT (title_map->>'money_' || winner.rank = ANY(COALESCE(owned_title_ids, '{}')));
      
      -- Update win counts
      UPDATE user_game_data
      SET title_win_counts = COALESCE(title_win_counts, '{}'::jsonb) || 
        jsonb_build_object(
          title_map->>'money_' || winner.rank,
          COALESCE((title_win_counts->>title_map->>'money_' || winner.rank)::int, 0) + 1
        )
      WHERE user_id = winner.user_id;
      
      winners := winners || jsonb_build_object('user_id', winner.user_id, 'category', 'money', 'rank', winner.rank);
    END IF;
  END LOOP;
  
  -- Award titles for SPEED category (top 2)
  FOR winner IN
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY fastest_prestige_time ASC) as rank
    FROM user_game_data
    WHERE fastest_prestige_time IS NOT NULL AND fastest_prestige_time > 0
    ORDER BY fastest_prestige_time ASC
    LIMIT 2
  LOOP
    IF winner.rank <= 2 THEN
      INSERT INTO title_award_log (user_id, title_id, category, rank, period_end)
      VALUES (
        winner.user_id,
        title_map->>('speed_' || winner.rank),
        'speed',
        winner.rank,
        current_period.period_end
      )
      ON CONFLICT (user_id, title_id) DO NOTHING;
      
      UPDATE user_game_data
      SET owned_title_ids = array_append(
        COALESCE(owned_title_ids, '{}'),
        title_map->>'speed_' || winner.rank
      )
      WHERE user_id = winner.user_id
        AND NOT (title_map->>'speed_' || winner.rank = ANY(COALESCE(owned_title_ids, '{}')));
      
      UPDATE user_game_data
      SET title_win_counts = COALESCE(title_win_counts, '{}'::jsonb) || 
        jsonb_build_object(
          title_map->>'speed_' || winner.rank,
          COALESCE((title_win_counts->>title_map->>'speed_' || winner.rank)::int, 0) + 1
        )
      WHERE user_id = winner.user_id;
      
      winners := winners || jsonb_build_object('user_id', winner.user_id, 'category', 'speed', 'rank', winner.rank);
    END IF;
  END LOOP;
  
  -- Award titles for PRESTIGES category (top 2)
  FOR winner IN
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY prestige_count DESC) as rank
    FROM user_game_data
    WHERE prestige_count > 0
    ORDER BY prestige_count DESC
    LIMIT 2
  LOOP
    IF winner.rank <= 2 THEN
      INSERT INTO title_award_log (user_id, title_id, category, rank, period_end)
      VALUES (
        winner.user_id,
        title_map->>('prestiges_' || winner.rank),
        'prestiges',
        winner.rank,
        current_period.period_end
      )
      ON CONFLICT (user_id, title_id) DO NOTHING;
      
      UPDATE user_game_data
      SET owned_title_ids = array_append(
        COALESCE(owned_title_ids, '{}'),
        title_map->>'prestiges_' || winner.rank
      )
      WHERE user_id = winner.user_id
        AND NOT (title_map->>'prestiges_' || winner.rank = ANY(COALESCE(owned_title_ids, '{}')));
      
      UPDATE user_game_data
      SET title_win_counts = COALESCE(title_win_counts, '{}'::jsonb) || 
        jsonb_build_object(
          title_map->>'prestiges_' || winner.rank,
          COALESCE((title_win_counts->>title_map->>'prestiges_' || winner.rank)::int, 0) + 1
        )
      WHERE user_id = winner.user_id;
      
      winners := winners || jsonb_build_object('user_id', winner.user_id, 'category', 'prestiges', 'rank', winner.rank);
    END IF;
  END LOOP;
  
  -- Check for Da Goat (3+ title wins total)
  UPDATE user_game_data
  SET owned_title_ids = array_append(COALESCE(owned_title_ids, '{}'), 'da_goat')
  WHERE user_id IN (
    SELECT user_id FROM title_award_log
    GROUP BY user_id
    HAVING COUNT(*) >= 3
  )
  AND NOT ('da_goat' = ANY(COALESCE(owned_title_ids, '{}')));
  
  -- Reset ranking stats for new period (optional - comment out if you want cumulative)
  -- UPDATE user_game_data SET 
  --   total_money_earned = 0,
  --   fastest_prestige_time = NULL;
  
  -- Start new period
  UPDATE ranking_period SET 
    period_start = NOW(),
    period_end = NOW() + INTERVAL '3 days',
    is_processing = FALSE,
    last_processed_at = NOW()
  WHERE id = 1;
  
  RETURN jsonb_build_object('processed', true, 'winners', winners);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_ranking_period() TO authenticated;
GRANT EXECUTE ON FUNCTION process_ranking_period() TO anon;

-- RLS for ranking_period (everyone can read, nobody can write directly)
ALTER TABLE ranking_period ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ranking period" ON ranking_period FOR SELECT USING (true);

-- RLS for title_award_log
ALTER TABLE title_award_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read title awards" ON title_award_log FOR SELECT USING (true);
