'use client';

import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';
import { ROCKS } from '@/lib/gameData';

interface RockSelectorProps {
  onClose: () => void;
}

export default function RockSelector({ onClose }: RockSelectorProps) {
  const { gameState, selectRock, currentRock } = useGame();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-gray-600/30 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">🪨 Select Rock</h2>
          <div className="flex items-center gap-4">
            <div className="bg-black/30 rounded-lg px-4 py-2">
              <span className="text-gray-300 text-sm">Total Clicks: </span>
              <span className="text-white font-bold">{formatNumber(gameState.totalClicks)}</span>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-3xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Rock Grid */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {ROCKS.map((rock) => {
              const isUnlocked = gameState.totalClicks >= rock.unlockAtClicks;
              const isSelected = currentRock.id === rock.id;
              const clicksNeeded = rock.unlockAtClicks - gameState.totalClicks;

              return (
                <button
                  key={rock.id}
                  onClick={() => {
                    if (isUnlocked) {
                      selectRock(rock.id);
                      onClose();
                    }
                  }}
                  disabled={!isUnlocked}
                  className={`relative rounded-xl p-4 border transition-all ${
                    isSelected
                      ? 'bg-emerald-600/20 border-emerald-400 scale-105'
                      : isUnlocked
                        ? 'bg-gray-800/50 border-gray-700/50 hover:border-gray-500/50 hover:bg-gray-700/50'
                        : 'bg-gray-900/50 border-gray-800/50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                      MINING
                    </div>
                  )}

                  {/* Lock Icon */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                      <div className="text-center">
                        <span className="text-3xl">🔒</span>
                        <p className="text-gray-400 text-xs mt-1">
                          {formatNumber(clicksNeeded)} clicks
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Rock Image */}
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <Image
                      src={rock.image}
                      alt={rock.name}
                      fill
                      className={`object-contain ${!isUnlocked ? 'grayscale' : ''}`}
                    />
                  </div>

                  {/* Info */}
                  <h3 className="text-white font-bold text-center text-sm">{rock.name}</h3>
                  <p className="text-gray-400 text-xs text-center">
                    ${formatNumber(rock.moneyPerBreak)}/break
                  </p>
                  <p className="text-gray-500 text-xs text-center">
                    {formatNumber(rock.clicksToBreak)} HP
                  </p>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span>Currently Mining</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-600 rounded-full" />
                <span>Unlocked</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔒</span>
                <span>Locked</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

