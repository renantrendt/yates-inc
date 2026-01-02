'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { GameState, COUPON_DROP_RATES, COUPON_REQUIREMENTS, ShopStock, SHOP_RESTOCK_INTERVAL, SHOP_MIN_ITEMS, SHOP_MAX_ITEMS, SHOP_MIN_QUANTITY, SHOP_MAX_QUANTITY } from '@/types/game';
import { products } from '@/utils/products';
import { PICKAXES, ROCKS, getPickaxeById, getRockById, getHighestUnlockedRock } from '@/lib/gameData';
import { useAuth } from './AuthContext';
import { useClient } from './ClientContext';
import { fetchUserGameData, debouncedSaveUserGameData } from '@/lib/userDataSync';

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

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [shopStock, setShopStock] = useState<ShopStock>(() => generateShopStock());
  const [isLoaded, setIsLoaded] = useState(false);
  const { employee } = useAuth();
  const { client } = useClient();
  
  // Get current user ID and type
  const userId = employee?.id || client?.id || null;
  const userType: 'employee' | 'client' | null = employee ? 'employee' : client ? 'client' : null;
  
  // Ref for cheat commands to access latest setGameState
  const setGameStateRef = useRef(setGameState);
  setGameStateRef.current = setGameState;

  // Load from localStorage first, then try Supabase if logged in
  useEffect(() => {
    const loadData = async () => {
      // First load from localStorage as fallback
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
        }
      }

      // If logged in, try to load from Supabase
      if (userId && userType) {
        const supabaseData = await fetchUserGameData(userId);
        if (supabaseData) {
          setGameState({
            yatesDollars: supabaseData.yates_dollars || 0,
            totalClicks: supabaseData.total_clicks || 0,
            currentPickaxeId: supabaseData.current_pickaxe_id || 1,
            currentRockId: supabaseData.current_rock_id || 1,
            currentRockHP: supabaseData.current_rock_hp || ROCKS[0].clicksToBreak,
            rocksMinedCount: supabaseData.rocks_mined_count || 0,
            ownedPickaxeIds: supabaseData.owned_pickaxe_ids || [1],
            coupons: {
              discount30: supabaseData.coupons_30 || 0,
              discount50: supabaseData.coupons_50 || 0,
              discount100: supabaseData.coupons_100 || 0,
            },
            hasSeenCutscene: supabaseData.has_seen_cutscene || false,
          });
          console.log('📦 Loaded game data from Supabase');
        }
      }

      setIsLoaded(true);
    };

    loadData();
  }, [userId, userType]);

  // Auto-restock check every second
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceRestock = Date.now() - shopStock.lastRestockTime;
      if (timeSinceRestock >= SHOP_RESTOCK_INTERVAL) {
        setShopStock(generateShopStock());
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [shopStock.lastRestockTime]);

  // Save to localStorage and Supabase whenever state changes
  useEffect(() => {
    if (isLoaded) {
      // Always save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, shopStock }));

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
        });
      }
    }
  }, [gameState, shopStock, isLoaded, userId, userType]);

  // Expose cheat functions to window for F12 console testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ((window as unknown) as Record<string, unknown>).yatesReset = () => {
        localStorage.removeItem(STORAGE_KEY);
        setGameStateRef.current(defaultGameState);
        console.log('🎮 Progress reset! Refresh the page.');
      };
      
      ((window as unknown) as Record<string, unknown>).yatesGivePcx = (id: number) => {
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
      };
      
      ((window as unknown) as Record<string, unknown>).yatesGiveAllPcx = () => {
        setGameStateRef.current(prev => ({
          ...prev,
          ownedPickaxeIds: PICKAXES.map(p => p.id),
          currentPickaxeId: PICKAXES[PICKAXES.length - 1].id,
        }));
        console.log('⛏️ Unlocked ALL pickaxes!');
      };
      
      ((window as unknown) as Record<string, unknown>).yatesGiveMoney = (amount: number) => {
        setGameStateRef.current(prev => ({
          ...prev,
          yatesDollars: prev.yatesDollars + amount,
        }));
        console.log(`💰 Added $${amount.toLocaleString()} Yates Dollars!`);
      };
      
      ((window as unknown) as Record<string, unknown>).yatesHelp = () => {
        console.log(`
🎮 YATES MINING GAME CHEATS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
yatesReset()         - Reset all progress
yatesGivePcx(id)     - Give pickaxe by ID (1-${PICKAXES.length})
yatesGiveAllPcx()    - Unlock all pickaxes
yatesGiveMoney(amt)  - Add Yates Dollars
yatesHelp()          - Show this help
        `);
      };
      
      console.log('🎮 Yates Mining Game: Type yatesHelp() for cheat commands');
    }
  }, []);

  const currentPickaxe = getPickaxeById(gameState.currentPickaxeId) || PICKAXES[0];
  const currentRock = getRockById(gameState.currentRockId) || ROCKS[0];

  const mineRock = useCallback(() => {
    const pickaxe = getPickaxeById(gameState.currentPickaxeId) || PICKAXES[0];
    const rock = getRockById(gameState.currentRockId) || ROCKS[0];
    
    let brokeRock = false;
    let earnedMoney = 0;
    let couponDrop: string | null = null;

    // Calculate click power (Plasma = instant break)
    const clickPower = pickaxe.name === 'Plasma' ? rock.clicksToBreak : pickaxe.clickPower;
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
        const luckBonus = pickaxe.couponLuckBonus || 0;
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
    
    return true;
  }, [gameState.yatesDollars, shopStock.items]);

  const getTimeUntilRestock = useCallback(() => {
    const elapsed = Date.now() - shopStock.lastRestockTime;
    return Math.max(0, SHOP_RESTOCK_INTERVAL - elapsed);
  }, [shopStock.lastRestockTime]);

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

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

