'use client';

import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { ACHIEVEMENTS, checkAchievementUnlocked, TRINKETS } from '@/types/game';
import TrinketIndex from './TrinketIndex';

interface AchievementsPanelProps {
  isTrinketIndexOpen: boolean;
  setIsTrinketIndexOpen: (open: boolean) => void;
}

export default function AchievementsPanel({ isTrinketIndexOpen, setIsTrinketIndexOpen }: AchievementsPanelProps) {
  const { gameState } = useGame();
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  
  const unlockedCount = ACHIEVEMENTS.filter(a => checkAchievementUnlocked(a, gameState)).length;
  const totalCount = ACHIEVEMENTS.length;
  const trinketOwnedCount = gameState.ownedTrinketIds.length;
  const trinketTotalCount = TRINKETS.length;
  
  const categoryOrder = ['pickaxe', 'rock', 'money', 'prestige', 'miner', 'trinket'] as const;
  const categoryNames: Record<string, string> = {
    pickaxe: '⛏️ Pickaxes',
    rock: '🪨 Rocks',
    money: '💰 Money',
    prestige: '✨ Prestige',
    miner: '👷 Miners',
    trinket: '💍 Trinkets',
  };

  return (
    <>
      {/* Split button - Achievements & Trinket Index */}
      <div className="flex rounded-lg overflow-hidden shadow-lg">
        {/* Achievements (left half) */}
        <button
          onClick={() => setIsAchievementsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all border-r-2 border-amber-800"
        >
          <span className="text-xl">🏆</span>
          <span className="text-sm">{unlockedCount}/{totalCount}</span>
        </button>

        {/* Trinket Index (right half) */}
        <button
          onClick={() => setIsTrinketIndexOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all"
        >
          <span className="text-xl">💎</span>
          <span className="text-sm">{trinketOwnedCount}/{trinketTotalCount}</span>
        </button>
      </div>

      {/* Achievements Modal */}
      {isAchievementsOpen && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsAchievementsOpen(false)}
        >
          <div 
            className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border-2 border-amber-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                Achievements
              </h2>
              <div className="text-lg font-bold text-white">
                {unlockedCount} / {totalCount}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-gray-700 rounded-full mb-6 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>

            {/* Achievements by category */}
            {categoryOrder.map(category => {
              const categoryAchievements = ACHIEVEMENTS.filter(a => a.category === category);
              return (
                <div key={category} className="mb-6">
                  <h3 className="text-lg font-bold text-gray-300 mb-3">
                    {categoryNames[category]}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryAchievements.map(achievement => {
                      const isUnlocked = checkAchievementUnlocked(achievement, gameState);
                      return (
                        <div
                          key={achievement.id}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isUnlocked 
                              ? 'bg-amber-900/30 border-amber-500 shadow-lg shadow-amber-500/20' 
                              : 'bg-gray-800/50 border-gray-700 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-3xl ${isUnlocked ? '' : 'grayscale'}`}>
                              {isUnlocked ? achievement.icon : '🔒'}
                            </span>
                            <div>
                              <p className={`font-bold ${isUnlocked ? 'text-amber-400' : 'text-gray-500'}`}>
                                {achievement.name}
                              </p>
                              <p className={`text-sm ${isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                                {achievement.description}
                              </p>
                            </div>
                            {isUnlocked && (
                              <span className="ml-auto text-green-400 text-xl">✓</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => setIsAchievementsOpen(false)}
              className="w-full mt-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Trinket Index Modal */}
      <TrinketIndex
        isOpen={isTrinketIndexOpen}
        onClose={() => setIsTrinketIndexOpen(false)}
      />
    </>
  );
}
