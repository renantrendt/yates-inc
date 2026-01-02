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
  stocks_owned: number;
  stock_profits: number;
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
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching user game data:', error);
      return null;
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
    const { error } = await supabase
      .from('user_game_data')
      .upsert({
        ...data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error saving user game data:', error);
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

// Debounced save to avoid too many requests
let saveTimeout: NodeJS.Timeout | null = null;
let pendingData: (Partial<UserGameData> & { user_id: string; user_type: 'employee' | 'client' }) | null = null;

export function debouncedSaveUserGameData(data: Partial<UserGameData> & { user_id: string; user_type: 'employee' | 'client' }, delay: number = 2000): void {
  pendingData = { ...pendingData, ...data };
  
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(async () => {
    if (pendingData) {
      await saveUserGameData(pendingData);
      pendingData = null;
    }
  }, delay);
}

// Force immediate save (call on logout or page unload)
export async function flushPendingData(): Promise<void> {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  
  if (pendingData) {
    await saveUserGameData(pendingData);
    pendingData = null;
  }
}

