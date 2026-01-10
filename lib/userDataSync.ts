import { supabase } from './supabase';

export interface UserGameData {
  user_id: string;
  user_type: 'employee' | 'client';
  yates_dollars: number;
  total_clicks: number;
  current_pickaxe_id: number;
  current_rock_id: number;
  current_rock_hp: number;
  rocks_mined_count: number;
  owned_pickaxe_ids: number[];
  coupons_30: number;
  coupons_50: number;
  coupons_100: number;
  has_seen_cutscene: boolean;
  has_autoclicker?: boolean;
  autoclicker_enabled?: boolean;
  prestige_count?: number;
  prestige_multiplier?: number;
  stocks_owned?: number;
  stock_profits?: number;
  // Anti-cheat fields
  anti_cheat_warnings?: number;
  is_on_watchlist?: boolean;
  is_blocked?: boolean;
  appeal_pending?: boolean;
  // Trinkets
  owned_trinket_ids?: string[];
  equipped_trinket_ids?: string[];
  trinket_shop_items?: unknown[];
  trinket_shop_last_refresh?: number;
  has_totem_protection?: boolean;
  // Miners
  miner_count?: number;
  miner_last_tick?: number;
  // Prestige upgrades
  prestige_tokens?: number;
  owned_prestige_upgrade_ids?: string[];
  auto_prestige_enabled?: boolean;
  // Achievements
  unlocked_achievement_ids?: string[];
}

export interface UserPurchase {
  user_id: string;
  user_type: 'employee' | 'client';
  product_id: number;
  product_name: string;
  purchase_type: 'cash' | 'stocks';
  amount_paid: number;
}

// Fetch user game data from Supabase
export async function fetchUserGameData(userId: string): Promise<UserGameData | null> {
  try {
    console.log('📥 SUPABASE FETCH: Loading data for', userId);
    
    const { data, error } = await supabase
      .from('user_game_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ SUPABASE FETCH FAILED:', error.message, error.details);
      return null;
    }

    if (data) {
      console.log('✅ SUPABASE FETCH SUCCESS:', { prestige: data.prestige_count, clicks: data.total_clicks, dollars: data.yates_dollars });
    } else {
      console.log('⚠️ SUPABASE: No data found for user');
    }

    return data as UserGameData || null;
  } catch (err) {
    console.error('❌ SUPABASE FETCH EXCEPTION:', err);
    return null;
  }
}

// Save/update user game data to Supabase
export async function saveUserGameData(data: Partial<UserGameData> & { user_id: string; user_type: 'employee' | 'client' }, versionAtCallTime?: number): Promise<boolean> {
  try {
    const fullData = {
      user_id: data.user_id,
      user_type: data.user_type,
      yates_dollars: data.yates_dollars,
      total_clicks: data.total_clicks,
      current_pickaxe_id: data.current_pickaxe_id,
      current_rock_id: data.current_rock_id,
      current_rock_hp: data.current_rock_hp,
      rocks_mined_count: data.rocks_mined_count,
      owned_pickaxe_ids: data.owned_pickaxe_ids,
      coupons_30: data.coupons_30,
      coupons_50: data.coupons_50,
      coupons_100: data.coupons_100,
      has_seen_cutscene: data.has_seen_cutscene,
      updated_at: new Date().toISOString(),
      has_autoclicker: data.has_autoclicker,
      autoclicker_enabled: data.autoclicker_enabled,
      prestige_count: data.prestige_count,
      prestige_multiplier: data.prestige_multiplier,
      anti_cheat_warnings: data.anti_cheat_warnings,
      is_on_watchlist: data.is_on_watchlist,
      is_blocked: data.is_blocked,
      appeal_pending: data.appeal_pending,
      owned_trinket_ids: data.owned_trinket_ids,
      equipped_trinket_ids: data.equipped_trinket_ids,
      trinket_shop_items: data.trinket_shop_items,
      trinket_shop_last_refresh: data.trinket_shop_last_refresh,
      has_totem_protection: data.has_totem_protection,
      miner_count: data.miner_count,
      miner_last_tick: data.miner_last_tick,
      prestige_tokens: data.prestige_tokens,
      owned_prestige_upgrade_ids: data.owned_prestige_upgrade_ids,
      auto_prestige_enabled: data.auto_prestige_enabled,
      unlocked_achievement_ids: data.unlocked_achievement_ids,
    };

    // FINAL CHECK: If version was provided and has changed, skip this save (a force save happened)
    // This check happens RIGHT BEFORE the DB call to catch race conditions
    if (versionAtCallTime !== undefined && versionAtCallTime !== saveVersion) {
      console.log('🚫 SAVE ABORTED: Force save happened during preparation', { 
        versionAtCallTime, 
        currentVersion: saveVersion,
        wouldHaveSaved: { prestige: data.prestige_count, clicks: data.total_clicks }
      });
      return true; // Return true so it doesn't retry
    }

    console.log('📤 SUPABASE SAVE:', { prestige: data.prestige_count, clicks: data.total_clicks, dollars: data.yates_dollars });
    
    const { error } = await supabase
      .from('user_game_data')
      .upsert(fullData, { onConflict: 'user_id' });

    if (error) {
      console.error('❌ SUPABASE SAVE FAILED:', error.message, error.details, error.hint);
      return false;
    }
    
    console.log('✅ SUPABASE SAVE SUCCESS');
    return true;
  } catch (err) {
    console.error('❌ SUPABASE SAVE EXCEPTION:', err);
    return false;
  }
}

// Fetch user purchases from Supabase
export async function fetchUserPurchases(userId: string): Promise<UserPurchase[]> {
  try {
    const { data, error } = await supabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user purchases:', error);
      return [];
    }

    return (data as UserPurchase[]) || [];
  } catch (err) {
    console.error('Error fetching user purchases:', err);
    return [];
  }
}

// Save a purchase to Supabase
export async function savePurchase(purchase: UserPurchase): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_purchases')
      .upsert(purchase, {
        onConflict: 'user_id,product_id',
      });

    if (error) {
      console.error('Error saving purchase:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error saving purchase:', err);
    return false;
  }
}

// Throttled save - saves at most every SAVE_INTERVAL ms
const SAVE_INTERVAL = 5000; // Save every 5 seconds max (reduced network spam)
const FORCE_SAVE_COOLDOWN = 5000; // Block regular saves for 5s after force save (just enough to clear stale React closures)
let saveTimeout: NodeJS.Timeout | null = null;
let pendingData: (Partial<UserGameData> & { user_id: string; user_type: 'employee' | 'client' }) | null = null;
let lastSaveTime = 0;
let isSaving = false;
let saveVersion = 0; // Increments on force save to invalidate old in-flight saves
let lastForceSaveTime = 0; // Track when force save happened to block stale saves

export function debouncedSaveUserGameData(data: Partial<UserGameData> & { user_id: string; user_type: 'employee' | 'client' }): void {
  // Block saves during cooldown after force save (prevents stale useEffect data from overwriting)
  const timeSinceForceSave = Date.now() - lastForceSaveTime;
  if (timeSinceForceSave < FORCE_SAVE_COOLDOWN) {
    console.log('🚫 DEBOUNCED SAVE BLOCKED: Force save cooldown active', { 
      timeSinceForceSave, 
      cooldown: FORCE_SAVE_COOLDOWN,
      blockedPrestige: data.prestige_count 
    });
    return;
  }
  
  // Accumulate latest data
  pendingData = { ...pendingData, ...data };
  
  const now = Date.now();
  const timeSinceLastSave = now - lastSaveTime;
  
  // If enough time has passed and we're not already saving, save immediately
  if (timeSinceLastSave >= SAVE_INTERVAL && !isSaving) {
    executeSave();
  } else if (!saveTimeout) {
    // Schedule a save for when the interval completes
    const timeUntilNextSave = Math.max(0, SAVE_INTERVAL - timeSinceLastSave);
    saveTimeout = setTimeout(() => {
      if (pendingData && !isSaving) {
        executeSave();
      }
    }, timeUntilNextSave);
  }
}

async function executeSave(): Promise<void> {
  if (!pendingData || isSaving) return;
  
  // Check cooldown BEFORE executing - this catches saves that were queued before prestige
  const timeSinceForceSave = Date.now() - lastForceSaveTime;
  if (timeSinceForceSave < FORCE_SAVE_COOLDOWN) {
    console.log('🚫 EXECUTE SAVE BLOCKED: Force save cooldown active', { 
      timeSinceForceSave, 
      cooldown: FORCE_SAVE_COOLDOWN,
      blockedPrestige: pendingData.prestige_count 
    });
    pendingData = null; // Clear the stale data
    return;
  }
  
  isSaving = true;
  const dataToSave = pendingData;
  const versionAtStart = saveVersion; // Capture version before async operation
  pendingData = null;
  lastSaveTime = Date.now();
  
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  
  try {
    // Check if a force save happened while we were preparing
    if (saveVersion !== versionAtStart) {
      console.log('🚫 DEBOUNCED SAVE SKIPPED: Force save happened, version changed');
      return;
    }
    // Pass version so saveUserGameData can double-check before actual DB write
    await saveUserGameData(dataToSave, versionAtStart);
  } catch {
    // Put the data back if save failed
    pendingData = { ...(dataToSave || {}), ...(pendingData || {}) } as UserGameData;
  } finally {
    isSaving = false;
  }
}

// Force immediate save (call on logout or page unload)
export async function flushPendingData(): Promise<void> {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  
  if (pendingData && !isSaving) {
    isSaving = true;
    const dataToSave = pendingData;
    pendingData = null;
    
    try {
      await saveUserGameData(dataToSave);
    } catch (err) {
      console.error('Failed to flush game data:', err);
    } finally {
      isSaving = false;
    }
  }
}

// Force immediate save with specific data (bypass debounce completely)
// Use this after critical actions like prestige
export async function forceImmediateSave(data: Partial<UserGameData> & { user_id: string; user_type: 'employee' | 'client' }): Promise<boolean> {
  console.log('⚡ FORCE SAVE: Bypassing debounce...', { prestige: data.prestige_count, clicks: data.total_clicks });
  
  // Increment version to invalidate any in-flight debounced saves
  saveVersion++;
  // Set cooldown to block stale saves from useEffects that captured old state
  lastForceSaveTime = Date.now();
  console.log('⚡ FORCE SAVE: Invalidated old saves, version now:', saveVersion, '+ 2s cooldown active');
  
  // Clear any pending debounced save
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  pendingData = null;
  
  // Save immediately
  try {
    const result = await saveUserGameData(data);
    lastSaveTime = Date.now();
    console.log('⚡ FORCE SAVE RESULT:', result ? '✅ SUCCESS' : '❌ FAILED');
    return result;
  } catch (err) {
    console.error('⚡ FORCE SAVE EXCEPTION:', err);
    return false;
  }
}
