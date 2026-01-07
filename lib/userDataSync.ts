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
  has_autoclicker?: boolean; // Optional - may not exist in DB yet
  autoclicker_enabled?: boolean; // Optional - may not exist in DB yet
  prestige_count?: number; // Optional - may not exist in DB yet
  prestige_multiplier?: number; // Optional - may not exist in DB yet
  stocks_owned?: number;
  stock_profits?: number;
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
    console.log('📡 Fetching game data for user:', userId);
    
    const { data, error } = await supabase
      .from('user_game_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching user game data:', error.message, error);
      return null;
    }

    if (data) {
      console.log('✅ Fetched game data:', { yates_dollars: data.yates_dollars, total_clicks: data.total_clicks });
    } else {
      console.log('ℹ️ No existing game data found for user');
    }

    return data as UserGameData | null;
  } catch (err) {
    console.error('Error fetching user game data:', err);
    return null;
  }
}

// Save/update user game data to Supabase
export async function saveUserGameData(data: Partial<UserGameData> & { user_id: string; user_type: 'employee' | 'client' }): Promise<boolean> {
  try {
    // Only include fields that definitely exist in the DB to avoid column errors
    const safeData = {
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
    };

    // Try to save with all optional fields
    const fullData = {
      ...safeData,
      has_autoclicker: data.has_autoclicker,
      autoclicker_enabled: data.autoclicker_enabled,
      prestige_count: data.prestige_count,
      prestige_multiplier: data.prestige_multiplier,
    };

    const { error } = await supabase
      .from('user_game_data')
      .upsert(fullData, {
        onConflict: 'user_id',
      });

    if (error) {
      // If error mentions unknown column, try without autoclicker fields
      if (error.message?.includes('column') || error.code === '42703') {
        console.warn('Autoclicker columns not in DB yet, saving without them...');
        const { error: fallbackError } = await supabase
          .from('user_game_data')
          .upsert(safeData, {
            onConflict: 'user_id',
          });
        
        if (fallbackError) {
          console.error('Error saving user game data (fallback):', fallbackError.message, fallbackError);
          return false;
        }
        return true;
      }
      
      console.error('Error saving user game data:', error.message, error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error saving user game data:', err);
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

// Throttled save - saves at most every SAVE_INTERVAL ms, but always saves pending data
const SAVE_INTERVAL = 3000; // Save every 3 seconds max
let saveTimeout: NodeJS.Timeout | null = null;
let pendingData: (Partial<UserGameData> & { user_id: string; user_type: 'employee' | 'client' }) | null = null;
let lastSaveTime = 0;
let isSaving = false;

export function debouncedSaveUserGameData(data: Partial<UserGameData> & { user_id: string; user_type: 'employee' | 'client' }): void {
  // Always accumulate the latest data
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
  } catch (err) {
    console.error('Failed to save game data:', err);
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



