import { Pickaxe, Rock } from '@/types/game';

export const PICKAXES: Pickaxe[] = [
  {
    id: 1,
    name: 'Wood',
    image: '/game/pickaxes/woodp.png',
    price: 0,
    clickPower: 1,
  },
  {
    id: 2,
    name: 'Stone',
    image: '/game/pickaxes/stonep.png',
    price: 120,
    clickPower: 3,
  },
  {
    id: 3,
    name: 'Bronze',
    image: '/game/pickaxes/bronzep.png',
    price: 400,
    clickPower: 6,
  },
  {
    id: 4,
    name: 'Copper',
    image: '/game/pickaxes/copperp.png',
    price: 1200,
    clickPower: 12,
  },
  {
    id: 5,
    name: 'Iron',
    image: '/game/pickaxes/ironp.png',
    price: 3500,
    clickPower: 22,
  },
  {
    id: 6,
    name: 'Steel',
    image: '/game/pickaxes/steelp.png',
    price: 9000,
    clickPower: 40,
  },
  {
    id: 7,
    name: 'Silver',
    image: '/game/pickaxes/silverp.png',
    price: 22000,
    clickPower: 70,
  },
  {
    id: 8,
    name: 'Gold',
    image: '/game/pickaxes/goldp.png',
    price: 55000,
    clickPower: 120,
    specialAbility: 'Click 2x faster, but weaker',
  },
  {
    id: 9,
    name: 'Platinum',
    image: '/game/pickaxes/platinump.png',
    price: 140000,
    clickPower: 200,
  },
  {
    id: 10,
    name: 'Diamond',
    image: '/game/pickaxes/diamondp.png',
    price: 350000,
    clickPower: 350,
  },
  {
    id: 11,
    name: 'Obsidian',
    image: '/game/pickaxes/obsidianp.png',
    price: 850000,
    clickPower: 600,
  },
  {
    id: 12,
    name: 'Alexandrite',
    image: '/game/pickaxes/alexandritep.png',
    price: 2200000,
    clickPower: 1000,
    moneyMultiplier: 1.3,
    specialAbility: 'Gives 30% more money',
  },
  {
    id: 13,
    name: 'Opal',
    image: '/game/pickaxes/opalp.png',
    price: 6000000,
    clickPower: 1800,
    couponLuckBonus: 0.15,
    specialAbility: '15% more coupon luck',
  },
  {
    id: 14,
    name: 'Doge',
    image: '/game/pickaxes/dogep.png',
    price: 18000000,
    clickPower: 3500,
    moneyMultiplier: 2,
    specialAbility: '2x money',
  },
  {
    id: 15,
    name: 'Plasma',
    image: '/game/pickaxes/plasmap.png',
    price: 60000000,
    clickPower: 999999,
    specialAbility: 'Instant melt',
  },
];

export const ROCKS: Rock[] = [
  {
    id: 1,
    name: 'Coal',
    image: '/game/rocks/coal.webp',
    clicksToBreak: 8,
    moneyPerBreak: 10,
    moneyPerClick: 5,
    unlockAtClicks: 0,
  },
  {
    id: 2,
    name: 'Stone',
    image: '/game/rocks/stone.png',
    clicksToBreak: 20,
    moneyPerBreak: 25,
    moneyPerClick: 10,
    unlockAtClicks: 80,
  },
  {
    id: 3,
    name: 'Copper',
    image: '/game/rocks/copper.png',
    clicksToBreak: 40,
    moneyPerBreak: 50,
    moneyPerClick: 18,
    unlockAtClicks: 250,
  },
  {
    id: 4,
    name: 'Silver',
    image: '/game/rocks/silver.png',
    clicksToBreak: 80,
    moneyPerBreak: 100,
    moneyPerClick: 30,
    unlockAtClicks: 500,
  },
  {
    id: 5,
    name: 'Iron',
    image: '/game/rocks/iron.png',
    clicksToBreak: 150,
    moneyPerBreak: 200,
    moneyPerClick: 50,
    unlockAtClicks: 1000,
  },
  {
    id: 6,
    name: 'Gold',
    image: '/game/rocks/gold.png',
    clicksToBreak: 250,
    moneyPerBreak: 400,
    moneyPerClick: 90,
    unlockAtClicks: 2000,
  },
  {
    id: 7,
    name: 'Diamond',
    image: '/game/rocks/diamond.png',
    clicksToBreak: 400,
    moneyPerBreak: 800,
    moneyPerClick: 160,
    unlockAtClicks: 4000,
  },
  // --- 7 ROCK MARK (Coupons start dropping) ---
  {
    id: 8,
    name: 'Platinum',
    image: '/game/rocks/platinum.png',
    clicksToBreak: 600,
    moneyPerBreak: 1500,
    moneyPerClick: 280,
    unlockAtClicks: 7500,
  },
  {
    id: 9,
    name: 'Uranium',
    image: '/game/rocks/uranium.png',
    clicksToBreak: 900,
    moneyPerBreak: 2500,
    moneyPerClick: 450,
    unlockAtClicks: 12000,
  },
  {
    id: 10,
    name: 'Titanium',
    image: '/game/rocks/titanium.png',
    clicksToBreak: 1400,
    moneyPerBreak: 4500,
    moneyPerClick: 700,
    unlockAtClicks: 20000,
  },
  {
    id: 11,
    name: 'Obsidian',
    image: '/game/rocks/obsidian.png',
    clicksToBreak: 2000,
    moneyPerBreak: 7500,
    moneyPerClick: 1100,
    unlockAtClicks: 35000,
  },
  {
    id: 12,
    name: 'Ruby',
    image: '/game/rocks/ruby.png',
    clicksToBreak: 3000,
    moneyPerBreak: 12000,
    moneyPerClick: 1700,
    unlockAtClicks: 55000,
  },
  // --- 12 ROCK MARK (Products unlock in shop) ---
  {
    id: 13,
    name: 'Sapphire',
    image: '/game/rocks/sapphire.png',
    clicksToBreak: 4500,
    moneyPerBreak: 18000,
    moneyPerClick: 2600,
    unlockAtClicks: 85000,
  },
  {
    id: 14,
    name: 'Emerald',
    image: '/game/rocks/emerald.png',
    clicksToBreak: 6500,
    moneyPerBreak: 28000,
    moneyPerClick: 4000,
    unlockAtClicks: 130000,
  },
  {
    id: 15,
    name: 'Amethyst',
    image: '/game/rocks/amethyst.png',
    clicksToBreak: 9000,
    moneyPerBreak: 45000,
    moneyPerClick: 6000,
    unlockAtClicks: 200000,
  },
  // --- ENDGAME ROCKS (16-19) ---
  {
    id: 16,
    name: 'Bismuth',
    image: '/game/rocks/bismuth.png',
    clicksToBreak: 13000,
    moneyPerBreak: 75000,
    moneyPerClick: 9000,
    unlockAtClicks: 300000,
  },
  {
    id: 17,
    name: 'Bornite',
    image: '/game/rocks/bornite.png',
    clicksToBreak: 18000,
    moneyPerBreak: 120000,
    moneyPerClick: 14000,
    unlockAtClicks: 450000,
  },
  {
    id: 18,
    name: 'Azurite',
    image: '/game/rocks/azurite.png',
    clicksToBreak: 25000,
    moneyPerBreak: 200000,
    moneyPerClick: 22000,
    unlockAtClicks: 700000,
  },
  {
    id: 19,
    name: 'Titanium Quartz',
    image: '/game/rocks/titaniumquartz.png',
    clicksToBreak: 35000,
    moneyPerBreak: 350000,
    moneyPerClick: 35000,
    unlockAtClicks: 1000000,
  },
];

export const getPickaxeById = (id: number): Pickaxe | undefined => {
  return PICKAXES.find((p) => p.id === id);
};

export const getRockById = (id: number): Rock | undefined => {
  return ROCKS.find((r) => r.id === id);
};

export const getNextRock = (currentRockId: number, totalClicks: number): Rock | null => {
  const nextRock = ROCKS.find((r) => r.id === currentRockId + 1);
  if (nextRock && totalClicks >= nextRock.unlockAtClicks) {
    return nextRock;
  }
  return null;
};

export const getHighestUnlockedRock = (totalClicks: number): Rock => {
  let highestRock = ROCKS[0];
  for (const rock of ROCKS) {
    if (totalClicks >= rock.unlockAtClicks) {
      highestRock = rock;
    }
  }
  return highestRock;
};

export const getNextRockUnlockInfo = (totalClicks: number): { nextRock: Rock | null; progress: number; clicksNeeded: number } => {
  const highestUnlocked = getHighestUnlockedRock(totalClicks);
  const nextRock = ROCKS.find(r => r.id === highestUnlocked.id + 1) || null;
  
  if (!nextRock) {
    return { nextRock: null, progress: 100, clicksNeeded: 0 };
  }
  
  const previousThreshold = highestUnlocked.unlockAtClicks;
  const nextThreshold = nextRock.unlockAtClicks;
  const progressInRange = totalClicks - previousThreshold;
  const rangeSize = nextThreshold - previousThreshold;
  const progress = Math.min(100, (progressInRange / rangeSize) * 100);
  const clicksNeeded = nextThreshold - totalClicks;
  
  return { nextRock, progress, clicksNeeded };
};

