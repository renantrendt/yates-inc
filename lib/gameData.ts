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
    price: 80,
    clickPower: 3,
  },
  {
    id: 3,
    name: 'Bronze',
    image: '/game/pickaxes/bronzep.png',
    price: 300,
    clickPower: 8,
  },
  {
    id: 4,
    name: 'Copper',
    image: '/game/pickaxes/copperp.png',
    price: 800,
    clickPower: 15,
  },
  {
    id: 5,
    name: 'Iron',
    image: '/game/pickaxes/ironp.png',
    price: 2000,
    clickPower: 30,
  },
  {
    id: 6,
    name: 'Steel',
    image: '/game/pickaxes/steelp.png',
    price: 5000,
    clickPower: 55,
  },
  {
    id: 7,
    name: 'Silver',
    image: '/game/pickaxes/silverp.png',
    price: 12000,
    clickPower: 90,
  },
  {
    id: 8,
    name: 'Gold',
    image: '/game/pickaxes/goldp.png',
    price: 25000,
    clickPower: 150,
    specialAbility: 'Click 2x faster, but weaker',
  },
  {
    id: 9,
    name: 'Platinum',
    image: '/game/pickaxes/platinump.png',
    price: 50000,
    clickPower: 250,
  },
  {
    id: 10,
    name: 'Diamond',
    image: '/game/pickaxes/diamondp.png',
    price: 100000,
    clickPower: 400,
  },
  {
    id: 11,
    name: 'Obsidian',
    image: '/game/pickaxes/obsidianp.png',
    price: 200000,
    clickPower: 600,
  },
  {
    id: 12,
    name: 'Alexandrite',
    image: '/game/pickaxes/alexandritep.png',
    price: 400000,
    clickPower: 900,
    moneyMultiplier: 1.4,
    specialAbility: 'Gives 40% more money',
  },
  {
    id: 13,
    name: 'Opal',
    image: '/game/pickaxes/opalp.png',
    price: 750000,
    clickPower: 1200,
    couponLuckBonus: 0.13,
    specialAbility: '13% more coupon luck',
  },
  {
    id: 14,
    name: 'Doge',
    image: '/game/pickaxes/dogep.png',
    price: 3000000,
    clickPower: 2000,
    moneyMultiplier: 3,
    specialAbility: '3x money',
  },
  {
    id: 15,
    name: 'Plasma',
    image: '/game/pickaxes/plasmap.png',
    price: 7000000,
    clickPower: 999999,
    specialAbility: 'Instant melt',
  },
];

export const ROCKS: Rock[] = [
  {
    id: 1,
    name: 'Coal',
    image: '/game/rocks/coal.webp',
    clicksToBreak: 5,
    moneyPerBreak: 2,
    moneyPerClick: 1,
    unlockAtClicks: 0,
  },
  {
    id: 2,
    name: 'Stone',
    image: '/game/rocks/stone.png',
    clicksToBreak: 15,
    moneyPerBreak: 20,
    moneyPerClick: 5,
    unlockAtClicks: 50,
  },
  {
    id: 3,
    name: 'Copper',
    image: '/game/rocks/copper.png',
    clicksToBreak: 30,
    moneyPerBreak: 30,
    moneyPerClick: 10,
    unlockAtClicks: 150,
  },
  {
    id: 4,
    name: 'Silver',
    image: '/game/rocks/silver.png',
    clicksToBreak: 60,
    moneyPerBreak: 65,
    moneyPerClick: 18,
    unlockAtClicks: 400,
  },
  {
    id: 5,
    name: 'Iron',
    image: '/game/rocks/iron.png',
    clicksToBreak: 100,
    moneyPerBreak: 100,
    moneyPerClick: 40,
    unlockAtClicks: 800,
  },
  {
    id: 6,
    name: 'Gold',
    image: '/game/rocks/gold.png',
    clicksToBreak: 200,
    moneyPerBreak: 456,
    moneyPerClick: 100,
    unlockAtClicks: 1500,
  },
  {
    id: 7,
    name: 'Diamond',
    image: '/game/rocks/diamond.png',
    clicksToBreak: 400,
    moneyPerBreak: 1000,
    moneyPerClick: 300,
    unlockAtClicks: 3000,
  },
  // --- 7 ROCK MARK (Coupons start dropping) ---
  {
    id: 8,
    name: 'Platinum',
    image: '/game/rocks/platinum.png',
    clicksToBreak: 700,
    moneyPerBreak: 1300,
    moneyPerClick: 560,
    unlockAtClicks: 5500,
  },
  {
    id: 9,
    name: 'Uranium',
    image: '/game/rocks/uranium.png',
    clicksToBreak: 1200,
    moneyPerBreak: 3200,
    moneyPerClick: 1000,
    unlockAtClicks: 9000,
  },
  {
    id: 10,
    name: 'Titanium',
    image: '/game/rocks/titanium.png',
    clicksToBreak: 1800,
    moneyPerBreak: 5000,
    moneyPerClick: 1200,
    unlockAtClicks: 15000,
  },
  {
    id: 11,
    name: 'Obsidian',
    image: '/game/rocks/obsidian.png',
    clicksToBreak: 2500,
    moneyPerBreak: 7890,
    moneyPerClick: 2000,
    unlockAtClicks: 25000,
  },
  {
    id: 12,
    name: 'Ruby',
    image: '/game/rocks/ruby.png',
    clicksToBreak: 3500,
    moneyPerBreak: 9999,
    moneyPerClick: 3333,
    unlockAtClicks: 40000,
  },
  // --- 12 ROCK MARK (Products unlock in shop) ---
  {
    id: 13,
    name: 'Sapphire',
    image: '/game/rocks/sapphire.png',
    clicksToBreak: 5000,
    moneyPerBreak: 11111,
    moneyPerClick: 4000,
    unlockAtClicks: 60000,
  },
  {
    id: 14,
    name: 'Emerald',
    image: '/game/rocks/emerald.png',
    clicksToBreak: 7000,
    moneyPerBreak: 13720,
    moneyPerClick: 4500,
    unlockAtClicks: 90000,
  },
  {
    id: 15,
    name: 'Amethyst',
    image: '/game/rocks/amethyst.png',
    clicksToBreak: 10000,
    moneyPerBreak: 15000,
    moneyPerClick: 4700,
    unlockAtClicks: 130000,
  },
  // --- NEW ROCKS (16-19) ---
  {
    id: 16,
    name: 'Bismuth',
    image: '/game/rocks/bismuth.png',
    clicksToBreak: 13000,
    moneyPerBreak: 18000,
    moneyPerClick: 5500,
    unlockAtClicks: 170000,
  },
  {
    id: 17,
    name: 'Bornite',
    image: '/game/rocks/bornite.png',
    clicksToBreak: 16000,
    moneyPerBreak: 22000,
    moneyPerClick: 6500,
    unlockAtClicks: 220000,
  },
  {
    id: 18,
    name: 'Azurite',
    image: '/game/rocks/azurite.png',
    clicksToBreak: 20000,
    moneyPerBreak: 28000,
    moneyPerClick: 7800,
    unlockAtClicks: 280000,
  },
  {
    id: 19,
    name: 'Titanium Quartz',
    image: '/game/rocks/titaniumquartz.png',
    clicksToBreak: 25000,
    moneyPerBreak: 35000,
    moneyPerClick: 9500,
    unlockAtClicks: 350000,
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

