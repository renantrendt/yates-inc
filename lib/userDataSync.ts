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
  // Achievements (permanently unlocked)
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
    const { data, error } = await supabase
      .from('user_game_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching game data:', error);
      return null;
    }

    return data as UserGameData || null;
  } catch (err) {
    console.error('Error fetching game data:', err);
    return null;
  }
}

// Save/update user game data to Supabase
export async function saveUserGameData(data: Partial<UserGameData> & { user_id: string; user_type: 'employee' | 'client' }): Promise<boolean> {
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
    };
    
    const { error } = await supabase
      .from('user_game_data')
      .upsert(fullData, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving game data:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error saving game data:', err);
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
let saveTimeout: NodeJS.Timeout | null = null;
let pendingData: (Partial<UserGameData> & { user_id: string; user_type: 'employee' | 'client' }) | null = null;
let lastSaveTime = 0;
let isSaving = false;

export function debouncedSaveUserGameData(data: Partial<UserGameData> & { user_id: string; user_type: 'employee' | 'client' }): void {
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
  
  isSaving = true;
  const dataToSave = pendingData;
  pendingData = null;
  lastSaveTime = Date.now();
  
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  
  try {
    await saveUserGameData(dataToSave);
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
  // Clear any pending debounced save to avoid conflicts
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  pendingData = null;
  
  // Save immediately
  try {
    const result = await saveUserGameData(data);
    lastSaveTime = Date.now();
    return result;
  } catch (err) {
    console.error('Force save failed:', err);
    return false;
  }
}
