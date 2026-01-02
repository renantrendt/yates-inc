// Mining Game Types

export interface Pickaxe {
  id: number;
  name: string;
  image: string;
  price: number;
  clickPower: number;
  specialAbility?: string;
  moneyMultiplier?: number;
  couponLuckBonus?: number;
}

export interface Rock {
  id: number;
  name: string;
  image: string;
  clicksToBreak: number;
  moneyPerBreak: number;
  moneyPerClick: number;
  unlockAtClicks: number;
}

export interface ShopStockItem {
  productId: number;
  quantity: number;
}

export interface ShopStock {
  items: ShopStockItem[];
  lastRestockTime: number; // timestamp
}

export interface GameState {
  yatesDollars: number;
  totalClicks: number;
  currentPickaxeId: number;
  currentRockId: number;
  currentRockHP: number;
  rocksMinedCount: number;
  ownedPickaxeIds: number[];
  coupons: {
    discount30: number;
    discount50: number;
    discount100: number;
  };
  hasSeenCutscene: boolean;
  hasAutoclicker: boolean;
  autoclickerEnabled: boolean;
  shopStock?: ShopStock; // Optional for backwards compatibility
}

export const AUTOCLICKER_COST = 7000000; // $7M
export const AUTOCLICKER_CPS = 20; // 20 clicks per second

export interface CouponDrop {
  type: 'discount30' | 'discount50' | 'discount100';
  x: number;
  y: number;
  id: string;
}

export interface MoneyPopup {
  amount: number;
  x: number;
  y: number;
  id: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  id: string;
}

export const COUPON_REQUIREMENTS = {
  minRockId: 7, // Diamond (7th rock - coupons start dropping)
  minPickaxeId: 7, // Silver pickaxe
};

export const COUPON_DROP_RATES = {
  discount30: 0.005, // 0.5%
  discount50: 0.002, // 0.2%
  discount100: 0.0005, // 0.05%
};

export const SHOP_UNLOCK_REQUIREMENTS = {
  productsTab: {
    minRockId: 12, // Ruby (12th rock - products unlock)
    minPickaxeId: 12, // Alexandrite
  },
};

export const SHOP_RESTOCK_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
export const SHOP_MIN_ITEMS = 3; // Minimum items in stock
export const SHOP_MAX_ITEMS = 6; // Maximum items in stock
export const SHOP_MIN_QUANTITY = 1; // Min quantity per item
export const SHOP_MAX_QUANTITY = 3; // Max quantity per item

