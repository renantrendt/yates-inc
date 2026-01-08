'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { StockState, StockContextType, StockPricePoint } from '@/types';
import { useAuth } from './AuthContext';
import { useClient } from './ClientContext';
import { fetchUserGameData, debouncedSaveUserGameData } from '@/lib/userDataSync';

// Stock price constraints
const MIN_STOCK_PRICE = 500000; // 500K minimum
const MAX_STOCK_PRICE = 10000000; // 10M maximum
const PRICE_UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes in ms
const INITIAL_PRICE = 1000000; // Start at 1M
const MAX_PRICE_HISTORY = 100; // Keep last 100 price points

// Unlock requirements
const REQUIRED_ROCK_ID = 16;
const REQUIRED_PICKAXE_COUNT = 12;

// Employee monthly bonus
const EMPLOYEE_MONTHLY_STOCKS = 4;
const MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const STORAGE_KEY = 'yates-stock-market';
const EMPLOYEE_BONUS_KEY = 'yates-employee-stock-bonus';

// Generate a new price with slight upward bias
function generateNextPrice(currentPrice: number): number {
  // Random change between -15% and +20% (slight upward bias)
  const changePercent = (Math.random() * 0.35) - 0.15;
  let newPrice = currentPrice * (1 + changePercent);
  
  // Clamp to min/max
  newPrice = Math.max(MIN_STOCK_PRICE, Math.min(MAX_STOCK_PRICE, newPrice));
  
  // Round to nearest 1000
  return Math.round(newPrice / 1000) * 1000;
}

// Generate initial price history (last 24 hours of fake data)
function generateInitialHistory(): StockPricePoint[] {
  const history: StockPricePoint[] = [];
  const now = Date.now();
  let price = INITIAL_PRICE;
  
  // Generate 96 points (24 hours at 15-min intervals)
  for (let i = 95; i >= 0; i--) {
    const timestamp = now - (i * PRICE_UPDATE_INTERVAL);
    history.push({ timestamp, price });
    price = generateNextPrice(price);
  }
  
  return history;
}

const defaultStockState: StockState = {
  priceHistory: [],
  currentPrice: INITIAL_PRICE,
  ownedStocks: 0,
  stockProfits: 0,
  lastPriceUpdate: 0,
};

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [stockState, setStockState] = useState<StockState>(defaultStockState);
  const [isLoaded, setIsLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { employee } = useAuth();
  const { client } = useClient();

  // Get current user ID and type
  const userId = employee?.id || client?.id || null;
  const userType: 'employee' | 'client' | null = employee ? 'employee' : client ? 'client' : null;

  // Load from localStorage and Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      let loadedFromSupabase = false;
      
      // Try loading from Supabase first if logged in
      if (userId && userType) {
        const supabaseData = await fetchUserGameData(userId);
        if (supabaseData && ((supabaseData.stocks_owned ?? 0) > 0 || (supabaseData.stock_profits ?? 0) > 0)) {
          // Generate fresh price history but use Supabase stock data
          const history = generateInitialHistory();
          setStockState({
            priceHistory: history,
            currentPrice: history[history.length - 1].price,
            ownedStocks: supabaseData.stocks_owned || 0,
            stockProfits: supabaseData.stock_profits || 0,
            lastPriceUpdate: Date.now(),
          });
          loadedFromSupabase = true;
          console.log('📦 Loaded stock data from Supabase');
        }
      }

      // Fallback to localStorage
      if (!loadedFromSupabase) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            
            const now = Date.now();
            const timeSinceLastUpdate = now - (parsed.lastPriceUpdate || 0);
            const missedUpdates = Math.floor(timeSinceLastUpdate / PRICE_UPDATE_INTERVAL);
            
            if (missedUpdates > 0 && parsed.priceHistory?.length > 0) {
              let currentPrice = parsed.currentPrice || INITIAL_PRICE;
              const newHistory = [...(parsed.priceHistory || [])];
              
              for (let i = 0; i < Math.min(missedUpdates, 20); i++) {
                currentPrice = generateNextPrice(currentPrice);
                newHistory.push({
                  timestamp: now - ((missedUpdates - i) * PRICE_UPDATE_INTERVAL),
                  price: currentPrice,
                });
              }
              
              while (newHistory.length > MAX_PRICE_HISTORY) {
                newHistory.shift();
              }
              
              setStockState({
                ...parsed,
                priceHistory: newHistory,
                currentPrice,
                lastPriceUpdate: now,
              });
            } else {
              setStockState(parsed);
            }
          } catch {
            console.error('Failed to parse saved stock state');
            const history = generateInitialHistory();
            setStockState({
              ...defaultStockState,
              priceHistory: history,
              currentPrice: history[history.length - 1].price,
              lastPriceUpdate: Date.now(),
            });
          }
        } else {
          const history = generateInitialHistory();
          setStockState({
            ...defaultStockState,
            priceHistory: history,
            currentPrice: history[history.length - 1].price,
            lastPriceUpdate: Date.now(),
          });
        }
      }

      setIsLoaded(true);
    };

    loadData();
  }, [userId, userType]);

  // Save to localStorage and Supabase whenever state changes
  useEffect(() => {
    if (isLoaded) {
      // Always save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stockState));

      // If logged in, also sync to Supabase (debounced)
      if (userId && userType) {
        debouncedSaveUserGameData({
          user_id: userId,
          user_type: userType,
          stocks_owned: stockState.ownedStocks,
          stock_profits: stockState.stockProfits,
        });
      }
    }
  }, [stockState, isLoaded, userId, userType]);

  // Price update interval
  useEffect(() => {
    if (!isLoaded) return;

    const updatePrice = () => {
      setStockState((prev) => {
        const newPrice = generateNextPrice(prev.currentPrice);
        const newHistory = [...prev.priceHistory, {
          timestamp: Date.now(),
          price: newPrice,
        }];
        
        // Trim history
        while (newHistory.length > MAX_PRICE_HISTORY) {
          newHistory.shift();
        }
        
        return {
          ...prev,
          priceHistory: newHistory,
          currentPrice: newPrice,
          lastPriceUpdate: Date.now(),
        };
      });
    };

    // Check if we need an immediate update
    const timeSinceLastUpdate = Date.now() - stockState.lastPriceUpdate;
    if (timeSinceLastUpdate >= PRICE_UPDATE_INTERVAL) {
      updatePrice();
    }

    // Set up interval for future updates
    intervalRef.current = setInterval(updatePrice, PRICE_UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoaded, stockState.lastPriceUpdate]);

  // Employee monthly stock bonus
  useEffect(() => {
    if (!isLoaded || !employee) return;

    const bonusKey = `${EMPLOYEE_BONUS_KEY}-${employee.id}`;
    const lastBonus = localStorage.getItem(bonusKey);
    const now = Date.now();

    // Check if a month has passed since last bonus
    if (!lastBonus || now - parseInt(lastBonus) >= MONTH_IN_MS) {
      // Give employee their monthly stocks
      setStockState((prev) => ({
        ...prev,
        ownedStocks: prev.ownedStocks + EMPLOYEE_MONTHLY_STOCKS,
      }));

      // Record the bonus time
      localStorage.setItem(bonusKey, now.toString());

      console.log(`💼 Employee bonus: +${EMPLOYEE_MONTHLY_STOCKS} stocks!`);
    }
  }, [isLoaded, employee]);

  // Check if user can access stock market
  const canBuyStocks = useCallback((currentRockId: number, ownedPickaxeIds: number[]) => {
    return currentRockId >= REQUIRED_ROCK_ID && ownedPickaxeIds.length >= REQUIRED_PICKAXE_COUNT;
  }, []);

  // Buy stocks using game money
  const buyStock = useCallback((quantity: number, gameSpendMoney: (amount: number) => boolean) => {
    const totalCost = stockState.currentPrice * quantity;
    
    // Try to spend the money from the game
    if (!gameSpendMoney(totalCost)) {
      return false;
    }

    setStockState((prev) => ({
      ...prev,
      ownedStocks: prev.ownedStocks + quantity,
    }));

    return true;
  }, [stockState.currentPrice]);

  // Sell stocks for profit
  const sellStock = useCallback((quantity: number) => {
    if (stockState.ownedStocks < quantity) {
      return false;
    }

    const saleValue = stockState.currentPrice * quantity;

    setStockState((prev) => ({
      ...prev,
      ownedStocks: prev.ownedStocks - quantity,
      stockProfits: prev.stockProfits + saleValue,
    }));

    return true;
  }, [stockState.ownedStocks, stockState.currentPrice]);

  // Spend stocks (for premium purchases - doesn't add to profits)
  const spendStocks = useCallback((quantity: number) => {
    if (stockState.ownedStocks < quantity) {
      return false;
    }

    setStockState((prev) => ({
      ...prev,
      ownedStocks: prev.ownedStocks - quantity,
    }));

    return true;
  }, [stockState.ownedStocks]);

  // Expose cheat functions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-expect-error - Adding to window for testing
      window.yatesGiveStocks = (amount: number) => {
        setStockState((prev) => ({
          ...prev,
          ownedStocks: prev.ownedStocks + amount,
        }));
        console.log(`📈 Added ${amount} stocks! Total: ${stockState.ownedStocks + amount}`);
      };

      // @ts-expect-error - Adding to window for testing
      window.yatesRemoveStocks = (amount: number) => {
        setStockState((prev) => ({
          ...prev,
          ownedStocks: Math.max(0, prev.ownedStocks - amount),
        }));
        console.log(`📉 Removed ${amount} stocks! Total: ${Math.max(0, stockState.ownedStocks - amount)}`);
      };

      // @ts-expect-error - Adding to window for testing
      window.yatesSetStocks = (amount: number) => {
        setStockState((prev) => ({
          ...prev,
          ownedStocks: Math.max(0, amount),
        }));
        console.log(`📈 Set stocks to ${amount}`);
      };
      
      // @ts-expect-error - Adding to window for testing
      window.yatesSetStockPrice = (price: number) => {
        const clampedPrice = Math.max(MIN_STOCK_PRICE, Math.min(MAX_STOCK_PRICE, price));
        setStockState((prev) => ({
          ...prev,
          currentPrice: clampedPrice,
          priceHistory: [...prev.priceHistory, { timestamp: Date.now(), price: clampedPrice }],
        }));
        console.log(`📈 Stock price set to $${clampedPrice.toLocaleString()}`);
      };
    }
  }, [stockState.ownedStocks]);

  if (!isLoaded) {
    return null;
  }

  return (
    <StockContext.Provider
      value={{
        stockState,
        currentPrice: stockState.currentPrice,
        priceHistory: stockState.priceHistory,
        ownedStocks: stockState.ownedStocks,
        stockProfits: stockState.stockProfits,
        buyStock,
        sellStock,
        spendStocks,
        canBuyStocks,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
}
