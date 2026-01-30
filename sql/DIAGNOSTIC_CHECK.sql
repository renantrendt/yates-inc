-- =====================================================
-- DIAGNOSTIC CHECK - Verify Full Schema for user_game_data
-- Run this in Supabase SQL Editor to check your setup
-- =====================================================

-- =====================================================
-- STEP 1: Check all expected columns exist
-- =====================================================
-- This query shows which columns are MISSING
WITH expected_columns AS (
  SELECT unnest(ARRAY[
    -- Base table (USER_DATA_SQL.sql)
    'id', 'user_id', 'user_type', 'yates_dollars', 'total_clicks',
    'current_pickaxe_id', 'current_rock_id', 'current_rock_hp',
    'rocks_mined_count', 'owned_pickaxe_ids', 'coupons_30', 'coupons_50',
    'coupons_100', 'has_seen_cutscene', 'stocks_owned', 'stock_profits',
    'created_at', 'updated_at',
    -- ADD_MISSING_GAME_COLUMNS.sql
    'prestige_count', 'prestige_multiplier', 'has_autoclicker', 'autoclicker_enabled',
    -- ANTICHEAT_SQL.sql
    'anti_cheat_warnings', 'is_on_watchlist', 'is_blocked', 'appeal_pending',
    -- TRINKETS_MINERS_PRESTIGE.sql
    'owned_trinket_ids', 'equipped_trinket_ids', 'trinket_shop_items',
    'trinket_shop_last_refresh', 'has_totem_protection', 'miner_count',
    'miner_last_tick', 'prestige_tokens', 'owned_prestige_upgrade_ids',
    'auto_prestige_enabled',
    -- RANKINGS_SQL.sql
    'total_money_earned', 'game_start_time', 'fastest_prestige_time',
    'owned_title_ids', 'equipped_title_ids', 'title_win_counts',
    -- FIX_MISSING_COLUMNS.sql (previously missing!)
    'has_stocks_unlocked', 'unlocked_achievement_ids',
    -- PATH_SYSTEM.sql
    'chosen_path', 'golden_cookie_ritual_active', 'sacrifice_buff',
    'admin_commands_until', 'show_path_selection',
    -- FIX_INTEGER_OVERFLOW.sql (tax + playtime)
    'last_tax_time', 'total_playtime_seconds'
  ]) AS column_name
),
actual_columns AS (
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'user_game_data'
)
SELECT 
  e.column_name,
  CASE WHEN a.column_name IS NULL THEN '❌ MISSING' ELSE '✅ EXISTS' END AS status
FROM expected_columns e
LEFT JOIN actual_columns a ON e.column_name = a.column_name
ORDER BY 
  CASE WHEN a.column_name IS NULL THEN 0 ELSE 1 END,
  e.column_name;

-- =====================================================
-- STEP 2: Show actual column types for verification
-- =====================================================
SELECT 
  column_name,
  data_type,
  udt_name,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_game_data'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 3: Check RLS is enabled
-- =====================================================
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END AS rls_status
FROM pg_tables 
WHERE tablename = 'user_game_data';

-- =====================================================
-- STEP 4: Check RLS policies exist
-- =====================================================
SELECT 
  policyname,
  permissive,
  cmd AS applies_to,
  qual AS using_expression,
  with_check
FROM pg_policies 
WHERE tablename = 'user_game_data';

-- =====================================================
-- STEP 5: Check indexes exist for performance
-- =====================================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'user_game_data';

-- =====================================================
-- STEP 6: Quick data integrity check
-- =====================================================
SELECT 
  COUNT(*) AS total_users,
  COUNT(CASE WHEN user_type = 'employee' THEN 1 END) AS employees,
  COUNT(CASE WHEN user_type = 'client' THEN 1 END) AS clients,
  MAX(updated_at) AS last_save_time
FROM user_game_data;

-- =====================================================
-- HELPFUL: If you need to run all migrations in order
-- =====================================================
-- 1. USER_DATA_SQL.sql (base table)
-- 2. ADD_MISSING_GAME_COLUMNS.sql (prestige, autoclicker)
-- 3. ANTICHEAT_SQL.sql (anti-cheat columns)
-- 4. TRINKETS_MINERS_PRESTIGE.sql (trinkets, miners, prestige upgrades)
-- 5. RANKINGS_SQL.sql (ranking system, titles)
-- 6. FIX_MISSING_COLUMNS.sql (stocks unlock, achievements)
-- 7. PATH_SYSTEM.sql (light/darkness path system)
-- 8. FIX_INTEGER_OVERFLOW.sql (CRITICAL! Fix total_clicks, add tax/playtime)