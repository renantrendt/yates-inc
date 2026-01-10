'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';
import { PICKAXES, getNextRockUnlockInfo } from '@/lib/gameData';
import { AUTOCLICKER_COST, AUTOCLICKER_CPS } from '@/types/game';
import GameShop from './GameShop';
import RockSelector from './RockSelector';
import GameTerminal from './GameTerminal';
import PrestigeButton from './PrestigeButton';
import TrinketShopButton from './TrinketShopButton';
import TrinketSlot from './TrinketSlot';
import MinerSprites, { MinerPurchaseButton } from './MinerSprite';
import PrestigeStore from './PrestigeStore';
import AchievementsPanel from './AchievementsPanel';
import AbilityButton from './AbilityButton';
import TrinketIndex from './TrinketIndex';
import { MINER_BASE_DAMAGE } from '@/types/game';
import { ROCKS, getRockById } from '@/lib/gameData';

interface MiningGameProps {
  onExit?: () => void;
}

interface MoneyPopup {
  id: string;
  amount: number;
  x: number;
  y: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface CouponPopup {
  id: string;
  type: string;
  x: number;
  y: number;
}

export default function MiningGame({ onExit }: MiningGameProps) {
  const {
    gameState,
    currentPickaxe,
    currentRock,
    mineRock,
    buyAutoclicker,
    toggleAutoclicker,
    dismissWarning,
    submitAppeal,
    isBanned,
    banReason,
    getTotalBonuses,
  } = useGame();

  const [moneyPopups, setMoneyPopups] = useState<MoneyPopup[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [couponPopups, setCouponPopups] = useState<CouponPopup[]>([]);
  const [isSwinging, setIsSwinging] = useState(false);
  const [rockShake, setRockShake] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showRockSelector, setShowRockSelector] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showTrinketIndex, setShowTrinketIndex] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [rockBroken, setRockBroken] = useState(false);

  // Anti-cheat warning modal state
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  // Show warning modal when warnings change
  useEffect(() => {
    if (gameState.isBlocked && gameState.antiCheatWarnings > 0 && !gameState.appealPending) {
      setShowWarningModal(true);
    }
  }, [gameState.isBlocked, gameState.antiCheatWarnings, gameState.appealPending]);

  const rockRef = useRef<HTMLDivElement>(null);
  const popupIdRef = useRef(0);
  const autoclickerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Autoclicker effect - 20 clicks per second when enabled
  useEffect(() => {
    if (gameState.hasAutoclicker && gameState.autoclickerEnabled) {
      autoclickerIntervalRef.current = setInterval(() => {
        mineRock();
      }, 1000 / AUTOCLICKER_CPS);
    } else {
      if (autoclickerIntervalRef.current) {
        clearInterval(autoclickerIntervalRef.current);
        autoclickerIntervalRef.current = null;
      }
    }

    return () => {
      if (autoclickerIntervalRef.current) {
        clearInterval(autoclickerIntervalRef.current);
      }
    };
  }, [gameState.hasAutoclicker, gameState.autoclickerEnabled, mineRock]);

  const handleMine = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent default on touch to avoid double-firing
    if (e && 'touches' in e) {
      e.preventDefault();
    }

    // Mine the rock FIRST before any animations
    const result = mineRock();
    
    // Only animate if we actually mined
    if (result.earnedMoney > 0 || result.brokeRock) {
      // Trigger pickaxe swing animation
      setIsSwinging(true);
      setTimeout(() => setIsSwinging(false), 150);

      // Trigger rock shake
      setRockShake(true);
      setTimeout(() => setRockShake(false), 100);
    }

    // Handle rock break animation
    if (result.brokeRock) {
      setRockBroken(true);
      setDisplayProgress(100);
      setTimeout(() => {
        setRockBroken(false);
        setDisplayProgress(0);
      }, 300);
    } else {
      // Update display progress for click feedback, then reset to let actualProgress take over
      const newProgress = ((currentRock.clicksToBreak - gameState.currentRockHP + 1) / currentRock.clicksToBreak) * 100;
      setDisplayProgress(Math.min(100, newProgress));
      // Reset displayProgress after animation so miners can update the bar via actualProgress
      setTimeout(() => setDisplayProgress(0), 200);
    }

    // Create money popup
    const popupId = `popup-${popupIdRef.current++}`;
    const rockRect = rockRef.current?.getBoundingClientRect();
    const randomOffsetX = (Math.random() - 0.5) * 100;
    const randomOffsetY = (Math.random() - 0.5) * 50;

    setMoneyPopups((prev) => [
      ...prev,
      {
        id: popupId,
        amount: result.earnedMoney,
        x: (rockRect?.width || 200) / 2 + randomOffsetX,
        y: (rockRect?.height || 200) / 2 + randomOffsetY,
      },
    ]);

    // Remove popup after animation
    setTimeout(() => {
      setMoneyPopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 1000);

    // Create particles
    for (let i = 0; i < 5; i++) {
      const particleId = `particle-${popupIdRef.current++}`;
      setParticles((prev) => [
        ...prev,
        {
          id: particleId,
          x: (rockRect?.width || 200) / 2,
          y: (rockRect?.height || 200) / 2,
          vx: (Math.random() - 0.5) * 20,
          vy: -Math.random() * 15 - 5,
        },
      ]);

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== particleId));
      }, 500);
    }

    // Coupon drop notification
    if (result.couponDrop) {
      const couponId = `coupon-${popupIdRef.current++}`;
      setCouponPopups((prev) => [
        ...prev,
        {
          id: couponId,
          type: result.couponDrop!,
          x: (rockRect?.width || 200) / 2,
          y: 0,
        },
      ]);

      setTimeout(() => {
        setCouponPopups((prev) => prev.filter((c) => c.id !== couponId));
      }, 2000);
    }
  }, [mineRock, gameState.currentRockHP, currentRock.clicksToBreak]);

  // Keyboard handler - ESC to exit, I for terminal, + to mine
  // Prevents WASD from bubbling to prevent page scroll/navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if typing in any input/textarea (email, terminal, etc.)
      const target = e.target as HTMLElement;
      const activeElement = document.activeElement as HTMLElement;
      
      // Check both target and activeElement to cover all input scenarios
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        activeElement?.tagName === 'INPUT' || 
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.contentEditable === 'true'
      ) {
        return; // Allow normal typing in inputs
      }

      // Prevent WASD keys only when NOT typing in inputs
      const preventedKeys = ['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
      if (preventedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.key === 'Escape' && onExit) {
        onExit();
      }

      // 'I' key toggles terminal
      if (e.key === 'i' || e.key === 'I') {
        setShowTerminal(prev => !prev);
      }

      // '+' key to mine (sneaky mode)
      if (e.key === '+' || e.key === '=') {
        handleMine();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [onExit, handleMine]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000000000) return `${(num / 1000000000000).toFixed(1)}T`;
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getCouponLabel = (type: string): string => {
    switch (type) {
      case 'discount30': return '30% OFF!';
      case 'discount50': return '50% OFF!';
      case 'discount100': return 'FREE ITEM!';
      default: return 'COUPON!';
    }
  };

  const actualProgress = ((currentRock.clicksToBreak - gameState.currentRockHP) / currentRock.clicksToBreak) * 100;
  const progressPercent = rockBroken ? 100 : (displayProgress || actualProgress);
  const totalCoupons = gameState.coupons.discount30 + gameState.coupons.discount50 + gameState.coupons.discount100;

  // Calculate income per second for miners (with all bonuses)
  const bonuses = getTotalBonuses();
  const minerRock = getRockById(gameState.currentRockId) || ROCKS[0];
  const totalDamageBonus = bonuses.minerDamageBonus + bonuses.minerSpeedBonus;
  const minerDps = gameState.minerCount * MINER_BASE_DAMAGE * (1 + totalDamageBonus);
  const minerRocksPerSecond = minerDps / minerRock.clicksToBreak;
  const incomePerSecond = Math.ceil(minerRocksPerSecond * minerRock.moneyPerBreak * gameState.prestigeMultiplier * (1 + bonuses.moneyBonus));

  // Check if player can buy the next pickaxe (sequential order)
  const canBuyNextPickaxe = useMemo(() => {
    // Find the highest owned pickaxe
    const highestOwnedId = Math.max(...gameState.ownedPickaxeIds);
    // Next pickaxe in sequence
    const nextPickaxe = PICKAXES.find(p => p.id === highestOwnedId + 1);
    if (!nextPickaxe) return false;
    // Can afford it?
    return gameState.yatesDollars >= nextPickaxe.price;
  }, [gameState.ownedPickaxeIds, gameState.yatesDollars]);

  // Get next rock unlock progress
  const nextRockInfo = useMemo(() => {
    return getNextRockUnlockInfo(gameState.totalClicks);
  }, [gameState.totalClicks]);

  // Show ban screen if user is banned
  if (isBanned) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[100]">
        <div className="text-center p-8 max-w-md">
          <div className="text-8xl mb-6">🚫</div>
          <h1 className="text-4xl font-bold text-red-500 mb-4">BANNED</h1>
          <p className="text-white text-lg mb-4">
            Your account has been banned from Yates Inc.
          </p>
          {banReason && (
            <p className="text-gray-400 mb-6">
              <span className="text-gray-500">Reason:</span> {banReason}
            </p>
          )}
          <p className="text-gray-500 text-sm">
            If you believe this is a mistake, contact an administrator.
          </p>
          {onExit && (
            <button
              onClick={onExit}
              className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Exit
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden select-none z-[100]">
      {/* Cave Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, #3d2817 0%, #1a0f0a 50%, #0d0705 100%),
            linear-gradient(180deg, #2d1f15 0%, #1a0f0a 100%)
          `,
        }}
      >
        {/* Rock texture overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Ambient cave glow */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 60%, rgba(255, 150, 50, 0.1) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Top HUD - Fixed position with safe margins */}
      <div className="fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-40 flex justify-between items-start gap-2">
        {/* Currency Display + Exit */}
        <div className="flex flex-col gap-1 sm:gap-2">
          {/* Exit Button */}
          {onExit && (
            <button
              onClick={onExit}
              className="bg-black/80 backdrop-blur-sm hover:bg-red-900/80 rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 border border-gray-600/30 hover:border-red-500/50 shadow-lg transition-colors group touch-manipulation"
              title="Press ESC to exit"
            >
              <span className="text-gray-400 group-hover:text-red-400 transition-colors text-sm sm:text-base">✕</span>
              <span className="text-gray-400 group-hover:text-red-300 font-medium text-xs sm:text-sm transition-colors">EXIT</span>
              <span className="hidden sm:inline text-gray-600 text-xs">(ESC)</span>
            </button>
          )}

          <div className="bg-black/80 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 border border-yellow-600/30 shadow-lg">
            <span className="text-lg sm:text-2xl">💰</span>
            <span className="text-yellow-400 font-bold text-base sm:text-xl">${formatNumber(gameState.yatesDollars)}</span>
          </div>

          {/* Coupon Display - Individual bars */}
          {totalCoupons > 0 && (
            <div className="bg-black/80 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-purple-600/30 shadow-lg">
              <div className="flex items-center gap-1.5 sm:gap-3">
                {gameState.coupons.discount30 > 0 && (
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-green-600/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    <span className="text-[10px] sm:text-xs text-green-400 font-bold">30%</span>
                    <span className="text-green-300 font-bold text-[10px] sm:text-xs">×{gameState.coupons.discount30}</span>
                  </div>
                )}
                {gameState.coupons.discount50 > 0 && (
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-blue-600/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    <span className="text-[10px] sm:text-xs text-blue-400 font-bold">50%</span>
                    <span className="text-blue-300 font-bold text-[10px] sm:text-xs">×{gameState.coupons.discount50}</span>
                  </div>
                )}
                {gameState.coupons.discount100 > 0 && (
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-yellow-600/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    <span className="text-[10px] sm:text-xs text-yellow-400 font-bold">FREE</span>
                    <span className="text-yellow-300 font-bold text-[10px] sm:text-xs">×{gameState.coupons.discount100}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Autoclicker - Buy or Toggle on/off */}
          {gameState.hasAutoclicker ? (
            <button
              onClick={toggleAutoclicker}
              className={`bg-black/80 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border shadow-lg transition-all touch-manipulation cursor-pointer ${gameState.autoclickerEnabled
                ? 'border-cyan-500/50 shadow-cyan-500/20 hover:border-cyan-400'
                : 'border-gray-600/50 hover:border-gray-500'
                }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={gameState.autoclickerEnabled ? 'text-cyan-400 animate-pulse' : 'text-gray-500'}>🤖</span>
                <span className={`text-[10px] sm:text-xs font-bold ${gameState.autoclickerEnabled ? 'text-cyan-300' : 'text-gray-400'}`}>
                  {gameState.autoclickerEnabled ? 'ON' : 'OFF'}
                </span>
                <span className={`text-[10px] sm:text-xs ${gameState.autoclickerEnabled ? 'text-cyan-400' : 'text-gray-500'}`}>
                  {AUTOCLICKER_CPS}/s
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={buyAutoclicker}
              disabled={gameState.yatesDollars < AUTOCLICKER_COST}
              className={`bg-black/80 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border shadow-lg transition-all touch-manipulation ${gameState.yatesDollars >= AUTOCLICKER_COST
                ? 'border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-900/30 cursor-pointer'
                : 'border-gray-600/30 opacity-60 cursor-not-allowed'
                }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-gray-400">🤖</span>
                <span className="text-[10px] sm:text-xs text-gray-300 font-bold">AUTOCLICKER</span>
                <span className={`text-[10px] sm:text-xs font-bold ${gameState.yatesDollars >= AUTOCLICKER_COST ? 'text-cyan-400' : 'text-gray-500'}`}>
                  ${formatNumber(AUTOCLICKER_COST)}
                </span>
              </div>
            </button>
          )}

          {/* Prestige Button - appears when eligible */}
          <PrestigeButton />

          {/* Prestige Store - appears after first prestige */}
          <PrestigeStore />

          {/* Miner Purchase Button */}
          <MinerPurchaseButton />

          {/* Achievements */}
          <AchievementsPanel 
            isTrinketIndexOpen={showTrinketIndex}
            setIsTrinketIndexOpen={setShowTrinketIndex}
          />

          {/* Trinket Slot */}
          <TrinketSlot />
        </div>

        {/* Shop Button + Notification */}
        <div className="flex flex-col items-end gap-1 sm:gap-2">
          <button
            onClick={() => setShowShop(true)}
            className="bg-gradient-to-br from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 active:from-amber-700 active:to-amber-900 text-white font-bold py-2 sm:py-3 px-3 sm:px-6 rounded-lg sm:rounded-xl text-sm sm:text-lg transition-all shadow-lg hover:scale-105 active:scale-95 border border-amber-400/30 touch-manipulation"
          >
            🛒 <span className="hidden xs:inline">SHOP</span>
          </button>

          {/* New Pickaxe Available Notification */}
          {canBuyNextPickaxe && !showShop && (
            <div
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg shadow-lg animate-pulse cursor-pointer border border-green-400/30 touch-manipulation"
              onClick={() => setShowShop(true)}
            >
              <span className="text-xs sm:text-sm font-bold">⛏️ <span className="hidden xs:inline">New pickaxe!</span></span>
            </div>
          )}
        </div>
      </div>

      {/* Main Mining Area */}
      <div className="absolute inset-0 flex items-center justify-center pt-16 sm:pt-16 pb-32 sm:pb-32 px-2">
        <div className="relative flex items-center">
          {/* Pickaxe */}
          <div
            className={`relative w-16 h-16 sm:w-28 sm:h-28 md:w-32 md:h-32 transition-transform origin-bottom-right -mr-4 sm:-mr-8 z-50 ${isSwinging ? 'rotate-[30deg]' : 'rotate-0'
              }`}
            style={{ transitionDuration: '0.15s' }}
          >
            <Image
              key={`pickaxe-${currentPickaxe.id}`}
              src={currentPickaxe.image}
              alt={currentPickaxe.name}
              fill
              unoptimized
              className="object-contain drop-shadow-2xl pointer-events-none"
              style={{ transform: 'rotate(-30deg)' }}
            />
          </div>

          {/* Rock (Clickable/Touchable) - Responsive hitbox matching visual rock */}
          <div
            ref={rockRef}
            onClick={handleMine}
            onTouchEnd={handleMine}
            className="relative z-40 w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 cursor-pointer touch-manipulation flex items-center justify-center select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {/* Rock visual inside the hitbox */}
            <div
              className={`relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 transition-transform hover:scale-105 active:scale-95 ${rockShake ? 'animate-shake' : ''} ${rockBroken ? 'animate-rock-break' : ''}`}
            >
              <Image
                key={`rock-${currentRock.id}-${gameState.isBlocked ? 'bedrock' : currentRock.image}`}
                src={gameState.isBlocked ? '/game/rocks/coal.png' : currentRock.image}
                alt={gameState.isBlocked ? 'Bedrock (Blocked)' : currentRock.name}
                fill
                unoptimized
                className={`object-contain drop-shadow-2xl transition-all pointer-events-none ${rockBroken ? 'scale-110 brightness-150' : ''} ${gameState.isBlocked ? 'grayscale brightness-50' : ''}`}
              />

              {/* Rock break flash */}
              {rockBroken && (
                <div className="absolute inset-0 bg-white/50 rounded-full animate-flash-out pointer-events-none" />
              )}

              {/* Money Popups */}
              {moneyPopups.map((popup) => (
                <div
                  key={popup.id}
                  className="absolute pointer-events-none animate-float-up text-yellow-400 font-bold text-2xl"
                  style={{
                    left: popup.x,
                    top: popup.y,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  +${popup.amount}
                </div>
              ))}

              {/* Particles */}
              {particles.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute w-2 h-2 bg-amber-600 rounded-full pointer-events-none animate-particle"
                  style={{
                    left: particle.x,
                    top: particle.y,
                    '--vx': `${particle.vx}px`,
                    '--vy': `${particle.vy}px`,
                  } as React.CSSProperties}
                />
              ))}

              {/* Coupon Popups */}
              {couponPopups.map((popup) => (
                <div
                  key={popup.id}
                  className="absolute left-1/2 -translate-x-1/2 -top-16 pointer-events-none animate-bounce-in"
                >
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg px-4 py-2 rounded-lg shadow-lg">
                    🎟️ {getCouponLabel(popup.type)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="fixed bottom-0 left-0 right-0 p-2 sm:p-4 z-30">
        <div className="max-w-2xl mx-auto space-y-2 sm:space-y-3">
          {/* Current Rock HP Bar with $/Sec box on the right */}
          <div className="flex gap-2 sm:gap-3 items-start">
            <div className="flex-1 bg-black/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-gray-700/50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-300 font-medium text-xs sm:text-sm">⛏️ Mining: {currentRock.name}</span>
                <span className="text-gray-400 text-[10px] sm:text-xs">
                  {formatNumber(gameState.currentRockHP)} / {formatNumber(currentRock.clicksToBreak)} HP
                </span>
              </div>
              <div className="w-full h-2 sm:h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* $/Sec box on the right */}
            {gameState.minerCount > 0 && (
              <div className="bg-black/90 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 border-2 border-yellow-500 shadow-xl pointer-events-none">
                <div className="flex items-center gap-2 sm:gap-3 text-yellow-400">
                  <span className="text-2xl sm:text-3xl">⛏️</span>
                  <div className="flex items-center gap-3">
                    <p className="text-green-400 font-bold text-xs sm:text-sm">+${formatNumber(incomePerSecond)}/s</p>
                    <p className="font-bold text-sm sm:text-base">{gameState.minerCount} Miners</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Rock Unlock Bar */}
          {nextRockInfo.nextRock && (
            <div className="bg-black/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-blue-700/50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-blue-300 font-medium text-xs sm:text-sm">🔓 Next: {nextRockInfo.nextRock.name}</span>
                <span className="text-blue-400 text-[10px] sm:text-xs">
                  {formatNumber(nextRockInfo.clicksNeeded)} clicks left
                </span>
              </div>
              <div className="w-full h-2 sm:h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-150"
                  style={{ width: `${nextRockInfo.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Max Rock Reached */}
          {!nextRockInfo.nextRock && (
            <div className="bg-black/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-yellow-700/50 text-center">
              <span className="text-yellow-400 font-bold text-xs sm:text-sm">🏆 MAX ROCK UNLOCKED!</span>
            </div>
          )}

          {/* Stats Row */}
          <div className="flex justify-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowRockSelector(true)}
              className="bg-black/80 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-700/50 hover:border-gray-500/50 active:border-gray-400/50 transition-colors touch-manipulation"
            >
              <span className="text-gray-400 text-[10px] sm:text-xs">Rock</span>
              <span className="text-white font-bold block text-xs sm:text-sm">{currentRock.id}/{ROCKS.length}</span>
            </button>

            <div className="bg-black/80 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-700/50">
              <span className="text-gray-400 text-[10px] sm:text-xs">Power</span>
              <span className="text-white font-bold block text-xs sm:text-sm">{formatNumber(currentPickaxe.clickPower)}</span>
            </div>

            <div className="bg-black/80 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-700/50 max-w-[120px]">
              <span className="text-gray-400 text-[10px] sm:text-xs">Pickaxe</span>
              <span className="text-white font-bold block text-xs sm:text-sm truncate">{currentPickaxe.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Modal */}
      {showShop && <GameShop onClose={() => setShowShop(false)} />}

      {/* Rock Selector Modal */}
      {showRockSelector && <RockSelector onClose={() => setShowRockSelector(false)} />}

      {/* Miner Sprites - positioned at bottom of screen */}
      <MinerSprites />

      {/* Trinket Shop Button - bottom left (hidden when trinket index is open) */}
      <TrinketShopButton hidden={showTrinketIndex} />

      {/* Trinket Index - rendered at root level to escape z-40 HUD stacking context */}
      <TrinketIndex
        isOpen={showTrinketIndex}
        onClose={() => setShowTrinketIndex(false)}
      />

      {/* Ability Button - bottom right (for pickaxes with active abilities) */}
      <AbilityButton />

      {/* Game Terminal */}
      <GameTerminal
        isOpen={showTerminal}
        onClose={() => setShowTerminal(false)}
        onMine={handleMine}
      />

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes particle {
          0% {
            opacity: 1;
            transform: translate(0, 0);
          }
          100% {
            opacity: 0;
            transform: translate(var(--vx), calc(var(--vy) + 50px));
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: translateX(-50%) scale(0.5);
          }
          50% {
            transform: translateX(-50%) scale(1.2);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }

        .animate-float-up {
          animation: float-up 1s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.1s ease-in-out;
        }

        .animate-particle {
          animation: particle 0.5s ease-out forwards;
        }

        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out forwards;
        }

        @keyframes rock-break {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        @keyframes flash-out {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }

        .animate-rock-break {
          animation: rock-break 0.3s ease-out;
        }

        .animate-flash-out {
          animation: flash-out 0.3s ease-out forwards;
        }
      `}</style>

      {/* Anti-Cheat Warning Modals */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
          <div className="bg-gray-900 border-2 border-red-500 rounded-xl max-w-md w-full p-6 text-center shadow-2xl">
            {/* Warning 1 */}
            {gameState.antiCheatWarnings === 1 && (
              <>
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-red-400 mb-4">WARNING 1 of 3</h2>
                <p className="text-white text-lg mb-6">
                  This is your first warning out of 3! Stop auto clicking!!
                </p>
                <button
                  onClick={() => {
                    setShowWarningModal(false);
                    dismissWarning();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors"
                >
                  I Understand
                </button>
              </>
            )}

            {/* Warning 2 */}
            {gameState.antiCheatWarnings === 2 && (
              <>
                <div className="text-6xl mb-4">🔥</div>
                <h2 className="text-2xl font-bold text-orange-400 mb-4">WARNING 2 of 3</h2>
                <p className="text-white text-lg mb-6">
                  If you do this one more time you&apos;re cooked!
                </p>
                <button
                  onClick={() => {
                    setShowWarningModal(false);
                    dismissWarning();
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors"
                >
                  Last Chance...
                </button>
              </>
            )}

            {/* Warning 3 - Appeal Option */}
            {gameState.antiCheatWarnings >= 3 && !gameState.appealPending && (
              <>
                <div className="text-6xl mb-4">💀</div>
                <h2 className="text-2xl font-bold text-red-500 mb-4">FINAL WARNING</h2>
                <p className="text-white text-lg mb-6">
                  Just get out.
                </p>
                <div className="space-y-4">
                  <textarea
                    value={appealText}
                    onChange={(e) => setAppealText(e.target.value)}
                    placeholder="Wait! I can explain... (write your appeal)"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!appealText.trim()) return;
                        setIsSubmittingAppeal(true);
                        const success = await submitAppeal(appealText);
                        setIsSubmittingAppeal(false);
                        if (success) {
                          setShowWarningModal(false);
                          setAppealText('');
                        }
                      }}
                      disabled={!appealText.trim() || isSubmittingAppeal}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-colors"
                    >
                      {isSubmittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Check your email in a lil to see if you got approved or not.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Appeal Pending Overlay */}
      {gameState.appealPending && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
          <div className="bg-gray-900 border-2 border-yellow-500 rounded-xl max-w-md w-full p-6 text-center shadow-2xl">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Appeal Pending</h2>
            <p className="text-white text-lg mb-4">
              Your appeal has been sent to the admins.
            </p>
            <p className="text-gray-400">
              Check your email for updates. You cannot play until your appeal is reviewed.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
