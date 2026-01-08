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
  prestigeCount: number;
  prestigeMultiplier: number;
  shopStock?: ShopStock; // Optional for backwards compatibility
  // Anti-cheat system
  antiCheatWarnings: number;       // 0-3
  isOnWatchlist: boolean;          // stricter detection after appeal approved
  isBlocked: boolean;              // currently blocked from earning
  appealPending: boolean;          // waiting for admin decision
  // Trinkets
  ownedTrinketIds: string[];
  equippedTrinketIds: string[];    // Can equip 1 (or 2 with prestige upgrade)
  trinketShopItems: string[];      // IDs of trinkets currently in shop
  trinketShopLastRefresh: number;  // timestamp
  hasTotemProtection: boolean;     // Totem active for next prestige
  // Miners
  minerCount: number;
  minerLastTick: number;           // timestamp of last miner tick
  // Prestige upgrades
  prestigeTokens: number;
  ownedPrestigeUpgradeIds: string[];
  // Auto-prestige (CM command)
  autoPrestigeEnabled: boolean;
}

// Prestige requirements
export const PRESTIGE_REQUIREMENTS = {
  minRockId: 17,
  minPickaxeId: 13,
};

// Yates special account (hidden admin - keeps money on prestige)
export const YATES_ACCOUNT_ID = '000000';

export const AUTOCLICKER_COST = 7000000; // $7M
export const AUTOCLICKER_CPS = 13; // 13 clicks per second

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

// =====================
// TRINKET SYSTEM
// =====================

export type TrinketRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'secret';

export interface TrinketEffects {
  moneyBonus?: number;        // % extra money
  rockDamageBonus?: number;   // % extra rock damage
  clickSpeedBonus?: number;   // % faster clicks (autoclicker)
  couponBonus?: number;       // % extra coupon drop rate
  minerSpeedBonus?: number;   // % faster miner ticks
  minerDamageBonus?: number;  // % extra miner damage
  minerMoneyBonus?: number;   // % extra money from miners
  couponLuckBonus?: number;   // % extra coupon luck
  allBonus?: number;          // % bonus to everything
  prestigeProtection?: boolean; // Keep money on prestige (consumable)
}

export interface Trinket {
  id: string;
  name: string;
  image: string;
  rarity: TrinketRarity;
  cost: number;
  shopChance: number;         // 0-1, chance to appear in shop
  effects: TrinketEffects;
  description: string;
}

export const TRINKET_SHOP_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes
export const TRINKET_SHOP_MIN_ITEMS = 1;
export const TRINKET_SHOP_MAX_ITEMS = 2;

export const TRINKETS: Trinket[] = [
  {
    id: 'avatar_ring',
    name: 'Avatar Ring',
    image: '/game/accessories/avatarring.png',
    rarity: 'common',
    cost: 780000,
    shopChance: 0.80,
    effects: { rockDamageBonus: 0.10 },
    description: '+10% rock damage',
  },
  {
    id: 'rainbow_collar',
    name: 'Rainbow Collar',
    image: '/game/accessories/RainbowColar.png',
    rarity: 'rare',
    cost: 2000000,
    shopChance: 0.80,
    effects: { moneyBonus: 0.15 },
    description: '+15% money',
  },
  {
    id: 'cosmic_crown',
    name: 'Cosmic Crown',
    image: '/game/accessories/CosmicCrown.png',
    rarity: 'epic',
    cost: 3500000,
    shopChance: 0.70,
    effects: { moneyBonus: 0.12, clickSpeedBonus: 0.05, rockDamageBonus: 0.09 },
    description: '+12% money, +5% click speed, +9% rock damage',
  },
  {
    id: 'totem',
    name: 'Totem',
    image: '/misc/totem.png',
    rarity: 'legendary',
    cost: 20000000,
    shopChance: 0.31,
    effects: { prestigeProtection: true },
    description: 'Keep your money on 1 prestige (consumable)',
  },
  {
    id: 'yates_totem',
    name: 'Yates Totem',
    image: '/misc/Yates totem.png',
    rarity: 'secret',
    cost: 777000000,
    shopChance: 0.000001, // 0.0001%
    effects: {
      moneyBonus: 0.67,
      rockDamageBonus: 0.60,
      minerSpeedBonus: 0.30,
      minerMoneyBonus: 0.45,
      couponLuckBonus: 0.30
    },
    description: '+67% money, +60% rock dmg, +30% miner speed, +45% miner money, +30% coupon luck',
  },
  {
    id: 'spike',
    name: 'Spike',
    image: '/misc/spike.png',
    rarity: 'epic',
    cost: 900000,
    shopChance: 0.62,
    effects: { couponBonus: 0.80 },
    description: '+80% coupon drop rate',
  },
  {
    id: 'elder_ring',
    name: 'Elder Ring',
    image: '/game/accessories/elderring.png',
    rarity: 'mythic',
    cost: 56000000,
    shopChance: 0.21,
    effects: { rockDamageBonus: 0.70, moneyBonus: 0.30 },
    description: '+70% pickaxe damage, +30% money',
  },
  {
    id: 'dream_collar',
    name: 'Dream Collar',
    image: '/game/accessories/Dreamcolar.png',
    rarity: 'legendary',
    cost: 35000000,
    shopChance: 0.31,
    effects: { moneyBonus: 0.50 },
    description: '+50% money',
  },
  {
    id: 'earth_ball',
    name: 'Earth Ball',
    image: '/game/accessories/earthball.png',
    rarity: 'epic',
    cost: 10000000,
    shopChance: 0.50,
    effects: { minerDamageBonus: 0.30, minerSpeedBonus: 0.30 },
    description: '+30% miner damage, +30% miner speed',
  },
  {
    id: 'solar_collar',
    name: 'Solar Collar',
    image: '/game/accessories/suncolar.png',
    rarity: 'epic',
    cost: 15000000,
    shopChance: 0.40,
    effects: { allBonus: 0.10 },
    description: '+10% to everything',
  },
];

export const RARITY_COLORS: Record<TrinketRarity, string> = {
  common: '#9ca3af',    // gray
  rare: '#3b82f6',      // blue
  epic: '#a855f7',      // purple
  legendary: '#f59e0b', // orange/gold
  mythic: '#ec4899',    // pink
  secret: '#ef4444',    // red
};

// =====================
// MINER SYSTEM
// =====================

export const MINER_BASE_COST = 250; // $250 for first miner
export const MINER_COST_MULTIPLIER = 1.08; // Each miner costs 8% more (gentler scaling)
export const MINER_MAX_COUNT = 360;
export const MINER_TICK_INTERVAL = 1000; // 1 second between miner ticks
export const MINER_BASE_DAMAGE = 15; // Base damage per miner per tick (beefy bois)
export const MINER_VISIBLE_MAX = 10; // Max visible sprites

export function getMinerCost(currentMinerCount: number): number {
  return Math.floor(MINER_BASE_COST * Math.pow(MINER_COST_MULTIPLIER, currentMinerCount));
}

// =====================
// PRESTIGE UPGRADES
// =====================

export interface PrestigeUpgrade {
  id: string;
  name: string;
  cost: number;          // prestige tokens
  effects: TrinketEffects;
  description: string;
  maxPurchases: number;  // 1 for most, can be higher for stackable
}

export const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  {
    id: 'coupon_boost',
    name: 'Coupon Collector',
    cost: 2,
    effects: { couponBonus: 0.50 },
    description: '+50% coupon drop rate',
    maxPurchases: 1,
  },
  {
    id: 'miner_speed_1',
    name: 'Faster Miners I',
    cost: 3,
    effects: { minerSpeedBonus: 0.30 },
    description: '+30% miner speed',
    maxPurchases: 1,
  },
  {
    id: 'pcx_damage',
    name: 'Pickaxe Mastery',
    cost: 5,
    effects: { rockDamageBonus: 0.40 },
    description: '+40% pickaxe damage',
    maxPurchases: 1,
  },
  {
    id: 'miner_speed_2',
    name: 'Faster Miners II',
    cost: 6,
    effects: { minerSpeedBonus: 0.40 },
    description: '+40% miner speed',
    maxPurchases: 1,
  },
  {
    id: 'money_boost',
    name: 'Money Multiplier',
    cost: 8,
    effects: { moneyBonus: 0.30 },
    description: '+30% extra money',
    maxPurchases: 1,
  },
  {
    id: 'dual_trinkets',
    name: 'Dual Trinkets',
    cost: 10,
    effects: {},
    description: 'Equip 2 trinkets at once',
    maxPurchases: 1,
  },
];

export const PRESTIGE_TOKENS_PER_PRESTIGE = 2;
// =====================
// ACHIEVEMENTS SYSTEM
// =====================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'pickaxe' | 'rock' | 'money' | 'prestige' | 'miner' | 'trinket';
}

export const ACHIEVEMENTS: Achievement[] = [
  // Pickaxe achievements
  {
    id: 'all_pickaxes',
    name: 'Tool Collector',
    description: 'Own all pickaxes',
    icon: '⛏️',
    category: 'pickaxe',
  },
  // Rock achievements
  {
    id: 'max_rock',
    name: 'Rock Bottom',
    description: 'Unlock the highest tier rock',
    icon: '🪨',
    category: 'rock',
  },
  // Money achievements
  {
    id: 'money_1m',
    name: 'Millionaire',
    description: 'Earn $1,000,000',
    icon: '💵',
    category: 'money',
  },
  {
    id: 'money_100m',
    name: 'Hundred Millionaire',
    description: 'Earn $100,000,000',
    icon: '💰',
    category: 'money',
  },
  // Prestige achievements
  {
    id: 'prestige_1',
    name: 'Fresh Start',
    description: 'Prestige for the first time',
    icon: '✨',
    category: 'prestige',
  },
  {
    id: 'prestige_3',
    name: 'Rising Star',
    description: 'Prestige 3 times',
    icon: '⭐',
    category: 'prestige',
  },
  {
    id: 'prestige_5',
    name: 'Veteran Miner',
    description: 'Prestige 5 times',
    icon: '🌟',
    category: 'prestige',
  },
  {
    id: 'prestige_7',
    name: 'Elite Miner',
    description: 'Prestige 7 times',
    icon: '💫',
    category: 'prestige',
  },
  {
    id: 'prestige_10',
    name: 'Prestige Master',
    description: 'Prestige 10 times',
    icon: '👑',
    category: 'prestige',
  },
  // Miner achievements
  {
    id: 'miner_1',
    name: 'First Hire',
    description: 'Hire your first miner',
    icon: '👷',
    category: 'miner',
  },
  {
    id: 'miner_10',
    name: 'Small Crew',
    description: 'Hire 10 miners',
    icon: '👷‍♂️',
    category: 'miner',
  },
  {
    id: 'miner_100',
    name: 'Mining Company',
    description: 'Hire 100 miners',
    icon: '🏭',
    category: 'miner',
  },
  {
    id: 'miner_360',
    name: 'Full Capacity',
    description: 'Hire all 360 miners',
    icon: '🏆',
    category: 'miner',
  },
  // Trinket achievements
  {
    id: 'trinket_1',
    name: 'Shiny Object',
    description: 'Buy your first trinket',
    icon: '💍',
    category: 'trinket',
  },
  {
    id: 'trinket_5',
    name: 'Collector',
    description: 'Own 5 trinkets',
    icon: '📿',
    category: 'trinket',
  },
  {
    id: 'trinket_yates',
    name: 'Blessed by Yates',
    description: 'Own the Yates Totem',
    icon: '🗿',
    category: 'trinket',
  },
];

// Achievement checking functions
export function checkAchievementUnlocked(achievement: Achievement, state: GameState): boolean {
  switch (achievement.id) {
    case 'all_pickaxes': return state.ownedPickaxeIds.length >= 15;
    case 'max_rock': return state.currentRockId >= 10;
    case 'money_1m': return state.yatesDollars >= 1000000;
    case 'money_100m': return state.yatesDollars >= 100000000;
    case 'prestige_1': return state.prestigeCount >= 1;
    case 'prestige_3': return state.prestigeCount >= 3;
    case 'prestige_5': return state.prestigeCount >= 5;
    case 'prestige_7': return state.prestigeCount >= 7;
    case 'prestige_10': return state.prestigeCount >= 10;
    case 'miner_1': return state.minerCount >= 1;
    case 'miner_10': return state.minerCount >= 10;
    case 'miner_100': return state.minerCount >= 100;
    case 'miner_360': return state.minerCount >= 360;
    case 'trinket_1': return state.ownedTrinketIds.length >= 1;
    case 'trinket_5': return state.ownedTrinketIds.length >= 5;
    case 'trinket_yates': return state.ownedTrinketIds.includes('yates_totem');
    default: return false;
  }
}