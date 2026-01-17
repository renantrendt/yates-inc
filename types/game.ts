// Mining Game Types

// Active ability definition for pickaxes with usable abilities
export interface PickaxeActiveAbility {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  duration: number; // ms, 0 for instant effects
  cooldown: number; // ms
  cost: number; // Yates dollars cost to use
  effect: {
    type: 'miner_speed' | 'damage_boost' | 'instant_break' | 'all_boost';
    value: number; // multiplier (e.g., 0.5 = +50%, 2 = 200%)
  };
}

export interface Pickaxe {
  id: number;
  name: string;
  image: string;
  price: number;
  clickPower: number;
  specialAbility?: string;
  moneyMultiplier?: number;
  couponLuckBonus?: number;
  activeAbility?: PickaxeActiveAbility; // New: active ability with button
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

// =====================
// LIGHT VS DARKNESS PATH SYSTEM
// =====================

export type GamePath = 'light' | 'darkness' | null;

export interface SacrificeBuff {
  moneyBonus: number;
  pcxDamageBonus: number;
  minerDamageBonus: number;
  allBonus: number;
  endsAt: number; // timestamp when buff expires
}

// Miner sacrifice buff tiers (Darkness path only)
export const SACRIFICE_BUFF_TIERS: { miners: number; buff: Omit<SacrificeBuff, 'endsAt'>; duration: number }[] = [
  { miners: 1, buff: { moneyBonus: 0.01, pcxDamageBonus: 0, minerDamageBonus: 0, allBonus: 0 }, duration: 2000 },
  { miners: 10, buff: { moneyBonus: 0.10, pcxDamageBonus: 0, minerDamageBonus: 0, allBonus: 0 }, duration: 10000 },
  { miners: 50, buff: { moneyBonus: 0.25, pcxDamageBonus: 0, minerDamageBonus: 0, allBonus: 0 }, duration: 25000 },
  { miners: 75, buff: { moneyBonus: 0.45, pcxDamageBonus: 0, minerDamageBonus: 0, allBonus: 0 }, duration: 40000 },
  { miners: 100, buff: { moneyBonus: 0.50, pcxDamageBonus: 0, minerDamageBonus: 0, allBonus: 0 }, duration: 50000 },
  { miners: 125, buff: { moneyBonus: 0.45, pcxDamageBonus: 0.15, minerDamageBonus: 0, allBonus: 0 }, duration: 40000 },
  { miners: 150, buff: { moneyBonus: 0.54, pcxDamageBonus: 0.30, minerDamageBonus: 0, allBonus: 0 }, duration: 60000 },
  { miners: 200, buff: { moneyBonus: 0.45, pcxDamageBonus: 0.45, minerDamageBonus: 0.10, allBonus: 0 }, duration: 70000 },
  { miners: 250, buff: { moneyBonus: 0.45, pcxDamageBonus: 0.45, minerDamageBonus: 0.45, allBonus: 0 }, duration: 80000 },
  { miners: 300, buff: { moneyBonus: 0, pcxDamageBonus: 0, minerDamageBonus: 0, allBonus: 0.50 }, duration: 30000 },
];

// Golden Cookie reward probabilities (must sum to 1.0)
export const GOLDEN_COOKIE_REWARDS = {
  yatesPickaxe: 0.10,      // 10% - Yates Pickaxe
  yatesTotem: 0.01,        // 1%  - Yates Totem trinket
  goldenTrophy: 0.02,      // 2%  - Golden Trophy (Arghtfavts Trophye)
  silverTrophy: 0.05,      // 5%  - Silver Trophy (Nrahgrvaths Trphye)
  money12Percent: 0.15,    // 15% - +12% of current money
  randomTrinket: 0.43,     // 43% - Random trinket (or $1 if owned)
  money24Percent: 0.22,    // 22% - +24% of current money
  owoTitle: 0.01,          // 1%  - Secret "OwO" title (+500% everything!)
  adminCommands: 0.01,     // 1%  - 5min admin commands
};

// Golden Cookie spawn timing (ms)
export const GOLDEN_COOKIE_MIN_SPAWN = 90000; // 1.5 minutes
export const GOLDEN_COOKIE_MAX_SPAWN = 90000; // 1.5 minutes (fixed interval)

// Miner sacrifice ritual requirements
export const RITUAL_MONEY_REQUIREMENT = 1000000000000; // 1T$
export const RITUAL_MINER_SACRIFICE = 420; // Must sacrifice 420 miners

// Path-restricted pickaxes (can only buy/use if on that path)
export const DARKNESS_PICKAXE_IDS = [18, 21, 25]; // Demon, Nightmare, Galaxy
export const LIGHT_PICKAXE_IDS = [22, 23]; // Sun, Light Saber
export const YATES_PICKAXE_ID = 26; // Only from Golden Cookie

// Path-restricted rocks (can only mine if on that path)
export const DARKNESS_ROCK_IDS = [21, 24]; // Devil, Moon
export const LIGHT_ROCK_IDS = [20]; // Angel rock

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
  hasStocksUnlocked: boolean;      // Stock market unlocked (persists across prestige)
  // Miners
  minerCount: number;
  minerLastTick: number;           // timestamp of last miner tick
  // Prestige upgrades
  prestigeTokens: number;
  ownedPrestigeUpgradeIds: string[];
  // Auto-prestige (CM command)
  autoPrestigeEnabled: boolean;
  // Pickaxe active abilities
  activeAbility: {
    pickaxeId: number;
    abilityId: string;
    startTime: number;
    duration: number;
  } | null;
  abilityCooldowns: Record<string, number>; // ability id -> cooldown end timestamp
  // Achievements (permanently unlocked, persists across prestiges)
  unlockedAchievementIds: string[];
  // Ranking system tracking
  totalMoneyEarned: number;           // All-time money earned (never resets except for ranking period)
  gameStartTime: number;              // Timestamp when game started (for speed ranking)
  fastestPrestigeTime: number | null; // Fastest time to first prestige in ms
  // Pro Player Titles
  ownedTitleIds: string[];            // Titles earned from rankings
  equippedTitleIds: string[];         // Currently equipped titles (max 1, or 2 with Title Master)
  titleWinCounts: Record<string, number>; // How many times each title was won (for Da Goat)
  // =====================
  // LIGHT VS DARKNESS PATH SYSTEM
  // =====================
  chosenPath: GamePath;              // Player's chosen path after first prestige
  goldenCookieRitualActive: boolean; // Has completed the ritual to spawn golden cookies
  sacrificeBuff: SacrificeBuff | null; // Current active sacrifice buff
  adminCommandsUntil: number | null; // Timestamp when admin commands expire (from golden cookie)
  showPathSelection: boolean;        // Flag to show path selection modal
  // Timestamp for sync conflict resolution
  localUpdatedAt: number;
  // Playtime tracking for "Blessed by the Heavens" title
  totalPlaytimeSeconds: number;
}

// Prestige requirements (Rock 19 = Titanium Quartz, Pickaxe 16 = Pin)
export const PRESTIGE_REQUIREMENTS = {
  minRockId: 19,
  minPickaxeId: 16,
  maxRockId: 29,      // Lotus Crystal
  maxPickaxeId: 25,   // Galaxy
  baseMoneyRequired: 1000000000, // $1B base money requirement
};

// Max prestige level where buffs stop
export const MAX_PRESTIGE_WITH_BUFFS = 230;

// Get prestige money requirement (5% increase per prestige)
export function getPrestigeMoneyRequirement(prestigeCount: number): number {
  return Math.floor(PRESTIGE_REQUIREMENTS.baseMoneyRequired * Math.pow(1.05, prestigeCount));
}

// Get scaled prestige rock requirement (increases by 1 every 5 prestiges until max)
export function getPrestigeRockRequirement(prestigeCount: number): number {
  const increase = Math.floor(prestigeCount / 5);
  return Math.min(PRESTIGE_REQUIREMENTS.maxRockId, PRESTIGE_REQUIREMENTS.minRockId + increase);
}

// Get scaled prestige pickaxe requirement (increases by 1 every 5 prestiges until max)
export function getPrestigePickaxeRequirement(prestigeCount: number): number {
  const increase = Math.floor(prestigeCount / 5);
  return Math.min(PRESTIGE_REQUIREMENTS.maxPickaxeId, PRESTIGE_REQUIREMENTS.minPickaxeId + increase);
}

// Yates special account (hidden admin - keeps money on prestige)
export const YATES_ACCOUNT_ID = '000000';

export const AUTOCLICKER_COST = 100000000; // $100M
export const AUTOCLICKER_CPS = 10; // 10 clicks per second

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
  trinketBonus?: number;      // % boost to all trinket effects
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
  // Golden Cookie exclusive trophies
  {
    id: 'golden_trophy',
    name: 'Arghtfavts Trophye',
    image: '/game/accessories/trophy.png',
    rarity: 'secret',
    cost: 999999999999,
    shopChance: 0, // Golden cookie only
    effects: { 
      moneyBonus: 1.50,
      clickSpeedBonus: 2.30,
      rockDamageBonus: 0.45,
      minerDamageBonus: 0.45,
      minerSpeedBonus: 1.00
    },
    description: '+150% money, +230% click speed, +45% pcx/miner dmg, +100% miner speed',
  },
  {
    id: 'silver_trophy',
    name: 'Nrahgrvaths Trphye',
    image: '/game/accessories/silver.png',
    rarity: 'mythic',
    cost: 999999999999,
    shopChance: 0, // Golden cookie only
    effects: { 
      moneyBonus: 0.75,
      clickSpeedBonus: 1.15,
      rockDamageBonus: 0.225,
      minerDamageBonus: 0.225,
      minerSpeedBonus: 0.50
    },
    description: '+75% money, +115% click speed, +22.5% pcx/miner dmg, +50% miner speed',
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

export const MINER_BASE_COST = 1000; // $1k for first miner
export const MINER_COST_MULTIPLIER = 1.0395; // Scales to ~$10B for miner 420
export const MINER_MAX_COUNT = 420;
export const MINER_TICK_INTERVAL = 1000; // 1 second between miner ticks
export const MINER_BASE_DAMAGE = 1190; // ~500k total damage at 420 miners (500k/420 ≈ 1190)
export const MINER_VISIBLE_MAX = 100; // Max visible sprites

// Rock health scaling per prestige (23% increase per prestige)
export const ROCK_HEALTH_PRESTIGE_SCALING = 0.23;

// Get scaled rock HP based on prestige count
export function getScaledRockHP(baseHP: number, prestigeCount: number): number {
  return Math.ceil(baseHP * (1 + prestigeCount * ROCK_HEALTH_PRESTIGE_SCALING));
}

// Get prestige price multiplier (10% increase every 5 prestiges)
export function getPrestigePriceMultiplier(prestigeCount: number): number {
  return Math.pow(1.10, Math.floor(prestigeCount / 5));
}

// Get miner cost with prestige scaling (10% increase every 5 prestiges)
export function getMinerCost(currentMinerCount: number, prestigeCount: number = 0): number {
  const baseCost = Math.floor(MINER_BASE_COST * Math.pow(MINER_COST_MULTIPLIER, currentMinerCount));
  return Math.floor(baseCost * getPrestigePriceMultiplier(prestigeCount));
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
  requires?: string;     // optional: ID of upgrade that must be owned first
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
  {
    id: 'triple_trinkets',
    name: 'Triple Trinkets',
    cost: 43,
    effects: {},
    description: 'Equip 3 trinkets at once (requires Dual Trinkets)',
    maxPurchases: 1,
    requires: 'dual_trinkets',
  },
  // === NEW PRESTIGE UPGRADES ===
  {
    id: 'miner_sprint',
    name: 'Miner Sprint',
    cost: 8,
    effects: { minerSpeedBonus: 0.50 },
    description: '+50% miner speed',
    maxPurchases: 1,
  },
  {
    id: 'money_printer',
    name: 'Money Printer',
    cost: 10,
    effects: { moneyBonus: 0.50 },
    description: '+50% money',
    maxPurchases: 1,
  },
  {
    id: 'rapid_clicker',
    name: 'Rapid Clicker',
    cost: 13,
    effects: { clickSpeedBonus: 0.52 },
    description: '+52% click speed',
    maxPurchases: 1,
  },
  {
    id: 'heavy_hitter',
    name: 'Heavy Hitter',
    cost: 13,
    effects: { rockDamageBonus: 0.54 },
    description: '+54% pickaxe damage',
    maxPurchases: 1,
  },
  {
    id: 'relic_hunter',
    name: 'Relic Hunter',
    cost: 16,
    effects: { couponBonus: 0.30 },
    description: '+30% relic luck',
    maxPurchases: 1,
  },
  {
    id: 'mega_boost',
    name: 'Mega Boost',
    cost: 25,
    effects: { moneyBonus: 1.0, rockDamageBonus: 0.50, trinketBonus: 0.31 },
    description: '+100% money, +50% pcx dmg, +31% trinket effects',
    maxPurchases: 1,
  },
  // === 10 NEW PRESTIGE UPGRADES ===
  {
    id: 'miner_damage_1',
    name: 'Miner Muscles I',
    cost: 7,
    effects: { minerDamageBonus: 0.35 },
    description: '+35% miner damage',
    maxPurchases: 1,
  },
  {
    id: 'miner_damage_2',
    name: 'Miner Muscles II',
    cost: 12,
    effects: { minerDamageBonus: 0.50 },
    description: '+50% miner damage',
    maxPurchases: 1,
  },
  {
    id: 'coupon_master',
    name: 'Coupon Master',
    cost: 15,
    effects: { couponBonus: 0.75, couponLuckBonus: 0.25 },
    description: '+75% coupon drop rate, +25% luck',
    maxPurchases: 1,
  },
  {
    id: 'supreme_clicker',
    name: 'Supreme Clicker',
    cost: 18,
    effects: { clickSpeedBonus: 0.75 },
    description: '+75% click speed',
    maxPurchases: 1,
  },
  {
    id: 'rock_crusher',
    name: 'Rock Crusher',
    cost: 20,
    effects: { rockDamageBonus: 0.80 },
    description: '+80% pickaxe damage',
    maxPurchases: 1,
  },
  {
    id: 'miner_overdrive',
    name: 'Miner Overdrive',
    cost: 22,
    effects: { minerSpeedBonus: 0.80, minerDamageBonus: 0.30 },
    description: '+80% miner speed, +30% miner dmg',
    maxPurchases: 1,
  },
  {
    id: 'gold_rush',
    name: 'Gold Rush',
    cost: 28,
    effects: { moneyBonus: 1.20, minerMoneyBonus: 0.50 },
    description: '+120% money, +50% miner money',
    maxPurchases: 1,
  },
  {
    id: 'ultimate_miner',
    name: 'Ultimate Miner',
    cost: 35,
    effects: { minerDamageBonus: 1.0, minerSpeedBonus: 0.60, minerMoneyBonus: 0.40 },
    description: '+100% miner dmg, +60% speed, +40% money',
    maxPurchases: 1,
  },
  {
    id: 'trinket_amplifier',
    name: 'Trinket Amplifier',
    cost: 40,
    effects: { trinketBonus: 0.75 },
    description: '+75% trinket effects',
    maxPurchases: 1,
  },
  {
    id: 'yates_blessing',
    name: "Yates' Blessing",
    cost: 50,
    effects: { allBonus: 0.50 },
    description: '+50% to ALL stats',
    maxPurchases: 1,
  },
  // Title Master - equip 2 titles at once
  {
    id: 'title_master',
    name: 'Title Master',
    cost: 30,
    effects: {},
    description: 'Equip 2 Pro Player titles at once',
    maxPurchases: 1,
  },
];

export const PRESTIGE_TOKENS_PER_PRESTIGE = 2;

// =====================
// PRO PLAYER TITLES SYSTEM
// =====================

export type TitleNameStyle = 'normal' | 'gold' | 'silver' | 'diamond';

export interface TitleBuffs {
  moneyBonus?: number;           // % extra money
  allBonus?: number;             // % to everything
  speedBonus?: number;           // % faster (clicks, miners, etc.)
  pcxDiscount?: number;          // % discount on pickaxes
  prestigeMoneyRetention?: number; // % of money kept on prestige
}

export interface Title {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'money' | 'speed' | 'prestige' | 'secret';
  placement: 1 | 2 | 'secret';   // 1st place, 2nd place, or secret
  buffs: TitleBuffs;
  nameStyle: TitleNameStyle;
}

export const TITLES: Title[] = [
  // Money category
  {
    id: 'money_greedy',
    name: 'Money Greedy',
    description: '1st place in Money ranking',
    icon: '💰',
    category: 'money',
    placement: 1,
    buffs: { moneyBonus: 0.60 },
    nameStyle: 'gold',
  },
  {
    id: 'almost_there',
    name: 'Almost There',
    description: '2nd place in Money ranking',
    icon: '💵',
    category: 'money',
    placement: 2,
    buffs: { moneyBonus: 0.20 },
    nameStyle: 'normal',
  },
  // Speed category
  {
    id: 'speedrunner',
    name: 'Speedrunner',
    description: '1st place in Speed ranking',
    icon: '⚡',
    category: 'speed',
    placement: 1,
    buffs: { speedBonus: 0.30, pcxDiscount: 0.40 },
    nameStyle: 'diamond',
  },
  {
    id: 'just_2_seconds',
    name: 'Just 2 more seconds',
    description: '2nd place in Speed ranking',
    icon: '⏱️',
    category: 'speed',
    placement: 2,
    buffs: { speedBonus: 0.10 },
    nameStyle: 'normal',
  },
  // Prestige category
  {
    id: 'game_grinder',
    name: 'Game Grinder',
    description: '1st place in Prestige ranking',
    icon: '🎮',
    category: 'prestige',
    placement: 1,
    buffs: { allBonus: 0.40, prestigeMoneyRetention: 0.20 },
    nameStyle: 'gold',
  },
  {
    id: 'how_many_hours',
    name: 'How many hours??',
    description: '2nd place in Prestige ranking',
    icon: '⏰',
    category: 'prestige',
    placement: 2,
    buffs: { allBonus: 0.20 },
    nameStyle: 'silver',
  },
  // Secret title - get any title 3+ times
  {
    id: 'da_goat',
    name: 'Da Goat',
    description: 'Win any title 3+ times',
    icon: '🐐',
    category: 'secret',
    placement: 'secret',
    buffs: { allBonus: 0.56 },
    nameStyle: 'diamond',
  },
  // Secret title from Golden Cookie (1% chance)
  {
    id: 'owo_secret',
    name: 'OwO',
    description: 'You are one of the few who have this title!',
    icon: '👀',
    category: 'secret',
    placement: 'secret',
    buffs: { allBonus: 5.0 }, // +500% to everything!
    nameStyle: 'diamond',
  },
  // Light path exclusive title
  {
    id: 'blessed_by_heavens',
    name: 'Blessed by the Heavens',
    description: 'Light path master: own all pickaxes, unlock all rocks, 5+ hours played',
    icon: '☀️',
    category: 'secret',
    placement: 'secret',
    buffs: { moneyBonus: 0.60 }, // +60% money
    nameStyle: 'gold',
  },
];

export const TITLE_NAME_STYLES: Record<TitleNameStyle, string> = {
  normal: 'text-white',
  gold: 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]',
  silver: 'text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.4)]',
  diamond: 'bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse drop-shadow-[0_0_12px_rgba(96,165,250,0.6)]',
};

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
  {
    id: 'money_1b',
    name: 'Billionaire',
    description: 'Earn $1,000,000,000',
    icon: '💎',
    category: 'money',
  },
  {
    id: 'money_1t',
    name: 'Trillionaire',
    description: 'Earn $1,000,000,000,000',
    icon: '👑',
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
  {
    id: 'prestige_15',
    name: 'Prestige Expert',
    description: 'Prestige 15 times',
    icon: '🔥',
    category: 'prestige',
  },
  {
    id: 'prestige_20',
    name: 'Prestige Champion',
    description: 'Prestige 20 times',
    icon: '💪',
    category: 'prestige',
  },
  {
    id: 'prestige_27',
    name: 'Prestige Overlord',
    description: 'Prestige 27 times',
    icon: '⚡',
    category: 'prestige',
  },
  {
    id: 'prestige_30',
    name: 'Prestige Legend',
    description: 'Prestige 30 times',
    icon: '🏆',
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
    id: 'miner_420',
    name: 'Full Capacity',
    description: 'Hire all 420 miners',
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
  {
    id: 'trinket_all',
    name: 'Trinket Hoarder',
    description: 'Own all trinkets',
    icon: '✨',
    category: 'trinket',
  },
];

// Achievement checking functions - returns true if permanently unlocked OR currently meets criteria
export function checkAchievementUnlocked(achievement: Achievement, state: GameState): boolean {
  // If already permanently unlocked, return true
  if (state.unlockedAchievementIds?.includes(achievement.id)) {
    return true;
  }
  
  // Otherwise check current state
  switch (achievement.id) {
    case 'all_pickaxes': return state.ownedPickaxeIds.length >= 25; // 25 total pickaxes
    case 'max_rock': return state.currentRockId >= 29; // 29 total rocks
    case 'money_1m': return state.yatesDollars >= 1000000;
    case 'money_100m': return state.yatesDollars >= 100000000;
    case 'money_1b': return state.yatesDollars >= 1000000000;
    case 'money_1t': return state.yatesDollars >= 1000000000000;
    case 'prestige_1': return state.prestigeCount >= 1;
    case 'prestige_3': return state.prestigeCount >= 3;
    case 'prestige_5': return state.prestigeCount >= 5;
    case 'prestige_7': return state.prestigeCount >= 7;
    case 'prestige_10': return state.prestigeCount >= 10;
    case 'prestige_15': return state.prestigeCount >= 15;
    case 'prestige_20': return state.prestigeCount >= 20;
    case 'prestige_27': return state.prestigeCount >= 27;
    case 'prestige_30': return state.prestigeCount >= 30;
    case 'miner_1': return state.minerCount >= 1;
    case 'miner_10': return state.minerCount >= 10;
    case 'miner_100': return state.minerCount >= 100;
    case 'miner_420': return state.minerCount >= 420;
    case 'trinket_1': return state.ownedTrinketIds.length >= 1;
    case 'trinket_5': return state.ownedTrinketIds.length >= 5;
    case 'trinket_yates': return state.ownedTrinketIds.includes('yates_totem');
    case 'trinket_all': return state.ownedTrinketIds.length >= TRINKETS.length;
    default: return false;
  }
}

// Check if achievement should be unlocked based on current state only
export function shouldUnlockAchievement(achievement: Achievement, state: GameState): boolean {
  switch (achievement.id) {
    case 'all_pickaxes': return state.ownedPickaxeIds.length >= 25;
    case 'max_rock': return state.currentRockId >= 29;
    case 'money_1m': return state.yatesDollars >= 1000000;
    case 'money_100m': return state.yatesDollars >= 100000000;
    case 'money_1b': return state.yatesDollars >= 1000000000;
    case 'money_1t': return state.yatesDollars >= 1000000000000;
    case 'prestige_1': return state.prestigeCount >= 1;
    case 'prestige_3': return state.prestigeCount >= 3;
    case 'prestige_5': return state.prestigeCount >= 5;
    case 'prestige_7': return state.prestigeCount >= 7;
    case 'prestige_10': return state.prestigeCount >= 10;
    case 'prestige_15': return state.prestigeCount >= 15;
    case 'prestige_20': return state.prestigeCount >= 20;
    case 'prestige_27': return state.prestigeCount >= 27;
    case 'prestige_30': return state.prestigeCount >= 30;
    case 'miner_1': return state.minerCount >= 1;
    case 'miner_10': return state.minerCount >= 10;
    case 'miner_100': return state.minerCount >= 100;
    case 'miner_420': return state.minerCount >= 420;
    case 'trinket_1': return state.ownedTrinketIds.length >= 1;
    case 'trinket_5': return state.ownedTrinketIds.length >= 5;
    case 'trinket_yates': return state.ownedTrinketIds.includes('yates_totem');
    case 'trinket_all': return state.ownedTrinketIds.length >= TRINKETS.length;
    default: return false;
  }
}