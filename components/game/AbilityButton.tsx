'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';

export default function AbilityButton() {
  const {
    gameState,
    currentPickaxe,
    activateAbility,
    getAbilityCooldownRemaining,
    isAbilityActive,
    getActiveAbilityTimeRemaining,
  } = useGame();

  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [activeRemaining, setActiveRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Get the active ability from current pickaxe
  const ability = currentPickaxe.activeAbility;

  // Update timers every 100ms
  useEffect(() => {
    if (!ability) return;

    const interval = setInterval(() => {
      setCooldownRemaining(getAbilityCooldownRemaining());
      setActiveRemaining(getActiveAbilityTimeRemaining());
      setIsActive(isAbilityActive());
    }, 100);

    return () => clearInterval(interval);
  }, [ability, getAbilityCooldownRemaining, getActiveAbilityTimeRemaining, isAbilityActive]);

  // Don't render if no ability
  if (!ability) return null;

  const canAfford = gameState.yatesDollars >= ability.cost;
  const onCooldown = cooldownRemaining > 0;
  const canActivate = canAfford && !onCooldown && !isActive;

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const formatCost = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(0)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const handleClick = () => {
    if (canActivate) {
      activateAbility();
    }
  };

  return (
    <div className="fixed bottom-32 sm:bottom-36 right-2 sm:right-4 z-50">
      <div className="flex flex-col items-center">
        {/* Clash Royale style circular button */}
        <div className="relative">
          <button
            onClick={handleClick}
            disabled={!canActivate}
            className={`
              relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full transition-all
              flex items-center justify-center
              ${isActive 
                ? 'shadow-[0_0_20px_rgba(251,191,36,0.6)] scale-105' 
                : canActivate
                  ? 'hover:scale-110 active:scale-95 cursor-pointer'
                  : 'cursor-not-allowed'
              }
              touch-manipulation
            `}
            style={{
              background: isActive 
                ? 'linear-gradient(145deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)'
                : canActivate
                  ? 'linear-gradient(145deg, #a855f7 0%, #7c3aed 50%, #5b21b6 100%)'
                  : 'linear-gradient(145deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
              border: '3px solid',
              borderColor: isActive 
                ? '#fcd34d' 
                : canActivate 
                  ? '#c084fc' 
                  : onCooldown 
                    ? '#6b7280' 
                    : '#ef4444',
              boxShadow: isActive
                ? 'inset 0 -4px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)'
                : 'inset 0 -4px 0 rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {/* Inner glow ring */}
            <div 
              className="absolute inset-1 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)',
              }}
            />

            {/* Pickaxe image */}
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 z-10">
              {currentPickaxe.image ? (
                <Image
                  src={currentPickaxe.image}
                  alt={ability.name}
                  fill
                  className="object-contain drop-shadow-lg"
                  unoptimized
                />
              ) : (
                <span className="text-3xl sm:text-4xl drop-shadow-lg">{ability.icon}</span>
              )}
            </div>

            {/* Cooldown overlay with sweep animation */}
            {onCooldown && !isActive && (
              <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-base drop-shadow-lg">
                  {formatTime(cooldownRemaining)}
                </span>
              </div>
            )}

            {/* Active timer badge */}
            {isActive && (
              <div className="absolute -top-1 -right-1 bg-white text-orange-600 text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-full shadow-lg border-2 border-orange-400">
                {formatTime(activeRemaining)}
              </div>
            )}
          </button>

          {/* Cost badge - Clash Royale elixir style (top-left) */}
          <div 
            className={`
              absolute -top-1 -left-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center
              font-black text-[10px] sm:text-xs shadow-lg border-2
              ${canAfford 
                ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-300 text-white' 
                : 'bg-gradient-to-br from-red-500 to-red-700 border-red-400 text-white'
              }
            `}
            style={{
              boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {formatCost(ability.cost)}
          </div>
        </div>

        {/* Name banner below - Clash Royale style ribbon */}
        <div 
          className="relative mt-1 px-2 sm:px-3 py-0.5 sm:py-1"
          style={{
            background: 'linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)',
            borderRadius: '4px',
            border: '1px solid #3b82f6',
            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
          }}
        >
          {/* Ribbon notches */}
          <div 
            className="absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: '6px solid #1e3a5f',
            }}
          />
          <div 
            className="absolute -right-1 top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: '6px solid #1e3a5f',
            }}
          />
          
          <span className="text-[10px] sm:text-xs font-bold text-blue-200 whitespace-nowrap">
            {ability.name}
          </span>
        </div>

        {/* Active glow effect */}
        {isActive && (
          <div className="absolute inset-0 -m-2 rounded-full bg-yellow-400/20 animate-pulse pointer-events-none" />
        )}
      </div>
    </div>
  );
}
