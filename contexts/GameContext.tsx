'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { 
  GameState, COUPON_DROP_RATES, COUPON_REQUIREMENTS, ShopStock, 
  SHOP_RESTOCK_INTERVAL, SHOP_MIN_ITEMS, SHOP_MAX_ITEMS, SHOP_MIN_QUANTITY, SHOP_MAX_QUANTITY, 
  AUTOCLICKER_COST, PRESTIGE_REQUIREMENTS, YATES_ACCOUNT_ID,
  TRINKETS, Trinket, TRINKET_SHOP_REFRESH_INTERVAL, TRINKET_SHOP_MIN_ITEMS, TRINKET_SHOP_MAX_ITEMS,
  MINER_TICK_INTERVAL, MINER_BASE_DAMAGE, MINER_MAX_COUNT, getMinerCost,
  PRESTIGE_UPGRADES, PrestigeUpgrade, PRESTIGE_TOKENS_PER_PRESTIGE, RARITY_COLORS,
  ACHIEVEMENTS, shouldUnlockAchievement
} from '@/types/game';
import { products } from '@/utils/products';
import { PICKAXES, ROCKS, getPickaxeById, getRockById, getHighestUnlockedRock } from '@/lib/gameData';
import { useAuth } from './AuthContext';
import { useClient } from './ClientContext';
import { fetchUserGameData, debouncedSaveUserGameData, flushPendingData, savePurchase, forceImmediateSave } from '@/lib/userDataSync';
import { supabase } from '@/lib/supabase';

// Helper to add product sale contribution to active budget (50% of sale)
async function addProductSaleToBudget(amount: number, productName: string): Promise<void> {
  try {
    const contribution = Math.floor(amount * 0.5); // 50% goes to active budget
    
    // Get current budget
    const { data: budgetData, error: fetchError } = await supabase
      .from('company_budget')
      .select('*')
      .limit(1)
      .single();

    if (fetchError) {
      console.error('Error fetching budget for product sale:', fetchError);
      return;
    }

    if (budgetData) {
      // Update active budget (money in circulation)
      const { error: updateError } = await supabase
        .from('company_budget')
        .update({
          active_budget: parseFloat(budgetData.active_budget) + contribution,
          last_updated: new Date().toISOString(),
        })
        .eq('id', budgetData.id);

      if (updateError) {
        console.error('Error updating budget for product sale:', updateError);
        return;
      }

      // Record transaction
      await supabase.from('budget_transactions').insert({
        amount: contribution,
        transaction_type: 'product_sale',
        description: `50% of ${productName} sale`,
        affects: 'active_budget',
        created_by: 'system',
      });

    }
  } catch (err) {
    console.error('Error adding product sale to budget:', err);
  }
}

interface GameContextType {
  gameState: GameState;
  currentPickaxe: typeof PICKAXES[0];
  currentRock: typeof ROCKS[0];
  mineRock: () => { earnedMoney: number; brokeRock: boolean; couponDrop: string | null };
  buyPickaxe: (pickaxeId: number) => boolean;
  canAffordPickaxe: (pickaxeId: number) => boolean;
  ownsPickaxe: (pickaxeId: number) => boolean;
  equipPickaxe: (pickaxeId: number) => void;
  selectRock: (rockId: number) => void;
  getUnlockedRocks: () => typeof ROCKS;
  resetGame: () => void;
  markCutsceneSeen: () => void;
  useCoupon: (type: 'discount30' | 'discount50' | 'discount100') => boolean;
  spendMoney: (amount: number) => boolean;
  shopStock: ShopStock;
  buyShopProduct: (productId: number) => boolean;
  getTimeUntilRestock: () => number;
  buyAutoclicker: () => boolean;
  toggleAutoclicker: () => void;
  canPrestige: () => boolean;
  prestige: (force?: boolean) => { amountToCompany: number; newMultiplier: number } | null;
  // Anti-cheat functions
  dismissWarning: () => void;
  clearClickHistory: () => void;
  submitAppeal: (reason: string) => Promise<boolean>;
  // Ban state
  isBanned: boolean;
  banReason: string | null;
  // Trinket functions
  trinketShopItems: Trinket[];
  getTrinketShopTimeLeft: () => number;
  buyTrinket: (trinketId: string) => boolean;
  equipTrinket: (trinketId: string) => boolean;
  unequipTrinket: (trinketId: string) => void;
  ownsTrinket: (trinketId: string) => boolean;
  getEquippedTrinkets: () => Trinket[];
  getTotalBonuses: () => { moneyBonus: number; rockDamageBonus: number; clickSpeedBonus: number; couponBonus: number; minerSpeedBonus: number; minerDamageBonus: number };
  yatesTotemSpawned: boolean;
  // Miner functions
  buyMiner: () => boolean;
  getMinerCost: () => number;
  // Prestige upgrade functions
  buyPrestigeUpgrade: (upgradeId: string) => boolean;
  ownsPrestigeUpgrade: (upgradeId: string) => boolean;
  canEquipDualTrinkets: () => boolean;
  // Auto-prestige
  toggleAutoPrestige: () => void;
  // Admin functions (terminal)
  addMoney: (amount: number) => void;
  addMiners: (amount: number) => void;
  addPrestigeTokens: (amount: number) => void;
  giveTrinket: (trinketId: string) => boolean;
  givePickaxe: (pickaxeId: number) => void;
  setTotalClicks: (clicks: number) => void;
  // Pickaxe ability functions
  activateAbility: () => boolean;
  getAbilityCooldownRemaining: () => number;
  isAbilityActive: () => boolean;
  getActiveAbilityTimeRemaining: () => number;
}

const defaultGameState: GameState = {
  yatesDollars: 0,
  totalClicks: 0,
  currentPickaxeId: 1,
  currentRockId: 1,
  currentRockHP: ROCKS[0].clicksToBreak,
  rocksMinedCount: 0,
  ownedPickaxeIds: [1],
  coupons: {
    discount30: 0,
    discount50: 0,
    discount100: 0,
  },
  hasSeenCutscene: false,
  hasAutoclicker: false,
  autoclickerEnabled: false,
  prestigeCount: 0,
  prestigeMultiplier: 1.0,
  // Anti-cheat defaults
  antiCheatWarnings: 0,
  isOnWatchlist: false,
  isBlocked: false,
  appealPending: false,
  // Trinkets
  ownedTrinketIds: [],
  equippedTrinketIds: [],
  trinketShopItems: [],
  trinketShopLastRefresh: 0,
  hasTotemProtection: false,
  // Miners
  minerCount: 0,
  minerLastTick: Date.now(),
  // Prestige upgrades
  prestigeTokens: 0,
  ownedPrestigeUpgradeIds: [],
  // Auto-prestige
  autoPrestigeEnabled: false,
  // Pickaxe active abilities
  activeAbility: null,
  abilityCooldowns: {},
  // Achievements (permanently unlocked)
  unlockedAchievementIds: [],
};

const STORAGE_KEY_PREFIX = 'yates-mining-game';
// Storage key is user-specific to prevent data conflicts between accounts
const getStorageKey = (userId: string | null) => userId ? `${STORAGE_KEY_PREFIX}-${userId}` : `${STORAGE_KEY_PREFIX}-guest`;

// Generate random shop stock
function generateShopStock(): ShopStock {
  const availableProducts = products.filter(p => !p.isCustom && p.hasAddToCart);
  const numItems = Math.floor(Math.random() * (SHOP_MAX_ITEMS - SHOP_MIN_ITEMS + 1)) + SHOP_MIN_ITEMS;
  
  // Shuffle and pick random products
  const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
  const selectedProducts = shuffled.slice(0, Math.min(numItems, shuffled.length));
  
  return {
    items: selectedProducts.map(p => ({
      productId: p.id,
      quantity: Math.floor(Math.random() * (SHOP_MAX_QUANTITY - SHOP_MIN_QUANTITY + 1)) + SHOP_MIN_QUANTITY,
    })),
    lastRestockTime: Date.now(),
  };
}

// Generate random trinket shop items based on shopChance
function generateTrinketShopItems(): string[] {
  const items: string[] = [];
  const numSlots = Math.floor(Math.random() * (TRINKET_SHOP_MAX_ITEMS - TRINKET_SHOP_MIN_ITEMS + 1)) + TRINKET_SHOP_MIN_ITEMS;
  
  // Shuffle trinkets and pick based on shopChance
  const shuffled = [...TRINKETS].sort(() => Math.random() - 0.5);
  
  for (const trinket of shuffled) {
    if (items.length >= numSlots) break;
    
    // Roll for shopChance
    if (Math.random() < trinket.shopChance) {
      items.push(trinket.id);
    }
  }
  
  // If we got nothing, force at least one common/rare trinket
  if (items.length === 0) {
    const commonRare = TRINKETS.filter(t => t.rarity === 'common' || t.rarity === 'rare');
    const pick = commonRare[Math.floor(Math.random() * commonRare.length)];
    items.push(pick.id);
  }
  
  return items;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Anti-cheat: Window-level click tracking (survives HMR and re-renders)
const CLICK_WINDOW_MS = 1000; // 1 second rolling window
const NORMAL_CLICK_THRESHOLD = 9; // Max 9 clicks/sec for normal users
const WATCHLIST_CLICK_THRESHOLD = 7; // Max 7 clicks/sec for watchlist users

// Initialize on window if not exists
declare global {
  interface Window {
    _clickTimestamps?: number[];
  }
}
if (typeof window !== 'undefined' && !window._clickTimestamps) {
  window._clickTimestamps = [];
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [shopStock, setShopStock] = useState<ShopStock>(() => generateShopStock());
  // Start as true so game renders immediately - data will load in background
  const [isLoaded, setIsLoaded] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [yatesTotemSpawned, setYatesTotemSpawned] = useState(false);
  const { employee } = useAuth();
  const { client } = useClient();
  
  // Get current user ID and type
  const userId = employee?.id || client?.id || null;
  const userType: 'employee' | 'client' | null = employee ? 'employee' : client ? 'client' : null;
  
  // Ref for cheat commands to access latest setGameState
  const setGameStateRef = useRef(setGameState);
  setGameStateRef.current = setGameState;
  
  // Ref to track if we're still loading initial data (prevent saves during load)
  const isLoadingRef = useRef(true);

  // Check if click rate exceeds threshold and trigger warning if needed
  const checkClickRate = useCallback((): boolean => {
    const now = Date.now();
    const clicks = window._clickTimestamps || [];
    
    // Add current click timestamp
    clicks.push(now);

    // Remove clicks older than 1 second
    const beforeFilter = clicks.length;
    window._clickTimestamps = clicks.filter(
      (timestamp) => now - timestamp <= CLICK_WINDOW_MS
    );

    // Get the appropriate threshold
    const threshold = gameState.isOnWatchlist ? WATCHLIST_CLICK_THRESHOLD : NORMAL_CLICK_THRESHOLD;
    
    const clickCount = window._clickTimestamps.length;
    
    // Debug logging EVERY click now
    // Debug logging removed for performance

    // Check if over threshold
    if (clickCount > threshold) {
      return true; // Violation detected
    }
    return false;
  }, [gameState.isOnWatchlist]);

  // Trigger anti-cheat warning
  const triggerAntiCheatWarning = useCallback(() => {
    setGameState((prev) => {
      const newWarnings = prev.antiCheatWarnings + 1;
      return {
        ...prev,
        antiCheatWarnings: newWarnings,
        isBlocked: true, // Block earning until modal is dismissed
      };
    });
    // Clear click history after violation
    window._clickTimestamps = [];
  }, []);

  // Dismiss warning (called from UI after user acknowledges)
  const dismissWarning = useCallback(() => {
    // Clear click history when dismissing warning
    window._clickTimestamps = [];
    setGameState((prev) => ({
      ...prev,
      isBlocked: false,
    }));
  }, []);
  
  // Clear click history (for admin commands like CM)
  const clearClickHistory = useCallback(() => {
    window._clickTimestamps = [];
  }, []);

  // Load from localStorage IMMEDIATELY (synchronous) so game works right away
  useEffect(() => {
    isLoadingRef.current = true; // Mark as loading
    
    // Load localStorage first - this is instant
    const storageKey = getStorageKey(userId);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGameState({ ...defaultGameState, ...parsed });
        
        if (parsed.shopStock) {
          const timeSinceRestock = Date.now() - parsed.shopStock.lastRestockTime;
          if (timeSinceRestock >= SHOP_RESTOCK_INTERVAL) {
            setShopStock(generateShopStock());
          } else {
            setShopStock(parsed.shopStock);
          }
        }
      } catch {
        console.error('Failed to parse saved game state');
        // If parsing fails, use default state
        setGameState(defaultGameState);
      }
    }
    // Game is now loaded and working with localStorage data

    // Then try Supabase in background (async)
    const loadSupabaseData = async () => {
      // Safety timeout - ensure game loads even if Supabase hangs
      const timeoutId = setTimeout(() => {
        // Timeout reached - game continues with localStorage
      }, 5000); // 5 second timeout

      try {

        // If logged in, try to load from Supabase
        if (userId && userType) {
          try {
            // Check if user is banned first (use maybeSingle to avoid 406 errors)
            const { data: banData, error: banError } = await supabase
              .from('banned_users')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();
            
            // Only block if we successfully found ban data (ignore errors)
            if (banData && !banError) {
              // User is banned - block them
              setGameState(prev => ({
                ...prev,
                isBlocked: true,
                appealPending: false,
              }));
              setIsBanned(true);
              setBanReason(banData.ban_reason || 'No reason provided');
              setIsLoaded(true);
              clearTimeout(timeoutId);
              return; // Don't load game data for banned users
            }

            // Try to load from Supabase (will merge with localStorage if it fails)
            const supabaseData = await fetchUserGameData(userId);
            if (supabaseData) {
              setGameState(prev => {
                // Smart merge: Prioritize prestigeCount first, then totalClicks as tiebreaker
                // After prestige, totalClicks resets to 0 but prestigeCount increases
                // So we must compare prestige first to avoid old data overwriting new prestige
                const localPrestige = prev.prestigeCount || 0;
                const supabasePrestige = supabaseData.prestige_count || 0;
                const localClicks = prev.totalClicks || 0;
                const supabaseClicks = supabaseData.total_clicks || 0;
                
                // Use Supabase data if it has higher prestige, or same prestige with more clicks
                const useSupabase = supabasePrestige > localPrestige || 
                  (supabasePrestige === localPrestige && supabaseClicks > localClicks);
                
                return {
                ...prev,
                // Use whichever source has more progress
                yatesDollars: useSupabase ? (supabaseData.yates_dollars ?? prev.yatesDollars) : prev.yatesDollars,
                totalClicks: useSupabase ? (supabaseData.total_clicks ?? prev.totalClicks) : prev.totalClicks,
                currentPickaxeId: useSupabase ? (supabaseData.current_pickaxe_id ?? prev.currentPickaxeId) : prev.currentPickaxeId,
                currentRockId: useSupabase ? (supabaseData.current_rock_id ?? prev.currentRockId) : prev.currentRockId,
                currentRockHP: useSupabase ? (supabaseData.current_rock_hp ?? prev.currentRockHP) : prev.currentRockHP,
                rocksMinedCount: useSupabase ? (supabaseData.rocks_mined_count ?? prev.rocksMinedCount) : prev.rocksMinedCount,
                ownedPickaxeIds: useSupabase ? (supabaseData.owned_pickaxe_ids?.length ? supabaseData.owned_pickaxe_ids : prev.ownedPickaxeIds) : prev.ownedPickaxeIds,
                coupons: useSupabase ? {
                  discount30: supabaseData.coupons_30 ?? prev.coupons.discount30,
                  discount50: supabaseData.coupons_50 ?? prev.coupons.discount50,
                  discount100: supabaseData.coupons_100 ?? prev.coupons.discount100,
                } : prev.coupons,
                // Keep localStorage value for hasSeenCutscene if it's true (user already saw it)
                // Only update if Supabase says true (to sync across devices)
                hasSeenCutscene: prev.hasSeenCutscene || (supabaseData.has_seen_cutscene ?? false),
                hasAutoclicker: useSupabase ? (supabaseData.has_autoclicker ?? prev.hasAutoclicker) : prev.hasAutoclicker,
                autoclickerEnabled: useSupabase ? (supabaseData.autoclicker_enabled ?? prev.autoclickerEnabled) : prev.autoclickerEnabled,
                prestigeCount: useSupabase ? (supabaseData.prestige_count ?? prev.prestigeCount) : prev.prestigeCount,
                prestigeMultiplier: useSupabase ? (supabaseData.prestige_multiplier ?? prev.prestigeMultiplier) : prev.prestigeMultiplier,
                // Anti-cheat fields (always sync from Supabase for security)
                antiCheatWarnings: supabaseData.anti_cheat_warnings ?? prev.antiCheatWarnings,
                isOnWatchlist: supabaseData.is_on_watchlist ?? prev.isOnWatchlist,
                isBlocked: supabaseData.is_blocked ?? prev.isBlocked,
                appealPending: supabaseData.appeal_pending ?? prev.appealPending,
                // Trinkets
                ownedTrinketIds: useSupabase ? (supabaseData.owned_trinket_ids?.length ? supabaseData.owned_trinket_ids : prev.ownedTrinketIds) : prev.ownedTrinketIds,
                equippedTrinketIds: useSupabase ? (supabaseData.equipped_trinket_ids?.length ? supabaseData.equipped_trinket_ids : prev.equippedTrinketIds) : prev.equippedTrinketIds,
                trinketShopItems: supabaseData.trinket_shop_items?.length 
                  ? (supabaseData.trinket_shop_items as string[]) 
                  : prev.trinketShopItems,
                trinketShopLastRefresh: supabaseData.trinket_shop_last_refresh ?? prev.trinketShopLastRefresh,
                hasTotemProtection: useSupabase ? (supabaseData.has_totem_protection ?? prev.hasTotemProtection) : prev.hasTotemProtection,
                // Miners
                minerCount: useSupabase ? (supabaseData.miner_count ?? prev.minerCount) : prev.minerCount,
                minerLastTick: useSupabase ? (supabaseData.miner_last_tick ?? prev.minerLastTick) : prev.minerLastTick,
                // Prestige upgrades
                prestigeTokens: useSupabase ? (supabaseData.prestige_tokens ?? prev.prestigeTokens) : prev.prestigeTokens,
                ownedPrestigeUpgradeIds: useSupabase ? (supabaseData.owned_prestige_upgrade_ids?.length ? supabaseData.owned_prestige_upgrade_ids : prev.ownedPrestigeUpgradeIds) : prev.ownedPrestigeUpgradeIds,
                // Auto-prestige
                autoPrestigeEnabled: useSupabase ? (supabaseData.auto_prestige_enabled ?? prev.autoPrestigeEnabled) : prev.autoPrestigeEnabled,
                // Achievements (permanently unlocked)
                unlockedAchievementIds: supabaseData.unlocked_achievement_ids?.length 
                  ? supabaseData.unlocked_achievement_ids 
                  : prev.unlockedAchievementIds,
              };
              });
            }
          } catch {
            // If anything fails, just use localStorage (already loaded above)
          }
        }

        clearTimeout(timeoutId);
      } catch {
        clearTimeout(timeoutId);
      } finally {
        // Mark loading as complete - now saves can happen
        isLoadingRef.current = false;
      }
    };

    // Load Supabase data in background (game already works with localStorage)
    if (userId && userType) {
      loadSupabaseData();
    } else {
      // If not logged in, mark as loaded immediately
      isLoadingRef.current = false;
    }
  }, [userId, userType]);

  // Auto-restock check every second (product shop)
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceRestock = Date.now() - shopStock.lastRestockTime;
      if (timeSinceRestock >= SHOP_RESTOCK_INTERVAL) {
        setShopStock(generateShopStock());
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [shopStock.lastRestockTime]);

  // Trinket shop refresh check every second
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceRefresh = Date.now() - gameState.trinketShopLastRefresh;
      // Only refresh based on time interval - NOT when shop is empty (buying last item shouldn't refresh)
      // Initial load (lastRefresh === 0) will trigger refresh since timeSinceRefresh will be huge
      if (timeSinceRefresh >= TRINKET_SHOP_REFRESH_INTERVAL) {
        const newItems = generateTrinketShopItems();
        // Check if Yates Totem spawned
        if (newItems.includes('yates_totem')) {
          setYatesTotemSpawned(true);
          // Auto-hide warning after 3 seconds
          setTimeout(() => setYatesTotemSpawned(false), 3000);
        }
        setGameState(prev => ({
          ...prev,
          trinketShopItems: newItems,
          trinketShopLastRefresh: Date.now(),
        }));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState.trinketShopLastRefresh]);

  // Miner tick logic - miners damage rock every second
  // Using a ref to avoid stale closure issues
  const minerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear any existing interval
    if (minerIntervalRef.current) {
      clearInterval(minerIntervalRef.current);
      minerIntervalRef.current = null;
    }
    
    // Don't run if no miners or blocked
    if (gameState.minerCount <= 0 || gameState.isBlocked) {
      return;
    }
    
    minerIntervalRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.minerCount <= 0 || prev.isBlocked) return prev;
        
        // Calculate bonuses from trinkets and prestige upgrades inline
        let bonuses = {
          moneyBonus: 0,
          minerDamageBonus: 0,
          minerSpeedBonus: 0,
        };
        
        // Trinket bonuses
        for (const trinketId of prev.equippedTrinketIds) {
          const trinket = TRINKETS.find(t => t.id === trinketId);
          if (trinket) {
            const e = trinket.effects;
            bonuses.moneyBonus += (e.moneyBonus || 0) + (e.allBonus || 0) + (e.minerMoneyBonus || 0);
            bonuses.minerDamageBonus += (e.minerDamageBonus || 0) + (e.allBonus || 0);
            bonuses.minerSpeedBonus += (e.minerSpeedBonus || 0) + (e.allBonus || 0);
          }
        }
        
        // Trinket multiplier from prestige upgrades
        let trinketMultiplier = 1.0;
        for (const upgradeId of prev.ownedPrestigeUpgradeIds) {
          const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId);
          if (upgrade?.effects.trinketBonus) {
            trinketMultiplier += upgrade.effects.trinketBonus;
          }
        }
        bonuses.moneyBonus *= trinketMultiplier;
        bonuses.minerDamageBonus *= trinketMultiplier;
        bonuses.minerSpeedBonus *= trinketMultiplier;
        
        // Prestige upgrade bonuses
        for (const upgradeId of prev.ownedPrestigeUpgradeIds) {
          const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId);
          if (upgrade) {
            const allB = upgrade.effects.allBonus || 0;
            bonuses.moneyBonus += (upgrade.effects.moneyBonus || 0) + allB;
            bonuses.minerDamageBonus += (upgrade.effects.minerDamageBonus || 0) + allB;
            bonuses.minerSpeedBonus += (upgrade.effects.minerSpeedBonus || 0) + allB;
          }
        }
        
        // Check for active ability bonuses
        let abilityMinerSpeedBonus = 0;
        let abilityAllBonus = 0;
        if (prev.activeAbility) {
          const { startTime, duration, pickaxeId } = prev.activeAbility;
          const isActive = duration === 0 ? false : Date.now() < startTime + duration;
          if (isActive) {
            const pickaxe = getPickaxeById(pickaxeId);
            const ability = pickaxe?.activeAbility;
            if (ability?.effect.type === 'miner_speed') {
              abilityMinerSpeedBonus = ability.effect.value;
            } else if (ability?.effect.type === 'all_boost') {
              abilityAllBonus = ability.effect.value;
            }
          }
        }
        
        const rock = getRockById(prev.currentRockId) || ROCKS[0];
        // Apply ALL bonuses: trinkets, prestige upgrades, and active abilities
        const totalDamageBonus = bonuses.minerDamageBonus + bonuses.minerSpeedBonus + abilityMinerSpeedBonus + abilityAllBonus;
        const totalMoneyBonus = bonuses.moneyBonus + abilityAllBonus;
        const damage = Math.ceil(prev.minerCount * MINER_BASE_DAMAGE * (1 + totalDamageBonus));
        
        // Calculate new HP after damage
        const newHP = prev.currentRockHP - damage;
        const newTotalClicks = prev.totalClicks + damage;
        
        // Rock didn't break
        if (newHP > 0) {
          return {
            ...prev,
            currentRockHP: newHP,
            totalClicks: newTotalClicks,
          };
        }
        
        // Rock broke! Calculate how many rocks we break with overkill damage
        const overkillDamage = Math.abs(newHP); // Damage beyond first rock
        const fullRockHP = rock.clicksToBreak;
        
        // First rock + additional rocks from overkill
        const additionalRocks = Math.floor(overkillDamage / fullRockHP);
        const totalRocksBroken = 1 + additionalRocks;
        
        // Calculate remaining HP for next rock
        const leftoverDamage = overkillDamage % fullRockHP;
        const finalHP = fullRockHP - leftoverDamage;
        
        // Calculate total money earned
        const moneyPerRock = Math.ceil(rock.moneyPerBreak * prev.prestigeMultiplier * (1 + totalMoneyBonus));
        const totalMoney = moneyPerRock * totalRocksBroken;
        
        // Check for rock upgrade
        const highestUnlocked = getHighestUnlockedRock(newTotalClicks);
        const newCurrentRockId = highestUnlocked.id > prev.currentRockId ? highestUnlocked.id : prev.currentRockId;
        const nextRock = getRockById(newCurrentRockId) || ROCKS[0];
        
        return {
          ...prev,
          currentRockHP: newCurrentRockId !== prev.currentRockId ? nextRock.clicksToBreak : finalHP,
          currentRockId: newCurrentRockId,
          rocksMinedCount: prev.rocksMinedCount + totalRocksBroken,
          yatesDollars: prev.yatesDollars + totalMoney,
          totalClicks: newTotalClicks,
          lastMinerEarnings: totalMoney,
        };
      });
    }, 1000);
    
    return () => {
      if (minerIntervalRef.current) {
        clearInterval(minerIntervalRef.current);
        minerIntervalRef.current = null;
      }
    };
  }, [gameState.minerCount, gameState.isBlocked]);

  // Auto-prestige logic
  useEffect(() => {
    if (!gameState.autoPrestigeEnabled) return;
    
    const interval = setInterval(() => {
      const canDo = gameState.currentRockId >= PRESTIGE_REQUIREMENTS.minRockId &&
        gameState.ownedPickaxeIds.includes(PRESTIGE_REQUIREMENTS.minPickaxeId);
      
      if (canDo) {
        // Trigger prestige
        const isYates = userId === YATES_ACCOUNT_ID;
        const newPrestigeCount = gameState.prestigeCount + 1;
        const newMultiplier = 1.0 + (newPrestigeCount * 0.1);
        // Check if player owns totem (not the flag - can get out of sync)
        const ownsTotem = gameState.ownedTrinketIds.includes('totem');
        
        setGameState(prev => ({
          ...prev,
          currentRockId: 1,
          currentRockHP: ROCKS[0].clicksToBreak,
          currentPickaxeId: 1,
          ownedPickaxeIds: [1],
          totalClicks: 0,
          rocksMinedCount: 0,
          minerCount: 0, // Reset miners on prestige
          yatesDollars: (isYates || ownsTotem) ? prev.yatesDollars : 0,
          prestigeCount: newPrestigeCount,
          prestigeMultiplier: newMultiplier,
          prestigeTokens: prev.prestigeTokens + PRESTIGE_TOKENS_PER_PRESTIGE,
          hasTotemProtection: false,
          // Remove totem from inventory if used
          ownedTrinketIds: ownsTotem ? prev.ownedTrinketIds.filter(id => id !== 'totem') : prev.ownedTrinketIds,
          equippedTrinketIds: ownsTotem ? prev.equippedTrinketIds.filter(id => id !== 'totem') : prev.equippedTrinketIds,
        }));
      }
    }, 1000); // Check every 1 second
    
    return () => clearInterval(interval);
  }, [gameState.autoPrestigeEnabled, gameState.currentRockId, gameState.ownedPickaxeIds, gameState.prestigeCount, userId, gameState.ownedTrinketIds]);

  // Achievement tracking - permanently unlock achievements when criteria met
  useEffect(() => {
    const newUnlocks: string[] = [];
    
    for (const achievement of ACHIEVEMENTS) {
      // Skip if already permanently unlocked
      if (gameState.unlockedAchievementIds?.includes(achievement.id)) continue;
      
      // Check if should unlock based on current state
      if (shouldUnlockAchievement(achievement, gameState)) {
        newUnlocks.push(achievement.id);
      }
    }
    
    // If there are new unlocks, add them to the permanent list
    if (newUnlocks.length > 0) {
      setGameState(prev => ({
        ...prev,
        unlockedAchievementIds: [...(prev.unlockedAchievementIds || []), ...newUnlocks],
      }));
    }
  }, [
    gameState.ownedPickaxeIds,
    gameState.currentRockId,
    gameState.yatesDollars,
    gameState.prestigeCount,
    gameState.minerCount,
    gameState.ownedTrinketIds,
    gameState.unlockedAchievementIds,
  ]);

  // Helper function to calculate total bonuses from equipped trinkets and prestige upgrades
  const calculateTotalBonuses = useCallback(() => {
    let bonuses = {
      moneyBonus: 0,
      rockDamageBonus: 0,
      clickSpeedBonus: 0,
      couponBonus: 0,
      minerSpeedBonus: 0,
      minerDamageBonus: 0,
    };
    
    // First, calculate trinket bonuses
    for (const trinketId of gameState.equippedTrinketIds) {
      const trinket = TRINKETS.find(t => t.id === trinketId);
      if (trinket) {
        const e = trinket.effects;
        bonuses.moneyBonus += (e.moneyBonus || 0) + (e.allBonus || 0) + (e.minerMoneyBonus || 0);
        bonuses.rockDamageBonus += (e.rockDamageBonus || 0) + (e.allBonus || 0);
        bonuses.clickSpeedBonus += (e.clickSpeedBonus || 0) + (e.allBonus || 0);
        bonuses.couponBonus += (e.couponBonus || 0) + (e.couponLuckBonus || 0) + (e.allBonus || 0);
        bonuses.minerSpeedBonus += (e.minerSpeedBonus || 0) + (e.allBonus || 0);
        bonuses.minerDamageBonus += (e.minerDamageBonus || 0) + (e.allBonus || 0);
      }
    }
    
    // Check for trinket bonus multiplier from prestige upgrades (like Mega Boost)
    let trinketMultiplier = 1.0;
    for (const upgradeId of gameState.ownedPrestigeUpgradeIds) {
      const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId);
      if (upgrade?.effects.trinketBonus) {
        trinketMultiplier += upgrade.effects.trinketBonus;
      }
    }
    
    // Apply trinket multiplier to all trinket bonuses
    bonuses.moneyBonus *= trinketMultiplier;
    bonuses.rockDamageBonus *= trinketMultiplier;
    bonuses.clickSpeedBonus *= trinketMultiplier;
    bonuses.couponBonus *= trinketMultiplier;
    bonuses.minerSpeedBonus *= trinketMultiplier;
    bonuses.minerDamageBonus *= trinketMultiplier;
    
    // Add bonuses from prestige upgrades (not multiplied by trinketBonus)
    for (const upgradeId of gameState.ownedPrestigeUpgradeIds) {
      const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId);
      if (upgrade) {
        const e = upgrade.effects;
        const allB = e.allBonus || 0;
        bonuses.moneyBonus += (e.moneyBonus || 0) + allB;
        bonuses.rockDamageBonus += (e.rockDamageBonus || 0) + allB;
        bonuses.clickSpeedBonus += (e.clickSpeedBonus || 0) + allB;
        bonuses.couponBonus += (e.couponBonus || 0) + allB;
        bonuses.minerSpeedBonus += (e.minerSpeedBonus || 0) + allB;
        bonuses.minerDamageBonus += (e.minerDamageBonus || 0) + allB;
      }
    }
    
    return bonuses;
  }, [gameState.equippedTrinketIds, gameState.ownedPrestigeUpgradeIds]);

  // Save to localStorage and Supabase whenever state changes
  useEffect(() => {
    // Don't save during initial load - wait until data is loaded
    if (!isLoaded || isLoadingRef.current) {
      return;
    }
    
    try {
      // Always save to localStorage immediately (user-specific key)
      const storageKey = getStorageKey(userId);
      localStorage.setItem(storageKey, JSON.stringify({ ...gameState, shopStock }));

      // If logged in, also sync to Supabase (debounced)
      // NUCLEAR FIX: Only save fields that PERSIST across prestige
      // All prestige-reset fields (clicks, money, pickaxes, miners, etc.) are ONLY
      // updated via forceImmediateSave during prestige. This prevents stale React
      // closures from overwriting correct prestige data.
      if (userId && userType) {
        debouncedSaveUserGameData({
          user_id: userId,
          user_type: userType,
          // Fields that PERSIST across prestige (safe to save anytime):
          coupons_30: gameState.coupons.discount30,
          coupons_50: gameState.coupons.discount50,
          coupons_100: gameState.coupons.discount100,
          has_seen_cutscene: gameState.hasSeenCutscene,
          has_autoclicker: gameState.hasAutoclicker,
          autoclicker_enabled: gameState.autoclickerEnabled,
          // Anti-cheat fields (always sync for security)
          anti_cheat_warnings: gameState.antiCheatWarnings,
          is_on_watchlist: gameState.isOnWatchlist,
          is_blocked: gameState.isBlocked,
          appeal_pending: gameState.appealPending,
          // Trinket shop state (persists)
          trinket_shop_items: gameState.trinketShopItems,
          trinket_shop_last_refresh: gameState.trinketShopLastRefresh,
          // Prestige upgrades owned (persists - these are permanent unlocks)
          owned_prestige_upgrade_ids: gameState.ownedPrestigeUpgradeIds,
          // Auto-prestige setting (persists)
          auto_prestige_enabled: gameState.autoPrestigeEnabled,
          // Achievements (permanently unlocked, persists across prestiges)
          unlocked_achievement_ids: gameState.unlockedAchievementIds,
          // NOTE: The following are EXCLUDED and only updated via forceImmediateSave:
          // - prestige_count, prestige_multiplier, prestige_tokens
          // - yates_dollars, total_clicks
          // - current_pickaxe_id, current_rock_id, current_rock_hp, rocks_mined_count
          // - owned_pickaxe_ids, miner_count, miner_last_tick
          // - owned_trinket_ids, equipped_trinket_ids, has_totem_protection
        });
      }
    } catch (err) {
      console.error('❌ Error saving game data:', err);
    }
  }, [gameState, shopStock, isLoaded, userId, userType]);

  // Save immediately when page is about to unload or tab is hidden
  useEffect(() => {
    if (!userId || !userType) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingData();
      }
    };

    const handleBeforeUnload = () => {
      flushPendingData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [userId, userType]);

  // Cheat functions for employees (anyone with numbered ID like 000001, 123456, etc.)
  // Employees have numeric string IDs, clients have UUIDs
  const isEmployee = userId ? /^\d+$/.test(userId) : false;

  // Auto-clear any blocks for employees (they're immune to anti-cheat)
  useEffect(() => {
    if (isEmployee && (gameState.isBlocked || gameState.antiCheatWarnings > 0)) {
      setGameState(prev => ({
        ...prev,
        isBlocked: false,
        antiCheatWarnings: 0,
        appealPending: false,
      }));
    }
  }, [isEmployee, gameState.isBlocked, gameState.antiCheatWarnings]);

  const currentPickaxe = getPickaxeById(gameState.currentPickaxeId) || PICKAXES[0];
  const currentRock = getRockById(gameState.currentRockId) || ROCKS[0];

  // Helper to get active ability bonuses (needs to be before mineRock)
  const getActiveAbilityBonuses = useCallback(() => {
    const bonuses = {
      damageMultiplier: 1,
      minerSpeedBonus: 0,
      allBonus: 0,
    };

    if (!gameState.activeAbility) return bonuses;
    
    // Check if ability is still active
    const { startTime, duration, pickaxeId } = gameState.activeAbility;
    if (duration === 0) return bonuses; // instant abilities don't give ongoing bonuses
    const isActive = Date.now() < startTime + duration;
    if (!isActive) return bonuses;

    const pickaxe = getPickaxeById(pickaxeId);
    const ability = pickaxe?.activeAbility;
    if (!ability) return bonuses;

    switch (ability.effect.type) {
      case 'damage_boost':
        bonuses.damageMultiplier = ability.effect.value;
        break;
      case 'miner_speed':
        bonuses.minerSpeedBonus = ability.effect.value;
        break;
      case 'all_boost':
        bonuses.allBonus = ability.effect.value;
        break;
    }

    return bonuses;
  }, [gameState.activeAbility]);

  // Use a ref to always have fresh gameState for mineRock
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const mineRock = useCallback(() => {
    const state = gameStateRef.current;
    
    // DEBUG: Log state on every click attempt
    console.log('🔨 MINE CLICK:', { 
      isBlocked: state.isBlocked, 
      appealPending: state.appealPending,
      currentPickaxeId: state.currentPickaxeId,
      currentRockId: state.currentRockId,
      isEmployee 
    });
    
    // Employees bypass ALL anti-cheat (they have terminal access anyway)
    if (!isEmployee) {
      // Anti-cheat: If blocked, don't process clicks
      if (state.isBlocked || state.appealPending) {
        console.log('❌ BLOCKED: isBlocked=', state.isBlocked, 'appealPending=', state.appealPending);
        return { brokeRock: false, earnedMoney: 0, couponDrop: null };
      }

      // Anti-cheat: Check click rate (skip for purchased autoclicker when enabled)
      const isViolation = checkClickRate();
      const hasAutoclickerWhitelist = state.hasAutoclicker && state.autoclickerEnabled;

      if (isViolation && !hasAutoclickerWhitelist) {
        console.log('❌ ANTI-CHEAT VIOLATION: click rate exceeded');
        triggerAntiCheatWarning();
        return { brokeRock: false, earnedMoney: 0, couponDrop: null };
      }
    }

    // Results to return (will be set inside setGameState)
    let brokeRock = false;
    let earnedMoney = 0;
    let couponDrop: string | null = null;

    setGameState((prev) => {
      // Use FRESH state from prev, not stale closure
      const pickaxe = getPickaxeById(prev.currentPickaxeId) || PICKAXES[0];
      const rock = getRockById(prev.currentRockId) || ROCKS[0];
      
      // Calculate bonuses inline to avoid stale closures
      let rockDamageBonus = 0;
      let moneyBonus = 0;
      let couponBonus = 0;
      
      // Trinket bonuses
      for (const trinketId of prev.equippedTrinketIds) {
        const trinket = TRINKETS.find(t => t.id === trinketId);
        if (trinket) {
          const e = trinket.effects;
          rockDamageBonus += (e.rockDamageBonus || 0) + (e.allBonus || 0);
          moneyBonus += (e.moneyBonus || 0) + (e.allBonus || 0) + (e.minerMoneyBonus || 0);
          couponBonus += (e.couponBonus || 0) + (e.couponLuckBonus || 0) + (e.allBonus || 0);
        }
      }
      
      // Prestige upgrade bonuses
      for (const upgradeId of prev.ownedPrestigeUpgradeIds) {
        const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) {
          const allB = upgrade.effects.allBonus || 0;
          rockDamageBonus += (upgrade.effects.rockDamageBonus || 0) + allB;
          moneyBonus += (upgrade.effects.moneyBonus || 0) + allB;
          couponBonus += (upgrade.effects.couponBonus || 0) + allB;
        }
      }
      
      // Active ability bonuses
      let damageMultiplier = 1;
      let allBonus = 0;
      if (prev.activeAbility) {
        const { startTime, duration, pickaxeId } = prev.activeAbility;
        if (duration > 0 && Date.now() < startTime + duration) {
          const abilityPickaxe = getPickaxeById(pickaxeId);
          const ability = abilityPickaxe?.activeAbility;
          if (ability) {
            if (ability.effect.type === 'damage_boost') damageMultiplier = ability.effect.value;
            if (ability.effect.type === 'all_boost') allBonus = ability.effect.value;
          }
        }
      }

      // Calculate click power
      let clickPower = pickaxe.name === 'Plasma' ? rock.clicksToBreak : pickaxe.clickPower;
      clickPower = Math.ceil(clickPower * (1 + rockDamageBonus + allBonus) * damageMultiplier);
      clickPower = Math.max(1, clickPower); // Ensure at least 1 damage
      
      const newHP = Math.max(0, prev.currentRockHP - clickPower);
      const willBreak = newHP <= 0;

      // Calculate money earned
      earnedMoney = rock.moneyPerClick;
      if (willBreak) {
        earnedMoney += rock.moneyPerBreak;
      }
      if (pickaxe.moneyMultiplier) {
        earnedMoney *= pickaxe.moneyMultiplier;
      }
      earnedMoney *= prev.prestigeMultiplier;
      earnedMoney *= (1 + moneyBonus + allBonus);
      earnedMoney = Math.ceil(earnedMoney);

      // Update totals
      const newTotalClicks = prev.totalClicks + clickPower;
      let newRockHP = newHP;
      let newRocksMinedCount = prev.rocksMinedCount;
      let newCurrentRockId = prev.currentRockId;

      // Check if rock broke
      if (willBreak) {
        brokeRock = true;
        newRocksMinedCount += 1;
        
        // Check for rock upgrade
        const highestUnlocked = getHighestUnlockedRock(newTotalClicks);
        if (highestUnlocked.id > prev.currentRockId) {
          newCurrentRockId = highestUnlocked.id;
        }
        
        // Reset HP for new rock
        const nextRock = getRockById(newCurrentRockId) || rock;
        newRockHP = nextRock.clicksToBreak;
      }

      // Check for coupon drop
      const meetsRequirements = 
        prev.currentRockId >= COUPON_REQUIREMENTS.minRockId &&
        prev.currentPickaxeId >= COUPON_REQUIREMENTS.minPickaxeId;

      let newCoupons = { ...prev.coupons };
      if (meetsRequirements) {
        const luckBonus = (pickaxe.couponLuckBonus || 0) + couponBonus;
        const rand = Math.random();
        
        if (rand < COUPON_DROP_RATES.discount100 * (1 + luckBonus)) {
          newCoupons.discount100 += 1;
          couponDrop = 'discount100';
        } else if (rand < COUPON_DROP_RATES.discount50 * (1 + luckBonus)) {
          newCoupons.discount50 += 1;
          couponDrop = 'discount50';
        } else if (rand < COUPON_DROP_RATES.discount30 * (1 + luckBonus)) {
          newCoupons.discount30 += 1;
          couponDrop = 'discount30';
        }
      }

      return {
        ...prev,
        yatesDollars: prev.yatesDollars + earnedMoney,
        totalClicks: newTotalClicks,
        currentRockHP: newRockHP,
        currentRockId: newCurrentRockId,
        rocksMinedCount: newRocksMinedCount,
        coupons: newCoupons,
      };
    });

    return { earnedMoney, brokeRock, couponDrop };
  }, [isEmployee, checkClickRate, triggerAntiCheatWarning]);

  const canAffordPickaxe = useCallback((pickaxeId: number) => {
    const pickaxe = getPickaxeById(pickaxeId);
    if (!pickaxe) return false;
    return gameState.yatesDollars >= pickaxe.price;
  }, [gameState.yatesDollars]);

  const ownsPickaxe = useCallback((pickaxeId: number) => {
    return gameState.ownedPickaxeIds.includes(pickaxeId);
  }, [gameState.ownedPickaxeIds]);

  const buyPickaxe = useCallback((pickaxeId: number) => {
    const pickaxe = getPickaxeById(pickaxeId);
    if (!pickaxe) return false;
    if (gameState.ownedPickaxeIds.includes(pickaxeId)) return false;
    if (gameState.yatesDollars < pickaxe.price) return false;

    // Clear click history to prevent anti-cheat false positives from rapid purchases
    window._clickTimestamps = [];

    setGameState((prev) => ({
      ...prev,
      yatesDollars: prev.yatesDollars - pickaxe.price,
      ownedPickaxeIds: [...prev.ownedPickaxeIds, pickaxeId],
      currentPickaxeId: pickaxeId, // Auto-equip after purchase
      // Reset anti-cheat block if not from appeal (user clearly has money = legitimate play)
      isBlocked: prev.appealPending ? prev.isBlocked : false,
    }));

    return true;
  }, [gameState.ownedPickaxeIds, gameState.yatesDollars]);

  const equipPickaxe = useCallback((pickaxeId: number) => {
    if (!gameState.ownedPickaxeIds.includes(pickaxeId)) return;
    setGameState((prev) => ({
      ...prev,
      currentPickaxeId: pickaxeId,
    }));
  }, [gameState.ownedPickaxeIds]);

  const selectRock = useCallback((rockId: number) => {
    const rock = getRockById(rockId);
    if (!rock) return;
    if (gameState.totalClicks < rock.unlockAtClicks) return;

    setGameState((prev) => ({
      ...prev,
      currentRockId: rockId,
      currentRockHP: rock.clicksToBreak,
    }));
  }, [gameState.totalClicks]);

  const getUnlockedRocks = useCallback(() => {
    return ROCKS.filter((rock) => gameState.totalClicks >= rock.unlockAtClicks);
  }, [gameState.totalClicks]);

  const resetGame = useCallback(() => {
    setGameState(defaultGameState);
    const storageKey = getStorageKey(userId);
    localStorage.removeItem(storageKey);
  }, [userId]);

  const markCutsceneSeen = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      hasSeenCutscene: true,
    }));
  }, []);

  const useCoupon = useCallback((type: 'discount30' | 'discount50' | 'discount100') => {
    if (gameState.coupons[type] <= 0) return false;
    
    setGameState((prev) => ({
      ...prev,
      coupons: {
        ...prev.coupons,
        [type]: prev.coupons[type] - 1,
      },
    }));
    
    return true;
  }, [gameState.coupons]);

  const spendMoney = useCallback((amount: number) => {
    if (gameState.yatesDollars < amount) return false;
    
    setGameState((prev) => ({
      ...prev,
      yatesDollars: prev.yatesDollars - amount,
    }));
    
    return true;
  }, [gameState.yatesDollars]);

  const buyShopProduct = useCallback((productId: number) => {
    const stockItem = shopStock.items.find(item => item.productId === productId);
    if (!stockItem || stockItem.quantity <= 0) return false;
    
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    
    const price = Math.floor(product.priceFloat * 15); // 15x multiplier
    if (gameState.yatesDollars < price) return false;
    
    // Deduct money
    setGameState((prev) => ({
      ...prev,
      yatesDollars: prev.yatesDollars - price,
    }));
    
    // Reduce stock quantity
    setShopStock((prev) => ({
      ...prev,
      items: prev.items.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ),
    }));

    // Add 50% of sale to company budget
    addProductSaleToBudget(price, product.name);

    // Save purchase to Supabase for both employees and clients
    if (userId && userType) {
      savePurchase({
        user_id: userId,
        user_type: userType,
        product_id: productId,
        product_name: product.name,
        purchase_type: 'cash',
        amount_paid: price,
      });
    }
    
    return true;
  }, [gameState.yatesDollars, shopStock.items, userId, userType]);

  const getTimeUntilRestock = useCallback(() => {
    const elapsed = Date.now() - shopStock.lastRestockTime;
    return Math.max(0, SHOP_RESTOCK_INTERVAL - elapsed);
  }, [shopStock.lastRestockTime]);

  const buyAutoclicker = useCallback(() => {
    if (gameState.hasAutoclicker) return false;
    if (gameState.yatesDollars < AUTOCLICKER_COST) return false;
    
    setGameState((prev) => ({
      ...prev,
      yatesDollars: prev.yatesDollars - AUTOCLICKER_COST,
      hasAutoclicker: true,
      autoclickerEnabled: true,
    }));
    
    return true;
  }, [gameState.hasAutoclicker, gameState.yatesDollars]);

  const toggleAutoclicker = useCallback(() => {
    if (!gameState.hasAutoclicker) return;
    
    setGameState((prev) => ({
      ...prev,
      autoclickerEnabled: !prev.autoclickerEnabled,
    }));
  }, [gameState.hasAutoclicker]);

  // Check if user can prestige (requires rock 17 + pickaxe 13)
  const canPrestige = useCallback(() => {
    return (
      gameState.currentRockId >= PRESTIGE_REQUIREMENTS.minRockId &&
      gameState.ownedPickaxeIds.includes(PRESTIGE_REQUIREMENTS.minPickaxeId)
    );
  }, [gameState.currentRockId, gameState.ownedPickaxeIds]);

  // Perform prestige - reset progress, gain multiplier
  // Yates (000000) keeps all money, others get 1/32 sent to company budget
  // Totem protection also keeps money (but consumes the protection)
  // force=true bypasses requirements (for terminal command)
  const prestige = useCallback((force: boolean = false) => {
    if (!force && !canPrestige()) return null;
    
    const isYates = userId === YATES_ACCOUNT_ID;
    // Check if player owns the totem trinket (not just the flag - the flag can get out of sync)
    const ownsTotem = gameState.ownedTrinketIds.includes('totem');
    const hasProtection = ownsTotem;
    const currentMoney = gameState.yatesDollars;
    const keepsMoney = isYates || hasProtection;
    const amountToCompany = keepsMoney ? 0 : Math.floor(currentMoney / 32);
    
    // Calculate new multiplier: starts at 1.1, +0.1 per prestige
    const newPrestigeCount = gameState.prestigeCount + 1;
    const newMultiplier = 1.0 + (newPrestigeCount * 0.1);

    setGameState((prev) => ({
      ...prev,
      // Reset rocks and pickaxes
      currentRockId: 1,
      currentRockHP: ROCKS[0].clicksToBreak,
      currentPickaxeId: 1,
      ownedPickaxeIds: [1],
      totalClicks: 0,
      rocksMinedCount: 0,
      // Reset miners
      minerCount: 0,
      // Yates or totem protection keeps money, others lose it
      yatesDollars: keepsMoney ? prev.yatesDollars : 0,
      // Keep coupons, autoclicker, cutscene seen, trinkets
      // BUT remove totem from inventory if it was used for protection
      ownedTrinketIds: hasProtection 
        ? prev.ownedTrinketIds.filter(id => id !== 'totem')
        : prev.ownedTrinketIds,
      equippedTrinketIds: hasProtection
        ? prev.equippedTrinketIds.filter(id => id !== 'totem')
        : prev.equippedTrinketIds,
      // Update prestige stats and give tokens
      prestigeCount: newPrestigeCount,
      prestigeMultiplier: newMultiplier,
      prestigeTokens: prev.prestigeTokens + PRESTIGE_TOKENS_PER_PRESTIGE,
      // Consume totem protection if it was used
      hasTotemProtection: false,
    }));

    // Force immediate save to Supabase after prestige (bypass debounce)
    // This prevents the merge logic from restoring old pre-prestige data on refresh
    if (userId && userType) {
      const rock = ROCKS[0];
      forceImmediateSave({
        user_id: userId,
        user_type: userType,
        yates_dollars: keepsMoney ? currentMoney : 0,
        total_clicks: 0,
        current_pickaxe_id: 1,
        current_rock_id: 1,
        current_rock_hp: rock.clicksToBreak,
        rocks_mined_count: 0,
        owned_pickaxe_ids: [1],
        miner_count: 0,
        prestige_count: newPrestigeCount,
        prestige_multiplier: newMultiplier,
        prestige_tokens: gameState.prestigeTokens + PRESTIGE_TOKENS_PER_PRESTIGE,
        has_totem_protection: false,
        owned_trinket_ids: hasProtection 
          ? gameState.ownedTrinketIds.filter(id => id !== 'totem')
          : gameState.ownedTrinketIds,
        equipped_trinket_ids: hasProtection
          ? gameState.equippedTrinketIds.filter(id => id !== 'totem')
          : gameState.equippedTrinketIds,
      });
    }

    return { amountToCompany, newMultiplier };
  }, [canPrestige, gameState.yatesDollars, gameState.prestigeCount, gameState.ownedTrinketIds, gameState.equippedTrinketIds, gameState.prestigeTokens, userId, userType]);

  // =====================
  // TRINKET FUNCTIONS
  // =====================
  
  const trinketShopItems = gameState.trinketShopItems
    .map(id => TRINKETS.find(t => t.id === id))
    .filter((t): t is Trinket => t !== undefined);
  
  const getTrinketShopTimeLeft = useCallback(() => {
    const elapsed = Date.now() - gameState.trinketShopLastRefresh;
    return Math.max(0, TRINKET_SHOP_REFRESH_INTERVAL - elapsed);
  }, [gameState.trinketShopLastRefresh]);
  
  const ownsTrinket = useCallback((trinketId: string) => {
    return gameState.ownedTrinketIds.includes(trinketId);
  }, [gameState.ownedTrinketIds]);
  
  const buyTrinket = useCallback((trinketId: string) => {
    const trinket = TRINKETS.find(t => t.id === trinketId);
    if (!trinket) return false;
    if (gameState.ownedTrinketIds.includes(trinketId)) return false;
    if (gameState.yatesDollars < trinket.cost) return false;
    
    setGameState(prev => ({
        ...prev,
      yatesDollars: prev.yatesDollars - trinket.cost,
      ownedTrinketIds: [...prev.ownedTrinketIds, trinketId],
      // If it's the totem, activate protection
      hasTotemProtection: trinket.effects.prestigeProtection ? true : prev.hasTotemProtection,
      // Remove from shop
      trinketShopItems: prev.trinketShopItems.filter(id => id !== trinketId),
      }));

      return true;
  }, [gameState.ownedTrinketIds, gameState.yatesDollars]);
  
  const canEquipDualTrinkets = useCallback(() => {
    return gameState.ownedPrestigeUpgradeIds.includes('dual_trinkets');
  }, [gameState.ownedPrestigeUpgradeIds]);

  const equipTrinket = useCallback((trinketId: string) => {
    if (!gameState.ownedTrinketIds.includes(trinketId)) return false;
    if (gameState.equippedTrinketIds.includes(trinketId)) return false;
    
    const maxEquipped = canEquipDualTrinkets() ? 2 : 1;

    setGameState(prev => {
      let newEquipped = [...prev.equippedTrinketIds, trinketId];
      // If over limit, remove oldest
      if (newEquipped.length > maxEquipped) {
        newEquipped = newEquipped.slice(-maxEquipped);
      }
      return { ...prev, equippedTrinketIds: newEquipped };
    });

    return true;
  }, [gameState.ownedTrinketIds, gameState.equippedTrinketIds, canEquipDualTrinkets]);

  const unequipTrinket = useCallback((trinketId: string) => {
    setGameState(prev => ({
      ...prev,
      equippedTrinketIds: prev.equippedTrinketIds.filter(id => id !== trinketId),
    }));
  }, []);

  const getEquippedTrinkets = useCallback(() => {
    return gameState.equippedTrinketIds
      .map(id => TRINKETS.find(t => t.id === id))
      .filter((t): t is Trinket => t !== undefined);
  }, [gameState.equippedTrinketIds]);

  const getTotalBonuses = useCallback(() => {
    return calculateTotalBonuses();
  }, [calculateTotalBonuses]);

  // =====================
  // MINER FUNCTIONS
  // =====================
  
  const getMinerCostFn = useCallback(() => {
    return getMinerCost(gameState.minerCount);
  }, [gameState.minerCount]);

  const buyMiner = useCallback(() => {
    if (gameState.minerCount >= MINER_MAX_COUNT) return false;
    const cost = getMinerCost(gameState.minerCount);
    if (gameState.yatesDollars < cost) return false;
    
    setGameState(prev => ({
      ...prev,
      yatesDollars: prev.yatesDollars - cost,
      minerCount: prev.minerCount + 1,
    }));
    
    return true;
  }, [gameState.minerCount, gameState.yatesDollars]);

  // =====================
  // PRESTIGE UPGRADE FUNCTIONS
  // =====================

  const ownsPrestigeUpgrade = useCallback((upgradeId: string) => {
    return gameState.ownedPrestigeUpgradeIds.includes(upgradeId);
  }, [gameState.ownedPrestigeUpgradeIds]);
    
  const buyPrestigeUpgrade = useCallback((upgradeId: string) => {
    const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return false;
    if (gameState.ownedPrestigeUpgradeIds.includes(upgradeId)) return false;
    if (gameState.prestigeTokens < upgrade.cost) return false;
    
    setGameState(prev => ({
      ...prev,
      prestigeTokens: prev.prestigeTokens - upgrade.cost,
      ownedPrestigeUpgradeIds: [...prev.ownedPrestigeUpgradeIds, upgradeId],
    }));

    return true;
  }, [gameState.ownedPrestigeUpgradeIds, gameState.prestigeTokens]);

  // Toggle auto-prestige (CM command only)
  const toggleAutoPrestige = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      autoPrestigeEnabled: !prev.autoPrestigeEnabled,
    }));
  }, [gameState.autoPrestigeEnabled]);

  // =====================
  // PICKAXE ABILITY FUNCTIONS
  // =====================

  // Check if current pickaxe has an active ability available
  const getCurrentPickaxeAbility = useCallback(() => {
    const pickaxe = getPickaxeById(gameState.currentPickaxeId);
    return pickaxe?.activeAbility || null;
  }, [gameState.currentPickaxeId]);

  // Get remaining cooldown time for current pickaxe's ability
  const getAbilityCooldownRemaining = useCallback(() => {
    const ability = getCurrentPickaxeAbility();
    if (!ability) return 0;
    const cooldownEnd = gameState.abilityCooldowns[ability.id] || 0;
    return Math.max(0, cooldownEnd - Date.now());
  }, [gameState.abilityCooldowns, getCurrentPickaxeAbility]);

  // Check if an ability is currently active
  const isAbilityActive = useCallback(() => {
    if (!gameState.activeAbility) return false;
    const { startTime, duration } = gameState.activeAbility;
    if (duration === 0) return false; // instant abilities are never "active"
    return Date.now() < startTime + duration;
  }, [gameState.activeAbility]);

  // Get remaining time for active ability
  const getActiveAbilityTimeRemaining = useCallback(() => {
    if (!gameState.activeAbility) return 0;
    const { startTime, duration } = gameState.activeAbility;
    if (duration === 0) return 0;
    return Math.max(0, (startTime + duration) - Date.now());
  }, [gameState.activeAbility]);

  // Activate the current pickaxe's ability
  const activateAbility = useCallback(() => {
    const ability = getCurrentPickaxeAbility();
    if (!ability) return false;

    // Check cooldown
    const cooldownEnd = gameState.abilityCooldowns[ability.id] || 0;
    if (Date.now() < cooldownEnd) return false;

    // Check cost
    if (gameState.yatesDollars < ability.cost) return false;

    // Handle instant break ability specially
    if (ability.effect.type === 'instant_break') {
      const rock = getRockById(gameState.currentRockId) || ROCKS[0];
      const money = Math.ceil(rock.moneyPerBreak * gameState.prestigeMultiplier);
      
      setGameState(prev => ({
        ...prev,
        yatesDollars: prev.yatesDollars - ability.cost + money,
        currentRockHP: rock.clicksToBreak, // Reset to full HP (new rock)
        rocksMinedCount: prev.rocksMinedCount + 1,
        abilityCooldowns: {
          ...prev.abilityCooldowns,
          [ability.id]: Date.now() + ability.cooldown,
        },
      }));
      return true;
    }

    // For duration-based abilities
    setGameState(prev => ({
      ...prev,
      yatesDollars: prev.yatesDollars - ability.cost,
      activeAbility: {
        pickaxeId: prev.currentPickaxeId,
        abilityId: ability.id,
        startTime: Date.now(),
        duration: ability.duration,
      },
      abilityCooldowns: {
        ...prev.abilityCooldowns,
        [ability.id]: Date.now() + ability.cooldown,
      },
    }));

    return true;
  }, [gameState.currentPickaxeId, gameState.abilityCooldowns, gameState.yatesDollars, gameState.currentRockId, gameState.prestigeMultiplier, getCurrentPickaxeAbility]);

  // Clear expired ability
  useEffect(() => {
    if (!gameState.activeAbility) return;
    
    const { startTime, duration } = gameState.activeAbility;
    if (duration === 0) return; // instant abilities don't need cleanup
    
    const timeLeft = (startTime + duration) - Date.now();
    if (timeLeft <= 0) {
      setGameState(prev => ({ ...prev, activeAbility: null }));
      return;
    }

    // Set timer to clear when it expires
    const timeout = setTimeout(() => {
      setGameState(prev => ({ ...prev, activeAbility: null }));
    }, timeLeft);

    return () => clearTimeout(timeout);
  }, [gameState.activeAbility]);

  // Submit appeal for anti-cheat violation
  const submitAppeal = useCallback(async (reason: string): Promise<boolean> => {
    if (!userId || !userType) return false;
    
    try {
      const username = employee?.name || client?.username || 'Unknown';
      
      // Create appeal record
      const { error: appealError } = await supabase.from('cheat_appeals').insert({
        user_id: userId,
        user_type: userType,
        username: username,
        appeal_reason: reason,
        status: 'pending',
      });

      if (appealError) {
        console.error('Error creating appeal:', appealError);
        return false;
      }

      // Send inbox messages to Logan (000001) and Bernardo (123456)
      const appealMessage = `🚨 CHEAT APPEAL from ${username}\n\nUser ID: ${userId}\nType: ${userType}\n\nReason: "${reason}"\n\nPlease review and approve/deny this appeal.`;
      
      // Message to Logan
      await supabase.from('employee_messages').insert({
        recipient_id: '000001',
        sender_name: 'Anti-Cheat System',
        sender_handle: 'anticheat.system',
        subject: `⚠️ Cheat Appeal: ${username}`,
        content: appealMessage,
        is_read: false,
      });

      // Message to Bernardo
      await supabase.from('employee_messages').insert({
        recipient_id: '123456',
        sender_name: 'Anti-Cheat System',
        sender_handle: 'anticheat.system',
        subject: `⚠️ Cheat Appeal: ${username}`,
        content: appealMessage,
        is_read: false,
      });

      // Update game state to pending appeal
      setGameState((prev) => ({
        ...prev,
        appealPending: true,
        isBlocked: true,
      }));

      return true;
    } catch (err) {
      console.error('Error submitting appeal:', err);
      return false;
    }
  }, [userId, userType, employee?.name, client?.username]);

  // Admin functions for internal terminal (only employees can use these)
  const addMoney = useCallback((amount: number) => {
    setGameState(prev => ({
      ...prev,
      yatesDollars: prev.yatesDollars + amount,
    }));
  }, []);

  const addMiners = useCallback((amount: number) => {
    setGameState(prev => ({
      ...prev,
      minerCount: Math.min(360, prev.minerCount + amount),
    }));
  }, []);

  const addPrestigeTokens = useCallback((amount: number) => {
    setGameState(prev => ({
      ...prev,
      prestigeTokens: prev.prestigeTokens + amount,
    }));
  }, []);

  const giveTrinket = useCallback((trinketId: string) => {
    const trinket = TRINKETS.find(t => t.id === trinketId);
    if (!trinket) return false;
    setGameState(prev => ({
      ...prev,
      ownedTrinketIds: [...new Set([...prev.ownedTrinketIds, trinketId])],
    }));
    return true;
  }, []);

  const givePickaxe = useCallback((pickaxeId: number) => {
    setGameState(prev => ({
      ...prev,
      ownedPickaxeIds: [...new Set([...prev.ownedPickaxeIds, pickaxeId])],
    }));
  }, []);

  const setTotalClicks = useCallback((clicks: number) => {
    setGameState(prev => ({
      ...prev,
      totalClicks: clicks,
    }));
  }, []);

  // Always render - game will work with default state while data loads

  return (
    <GameContext.Provider
      value={{
        gameState,
        currentPickaxe,
        currentRock,
        mineRock,
        buyPickaxe,
        canAffordPickaxe,
        ownsPickaxe,
        equipPickaxe,
        selectRock,
        getUnlockedRocks,
        resetGame,
        markCutsceneSeen,
        useCoupon,
        spendMoney,
        shopStock,
        buyShopProduct,
        getTimeUntilRestock,
        buyAutoclicker,
        toggleAutoclicker,
        canPrestige,
        prestige,
        dismissWarning,
        clearClickHistory,
        submitAppeal,
        isBanned,
        banReason,
        // Trinket functions
        trinketShopItems,
        getTrinketShopTimeLeft,
        buyTrinket,
        equipTrinket,
        unequipTrinket,
        ownsTrinket,
        getEquippedTrinkets,
        getTotalBonuses,
        yatesTotemSpawned,
        // Miner functions
        buyMiner,
        getMinerCost: getMinerCostFn,
        // Prestige upgrade functions
        buyPrestigeUpgrade,
        ownsPrestigeUpgrade,
        canEquipDualTrinkets,
        // Auto-prestige
        toggleAutoPrestige,
        // Admin functions (terminal)
        addMoney,
        addMiners,
        addPrestigeTokens,
        giveTrinket,
        givePickaxe,
        setTotalClicks,
        // Pickaxe ability functions
        activateAbility,
        getAbilityCooldownRemaining,
        isAbilityActive,
        getActiveAbilityTimeRemaining,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
