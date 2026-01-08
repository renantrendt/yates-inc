'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { 
  GameState, COUPON_DROP_RATES, COUPON_REQUIREMENTS, ShopStock, 
  SHOP_RESTOCK_INTERVAL, SHOP_MIN_ITEMS, SHOP_MAX_ITEMS, SHOP_MIN_QUANTITY, SHOP_MAX_QUANTITY, 
  AUTOCLICKER_COST, PRESTIGE_REQUIREMENTS, YATES_ACCOUNT_ID,
  TRINKETS, Trinket, TRINKET_SHOP_REFRESH_INTERVAL, TRINKET_SHOP_MIN_ITEMS, TRINKET_SHOP_MAX_ITEMS,
  MINER_TICK_INTERVAL, MINER_BASE_DAMAGE, MINER_MAX_COUNT, getMinerCost,
  PRESTIGE_UPGRADES, PrestigeUpgrade, PRESTIGE_TOKENS_PER_PRESTIGE, RARITY_COLORS
} from '@/types/game';
import { products } from '@/utils/products';
import { PICKAXES, ROCKS, getPickaxeById, getRockById, getHighestUnlockedRock } from '@/lib/gameData';
import { useAuth } from './AuthContext';
import { useClient } from './ClientContext';
import { fetchUserGameData, debouncedSaveUserGameData, flushPendingData, savePurchase } from '@/lib/userDataSync';
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

      console.log(`📈 Active budget increased by $${contribution} from ${productName} sale`);
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
  prestige: () => { amountToCompany: number; newMultiplier: number } | null;
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
};

const STORAGE_KEY = 'yates-mining-game';

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

  // Anti-cheat: Track click timestamps for rate detection
  const clickTimestampsRef = useRef<number[]>([]);
  const CLICK_WINDOW_MS = 1000; // 1 second rolling window
  const NORMAL_CLICK_THRESHOLD = 13; // Max 13 clicks/sec for normal users
  const WATCHLIST_CLICK_THRESHOLD = 10; // Max 10 clicks/sec for watchlist users

  // Check if click rate exceeds threshold and trigger warning if needed
  const checkClickRate = useCallback((): boolean => {
    const now = Date.now();
    // Add current click timestamp
    clickTimestampsRef.current.push(now);
    
    // Remove clicks older than 1 second
    clickTimestampsRef.current = clickTimestampsRef.current.filter(
      (timestamp) => now - timestamp <= CLICK_WINDOW_MS
    );
    
    // Get the appropriate threshold
    const threshold = gameState.isOnWatchlist ? WATCHLIST_CLICK_THRESHOLD : NORMAL_CLICK_THRESHOLD;
    
    // Check if over threshold
    if (clickTimestampsRef.current.length > threshold) {
      return true; // Violation detected
    }
    return false;
  }, [gameState.isOnWatchlist]);

  // Trigger anti-cheat warning
  const triggerAntiCheatWarning = useCallback(() => {
    setGameState((prev) => {
      const newWarnings = prev.antiCheatWarnings + 1;
      console.log(`⚠️ Anti-cheat warning ${newWarnings}/3 triggered!`);
      return {
        ...prev,
        antiCheatWarnings: newWarnings,
        isBlocked: true, // Block earning until modal is dismissed
      };
    });
    // Clear click history after violation
    clickTimestampsRef.current = [];
  }, []);

  // Dismiss warning (called from UI after user acknowledges)
  const dismissWarning = useCallback(() => {
    // Clear click history when dismissing warning
    clickTimestampsRef.current = [];
    setGameState((prev) => ({
      ...prev,
      isBlocked: false,
    }));
  }, []);
  
  // Clear click history (for admin commands like CM)
  const clearClickHistory = useCallback(() => {
    clickTimestampsRef.current = [];
  }, []);

  // Load from localStorage IMMEDIATELY (synchronous) so game works right away
  useEffect(() => {
    isLoadingRef.current = true; // Mark as loading
    
    // Load localStorage first - this is instant
    const saved = localStorage.getItem(STORAGE_KEY);
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
        console.warn('⏱️ Supabase load timeout - game already working with localStorage');
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
              console.log('🚫 User is BANNED:', banData.ban_reason);
              setIsLoaded(true);
              clearTimeout(timeoutId);
              return; // Don't load game data for banned users
            }

            // Try to load from Supabase (will merge with localStorage if it fails)
            const supabaseData = await fetchUserGameData(userId);
            if (supabaseData) {
              // Merge Supabase data with current state (from localStorage)
              // This preserves localStorage values for flags like hasSeenCutscene
              // but updates progress data from Supabase
              setGameState(prev => ({
                ...prev,
                // Update progress data from Supabase
                yatesDollars: supabaseData.yates_dollars ?? prev.yatesDollars,
                totalClicks: supabaseData.total_clicks ?? prev.totalClicks,
                currentPickaxeId: supabaseData.current_pickaxe_id ?? prev.currentPickaxeId,
                currentRockId: supabaseData.current_rock_id ?? prev.currentRockId,
                currentRockHP: supabaseData.current_rock_hp ?? prev.currentRockHP,
                rocksMinedCount: supabaseData.rocks_mined_count ?? prev.rocksMinedCount,
                ownedPickaxeIds: supabaseData.owned_pickaxe_ids?.length ? supabaseData.owned_pickaxe_ids : prev.ownedPickaxeIds,
                coupons: {
                  discount30: supabaseData.coupons_30 ?? prev.coupons.discount30,
                  discount50: supabaseData.coupons_50 ?? prev.coupons.discount50,
                  discount100: supabaseData.coupons_100 ?? prev.coupons.discount100,
                },
                // Keep localStorage value for hasSeenCutscene if it's true (user already saw it)
                // Only update if Supabase says true (to sync across devices)
                hasSeenCutscene: prev.hasSeenCutscene || (supabaseData.has_seen_cutscene ?? false),
                hasAutoclicker: supabaseData.has_autoclicker ?? prev.hasAutoclicker,
                autoclickerEnabled: supabaseData.autoclicker_enabled ?? prev.autoclickerEnabled,
                prestigeCount: supabaseData.prestige_count ?? prev.prestigeCount,
                prestigeMultiplier: supabaseData.prestige_multiplier ?? prev.prestigeMultiplier,
                // Anti-cheat fields
                antiCheatWarnings: supabaseData.anti_cheat_warnings ?? prev.antiCheatWarnings,
                isOnWatchlist: supabaseData.is_on_watchlist ?? prev.isOnWatchlist,
                isBlocked: supabaseData.is_blocked ?? prev.isBlocked,
                appealPending: supabaseData.appeal_pending ?? prev.appealPending,
                // Trinkets
                ownedTrinketIds: supabaseData.owned_trinket_ids?.length ? supabaseData.owned_trinket_ids : prev.ownedTrinketIds,
                equippedTrinketIds: supabaseData.equipped_trinket_ids?.length ? supabaseData.equipped_trinket_ids : prev.equippedTrinketIds,
                trinketShopItems: supabaseData.trinket_shop_items?.length ? supabaseData.trinket_shop_items : prev.trinketShopItems,
                trinketShopLastRefresh: supabaseData.trinket_shop_last_refresh ?? prev.trinketShopLastRefresh,
                hasTotemProtection: supabaseData.has_totem_protection ?? prev.hasTotemProtection,
                // Miners
                minerCount: supabaseData.miner_count ?? prev.minerCount,
                minerLastTick: supabaseData.miner_last_tick ?? prev.minerLastTick,
                // Prestige upgrades
                prestigeTokens: supabaseData.prestige_tokens ?? prev.prestigeTokens,
                ownedPrestigeUpgradeIds: supabaseData.owned_prestige_upgrade_ids?.length ? supabaseData.owned_prestige_upgrade_ids : prev.ownedPrestigeUpgradeIds,
                // Auto-prestige
                autoPrestigeEnabled: supabaseData.auto_prestige_enabled ?? prev.autoPrestigeEnabled,
              }));
              console.log('📦 Loaded game data from Supabase (merged with localStorage)');
            } else {
              // Supabase failed, but we already loaded from localStorage above
              console.log('⚠️ Supabase load failed, using localStorage data');
            }
          } catch (err) {
            // If anything fails, just use localStorage (already loaded above)
            console.warn('⚠️ Error loading from Supabase, using localStorage:', err);
          }
        }

        clearTimeout(timeoutId); // Clear timeout
      } catch (err) {
        // Ultimate fallback - if everything fails, game still works with localStorage
        console.error('💥 Error loading Supabase data (game still works):', err);
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
      if (timeSinceRefresh >= TRINKET_SHOP_REFRESH_INTERVAL || gameState.trinketShopItems.length === 0) {
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
  }, [gameState.trinketShopLastRefresh, gameState.trinketShopItems.length]);

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
        
        const rock = getRockById(prev.currentRockId) || ROCKS[0];
        const damage = prev.minerCount * MINER_BASE_DAMAGE; // 5 damage per miner per second
        const newHP = prev.currentRockHP - damage;
        
        // Rock didn't break yet
        if (newHP > 0) {
          return {
            ...prev,
            currentRockHP: newHP,
          };
        }
        
        // Rock broke! Get money
        const money = Math.ceil(rock.moneyPerBreak * prev.prestigeMultiplier);
        
        // Add miner damage as "clicks" for rock unlock progress
        const newTotalClicks = prev.totalClicks + damage;
        
        // Check for rock upgrade
        const highestUnlocked = getHighestUnlockedRock(newTotalClicks);
        const newCurrentRockId = highestUnlocked.id > prev.currentRockId ? highestUnlocked.id : prev.currentRockId;
        
        // Reset rock HP
        const nextRock = getRockById(newCurrentRockId) || ROCKS[0];
        
        return {
          ...prev,
          currentRockHP: nextRock.clicksToBreak,
          currentRockId: newCurrentRockId,
          rocksMinedCount: prev.rocksMinedCount + 1,
          yatesDollars: prev.yatesDollars + money,
          totalClicks: newTotalClicks,
          lastMinerEarnings: money, // Track for visual indicator
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
        const hasProtection = gameState.hasTotemProtection;
        
        setGameState(prev => ({
          ...prev,
          currentRockId: 1,
          currentRockHP: ROCKS[0].clicksToBreak,
          currentPickaxeId: 1,
          ownedPickaxeIds: [1],
          totalClicks: 0,
          rocksMinedCount: 0,
          yatesDollars: (isYates || hasProtection) ? prev.yatesDollars : 0,
          prestigeCount: newPrestigeCount,
          prestigeMultiplier: newMultiplier,
          prestigeTokens: prev.prestigeTokens + PRESTIGE_TOKENS_PER_PRESTIGE,
          hasTotemProtection: false, // Consume totem protection
        }));
        console.log(`🤖 Auto-prestige! Level ${newPrestigeCount}`);
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [gameState.autoPrestigeEnabled, gameState.currentRockId, gameState.ownedPickaxeIds, gameState.prestigeCount, userId, gameState.hasTotemProtection]);

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
    
    // Add bonuses from equipped trinkets
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
    
    // Add bonuses from prestige upgrades
    for (const upgradeId of gameState.ownedPrestigeUpgradeIds) {
      const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId);
      if (upgrade) {
        const e = upgrade.effects;
        bonuses.moneyBonus += e.moneyBonus || 0;
        bonuses.rockDamageBonus += e.rockDamageBonus || 0;
        bonuses.clickSpeedBonus += e.clickSpeedBonus || 0;
        bonuses.couponBonus += e.couponBonus || 0;
        bonuses.minerSpeedBonus += e.minerSpeedBonus || 0;
        bonuses.minerDamageBonus += e.minerDamageBonus || 0;
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
      // Always save to localStorage immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, shopStock }));
      console.log('💾 Saved to localStorage:', { yatesDollars: gameState.yatesDollars, totalClicks: gameState.totalClicks });

      // If logged in, also sync to Supabase (debounced)
      if (userId && userType) {
        debouncedSaveUserGameData({
          user_id: userId,
          user_type: userType,
          yates_dollars: gameState.yatesDollars,
          total_clicks: gameState.totalClicks,
          current_pickaxe_id: gameState.currentPickaxeId,
          current_rock_id: gameState.currentRockId,
          current_rock_hp: gameState.currentRockHP,
          rocks_mined_count: gameState.rocksMinedCount,
          owned_pickaxe_ids: gameState.ownedPickaxeIds,
          coupons_30: gameState.coupons.discount30,
          coupons_50: gameState.coupons.discount50,
          coupons_100: gameState.coupons.discount100,
          has_seen_cutscene: gameState.hasSeenCutscene,
          has_autoclicker: gameState.hasAutoclicker,
          autoclicker_enabled: gameState.autoclickerEnabled,
          prestige_count: gameState.prestigeCount,
          prestige_multiplier: gameState.prestigeMultiplier,
          // Anti-cheat fields
          anti_cheat_warnings: gameState.antiCheatWarnings,
          is_on_watchlist: gameState.isOnWatchlist,
          is_blocked: gameState.isBlocked,
          appeal_pending: gameState.appealPending,
          // Trinkets
          owned_trinket_ids: gameState.ownedTrinketIds,
          equipped_trinket_ids: gameState.equippedTrinketIds,
          trinket_shop_items: gameState.trinketShopItems,
          trinket_shop_last_refresh: gameState.trinketShopLastRefresh,
          has_totem_protection: gameState.hasTotemProtection,
          // Miners
          miner_count: gameState.minerCount,
          miner_last_tick: gameState.minerLastTick,
          // Prestige upgrades
          prestige_tokens: gameState.prestigeTokens,
          owned_prestige_upgrade_ids: gameState.ownedPrestigeUpgradeIds,
          // Auto-prestige
          auto_prestige_enabled: gameState.autoPrestigeEnabled,
        });
        console.log('💾 Queued save to Supabase');
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
  
  // Expose cheat functions to window ONLY for admins
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clean up any existing cheat functions first
      const win = (window as unknown) as Record<string, unknown>;
      delete win._ya;
      delete win.yatesReset;
      delete win.yatesGivePcx;
      delete win.yatesGiveAllPcx;
      delete win.yatesGiveMoney;
      delete win.yatesHelp;
      
      // Only expose if employee (has numbered ID)
      if (isEmployee) {
        // Use obfuscated name so it's not easily discoverable
        win._ya = {
          r: () => {
        localStorage.removeItem(STORAGE_KEY);
        setGameStateRef.current(defaultGameState);
        console.log('🎮 Progress reset! Refresh the page.');
          },
          p: (id: number) => {
        if (id < 1 || id > PICKAXES.length) {
          console.log(`❌ Invalid pickaxe ID. Use 1-${PICKAXES.length}`);
          return;
        }
        setGameStateRef.current(prev => ({
          ...prev,
          ownedPickaxeIds: [...new Set([...prev.ownedPickaxeIds, id])],
          currentPickaxeId: id,
        }));
        const pcx = PICKAXES.find(p => p.id === id);
        console.log(`⛏️ Gave pickaxe: ${pcx?.name} (ID: ${id})`);
          },
          ap: () => {
        setGameStateRef.current(prev => ({
          ...prev,
          ownedPickaxeIds: PICKAXES.map(p => p.id),
          currentPickaxeId: PICKAXES[PICKAXES.length - 1].id,
        }));
        console.log('⛏️ Unlocked ALL pickaxes!');
          },
          m: (amount: number) => {
        setGameStateRef.current(prev => ({
          ...prev,
          yatesDollars: prev.yatesDollars + amount,
        }));
        console.log(`💰 Added $${amount.toLocaleString()} Yates Dollars!`);
          },
          h: () => {
        console.log(`
🎮 ADMIN CHEATS:
━━━━━━━━━━━━━━━━
_ya.r()      - Reset progress
_ya.p(id)    - Give pickaxe (1-${PICKAXES.length})
_ya.ap()     - All pickaxes
_ya.m(amt)   - Add money
_ya.at()     - Toggle auto-prestige
_ya.t(id)    - Give trinket
_ya.h()      - This help
        `);
          },
          at: () => {
        setGameStateRef.current(prev => ({
          ...prev,
          autoPrestigeEnabled: !prev.autoPrestigeEnabled,
        }));
        console.log('🤖 Auto-prestige toggled');
          },
          t: (id: string) => {
        const validIds = TRINKETS.map(t => t.id);
        if (!validIds.includes(id)) {
          console.log(`❌ Invalid trinket ID. Options: ${validIds.join(', ')}`);
          return;
        }
        setGameStateRef.current(prev => ({
          ...prev,
          ownedTrinketIds: [...new Set([...prev.ownedTrinketIds, id])],
        }));
        const trinket = TRINKETS.find(t => t.id === id);
        console.log(`💎 Gave trinket: ${trinket?.name}`);
          },
          giveTrinket: (id: string) => {
        const validIds = TRINKETS.map(t => t.id);
        if (!validIds.includes(id)) {
          console.log(`❌ Invalid trinket ID. Options: ${validIds.join(', ')}`);
          return;
        }
        setGameStateRef.current(prev => ({
          ...prev,
          ownedTrinketIds: [...new Set([...prev.ownedTrinketIds, id])],
        }));
        const trinket = TRINKETS.find(t => t.id === id);
        console.log(`💎 Gave trinket: ${trinket?.name}`);
          },
          giveMiners: (amt: number) => {
        setGameStateRef.current(prev => ({
          ...prev,
          minerCount: Math.min(360, prev.minerCount + amt),
        }));
        console.log(`👷 Added ${amt} miners!`);
          },
          giveTokens: (amt: number) => {
        setGameStateRef.current(prev => ({
          ...prev,
          prestigeTokens: prev.prestigeTokens + amt,
        }));
        console.log(`✨ Added ${amt} prestige tokens!`);
          },
        };
        // No console.log announcement - admins know the commands
      }
    }
    
    return () => {
      // Cleanup on unmount
      if (typeof window !== 'undefined') {
        const win = (window as unknown) as Record<string, unknown>;
        delete win._ya;
    }
    };
  }, [isEmployee]);

  const currentPickaxe = getPickaxeById(gameState.currentPickaxeId) || PICKAXES[0];
  const currentRock = getRockById(gameState.currentRockId) || ROCKS[0];

  const mineRock = useCallback(() => {
    // Anti-cheat: If blocked, don't process clicks
    if (gameState.isBlocked || gameState.appealPending) {
      return { brokeRock: false, earnedMoney: 0, couponDrop: null };
    }

    // Anti-cheat: Check click rate (skip for admins using internal autoclicker)
    const isViolation = checkClickRate();
    if (isViolation && !gameState.hasAutoclicker) {
      // Only trigger if not using internal autoclicker
      triggerAntiCheatWarning();
      return { brokeRock: false, earnedMoney: 0, couponDrop: null };
    }

    const pickaxe = getPickaxeById(gameState.currentPickaxeId) || PICKAXES[0];
    const rock = getRockById(gameState.currentRockId) || ROCKS[0];
    
    // Get total bonuses from trinkets and prestige upgrades
    const bonuses = calculateTotalBonuses();
    
    let brokeRock = false;
    let earnedMoney = 0;
    let couponDrop: string | null = null;

    // Calculate click power with rock damage bonus
    let clickPower = pickaxe.name === 'Plasma' ? rock.clicksToBreak : pickaxe.clickPower;
    clickPower = Math.ceil(clickPower * (1 + bonuses.rockDamageBonus));
    const newHP = Math.max(0, gameState.currentRockHP - clickPower);

    // Check if this click breaks the rock
    const willBreak = newHP <= 0;

    // Money earned = moneyPerClick (always) + moneyPerBreak (only when breaking)
    earnedMoney = rock.moneyPerClick;
    
    if (willBreak) {
      earnedMoney += rock.moneyPerBreak;
    }

    // Apply money multipliers
    if (pickaxe.moneyMultiplier) {
      earnedMoney *= pickaxe.moneyMultiplier;
    }

    // Apply prestige multiplier
    earnedMoney *= gameState.prestigeMultiplier;
    
    // Apply trinket money bonus
    earnedMoney *= (1 + bonuses.moneyBonus);

    earnedMoney = Math.ceil(earnedMoney);

    setGameState((prev) => {
      // Click power counts towards total clicks (for rock unlocking)
      const newTotalClicks = prev.totalClicks + clickPower;
      let newRockHP = newHP;
      let newRocksMinedCount = prev.rocksMinedCount;
      let newCurrentRockId = prev.currentRockId;

      // Check if rock broke
      if (newHP <= 0) {
        brokeRock = true;
        newRocksMinedCount += 1;
        
        // Check for rock upgrade
        const highestUnlocked = getHighestUnlockedRock(newTotalClicks);
        if (highestUnlocked.id > prev.currentRockId) {
          newCurrentRockId = highestUnlocked.id;
        }
        
        // Reset HP for new/same rock
        const nextRock = getRockById(newCurrentRockId) || rock;
        newRockHP = nextRock.clicksToBreak;
      }

      // Check for coupon drop (only if requirements met)
      const meetsRequirements = 
        prev.currentRockId >= COUPON_REQUIREMENTS.minRockId &&
        prev.currentPickaxeId >= COUPON_REQUIREMENTS.minPickaxeId;

      let newCoupons = { ...prev.coupons };
      if (meetsRequirements) {
        const luckBonus = (pickaxe.couponLuckBonus || 0) + bonuses.couponBonus;
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
  }, [gameState.currentPickaxeId, gameState.currentRockId, gameState.currentRockHP]);

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

    setGameState((prev) => ({
      ...prev,
      yatesDollars: prev.yatesDollars - pickaxe.price,
      ownedPickaxeIds: [...prev.ownedPickaxeIds, pickaxeId],
      currentPickaxeId: pickaxeId, // Auto-equip after purchase
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
    localStorage.removeItem(STORAGE_KEY);
  }, []);

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
  const prestige = useCallback(() => {
    if (!canPrestige()) return null;

    const isYates = userId === YATES_ACCOUNT_ID;
    const hasProtection = gameState.hasTotemProtection;
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
      // Update prestige stats and give tokens
      prestigeCount: newPrestigeCount,
      prestigeMultiplier: newMultiplier,
      prestigeTokens: prev.prestigeTokens + PRESTIGE_TOKENS_PER_PRESTIGE,
      // Consume totem protection if it was used
      hasTotemProtection: false,
    }));

    const reason = isYates ? ' (Yates: kept all money!)' : hasProtection ? ' (Totem protected your money!)' : '';
    console.log(`🌟 PRESTIGE ${newPrestigeCount}! Multiplier: ${newMultiplier}x, +${PRESTIGE_TOKENS_PER_PRESTIGE} tokens${reason}`);

    return { amountToCompany, newMultiplier };
  }, [canPrestige, gameState.yatesDollars, gameState.prestigeCount, gameState.hasTotemProtection, userId]);

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

    console.log(`💎 Bought trinket: ${trinket.name}`);
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
    
    console.log(`⛏️ Hired miner #${gameState.minerCount + 1}!`);
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

    console.log(`🌟 Bought prestige upgrade: ${upgrade.name}`);
    return true;
  }, [gameState.ownedPrestigeUpgradeIds, gameState.prestigeTokens]);

  // Toggle auto-prestige (CM command only)
  const toggleAutoPrestige = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      autoPrestigeEnabled: !prev.autoPrestigeEnabled,
    }));
    console.log(`🤖 Auto-prestige: ${!gameState.autoPrestigeEnabled ? 'ON' : 'OFF'}`);
  }, [gameState.autoPrestigeEnabled]);

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

      console.log('📨 Appeal submitted and sent to admins');
      return true;
    } catch (err) {
      console.error('Error submitting appeal:', err);
      return false;
    }
  }, [userId, userType, employee?.name, client?.username]);

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
