'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '@/contexts/GameContext';
import { ACHIEVEMENTS, checkAchievementUnlocked, TRINKETS, TITLES, TITLE_NAME_STYLES, PRESTIGE_UPGRADES } from '@/types/game';
import { supabase } from '@/lib/supabase';

interface AchievementsPanelProps {
  isTrinketIndexOpen: boolean;
  setIsTrinketIndexOpen: (open: boolean) => void;
}

export default function AchievementsPanel({ isTrinketIndexOpen, setIsTrinketIndexOpen }: AchievementsPanelProps) {
  const { gameState, equipTitle, unequipTitle } = useGame();
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [titleCounts, setTitleCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch title counts when panel opens
  useEffect(() => {
    if (!isAchievementsOpen) return;
    
    const fetchTitleCounts = async () => {
      try {
        // Get all users' owned_title_ids
        const { data, error } = await supabase
          .from('user_game_data')
          .select('owned_title_ids');
        
        if (error || !data) return;
        
        // Count how many users have each title
        const counts: Record<string, number> = {};
        data.forEach(row => {
          const titles = row.owned_title_ids || [];
          titles.forEach((titleId: string) => {
            counts[titleId] = (counts[titleId] || 0) + 1;
          });
        });
        
        setTitleCounts(counts);
      } catch (err) {
        console.error('Error fetching title counts:', err);
      }
    };
    
    fetchTitleCounts();
  }, [isAchievementsOpen]);
  
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

      {/* Achievements Modal - via portal */}
      {isAchievementsOpen && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsAchievementsOpen(false)}
        >
          <div 
            className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border-2 border-amber-500 z-[9999]"
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

            {/* Pro Player Section - Only shows if player has titles */}
            {gameState.ownedTitleIds && gameState.ownedTitleIds.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-500/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-purple-300 flex items-center gap-2">
                    <span>👑</span> Pro Player Titles
                  </h3>
                  {/* Show equipped count */}
                  <div className="text-xs text-gray-400">
                    {gameState.equippedTitleIds?.length || 0} / {gameState.ownedPrestigeUpgradeIds?.includes('title_master') ? 2 : 1} equipped
                    {gameState.ownedPrestigeUpgradeIds?.includes('title_master') && (
                      <span className="ml-1 text-purple-400">✨ Title Master</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">Click to equip/unequip titles</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TITLES.filter(title => gameState.ownedTitleIds?.includes(title.id)).map(title => {
                    const isEquipped = gameState.equippedTitleIds?.includes(title.id);
                    const hasTitleMaster = gameState.ownedPrestigeUpgradeIds?.includes('title_master');
                    const maxEquipped = hasTitleMaster ? 2 : 1;
                    const canEquip = !isEquipped && (gameState.equippedTitleIds?.length || 0) < maxEquipped;
                    
                    return (
                      <button
                        key={title.id}
                        onClick={() => {
                          if (isEquipped) {
                            unequipTitle(title.id);
                          } else {
                            equipTitle(title.id);
                          }
                        }}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          isEquipped 
                            ? 'bg-purple-600/30 border-purple-400 shadow-lg shadow-purple-500/30' 
                            : canEquip
                              ? 'bg-gray-800/50 border-gray-600 hover:border-purple-500/50 hover:bg-purple-900/20'
                              : 'bg-gray-800/50 border-gray-600 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{title.icon}</span>
                          <div className="flex-1">
                            <p className={`font-bold ${TITLE_NAME_STYLES[title.nameStyle]}`}>
                              {title.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {title.category === 'secret' && titleCounts[title.id] 
                                ? `You are one of the ${titleCounts[title.id]} who have this title!`
                                : title.description}
                            </p>
                            {/* Show buffs */}
                            <div className="text-xs text-green-400 mt-1">
                              {title.buffs.moneyBonus && `+${Math.round(title.buffs.moneyBonus * 100)}% money `}
                              {title.buffs.allBonus && `+${Math.round(title.buffs.allBonus * 100)}% all `}
                              {title.buffs.speedBonus && `+${Math.round(title.buffs.speedBonus * 100)}% speed `}
                              {title.buffs.pcxDiscount && `${Math.round(title.buffs.pcxDiscount * 100)}% pcx discount `}
                              {title.buffs.prestigeMoneyRetention && `keep ${Math.round(title.buffs.prestigeMoneyRetention * 100)}% on prestige`}
                            </div>
                          </div>
                          {isEquipped ? (
                            <span className="text-purple-400 text-xs font-bold px-2 py-1 bg-purple-500/20 rounded">EQUIPPED</span>
                          ) : canEquip ? (
                            <span className="text-gray-500 text-xs">Click to equip</span>
                          ) : (
                            <span className="text-gray-600 text-xs">Slot full</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
        </div>,
        document.body
      )}
    </>
  );
}
