'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';
import { TRINKETS, RARITY_COLORS, Trinket } from '@/types/game';

export default function TrinketSlot() {
  const [showSelector, setShowSelector] = useState(false);
  const { 
    gameState, 
    getEquippedTrinkets, 
    equipTrinket, 
    unequipTrinket, 
    canEquipDualTrinkets,
    getTotalBonuses 
  } = useGame();
  
  const equippedTrinkets = getEquippedTrinkets();
  const ownedTrinkets = gameState.ownedTrinketIds
    .map(id => TRINKETS.find(t => t.id === id))
    .filter((t): t is Trinket => t !== undefined);
  const maxSlots = canEquipDualTrinkets() ? 2 : 1;
  const bonuses = getTotalBonuses();
  
  // Check if any bonuses are active
  const hasActiveBonuses = Object.values(bonuses).some(v => v > 0);

  return (
    <div className="relative">
      {/* Equipped Trinket Slots */}
      <div className="flex gap-2">
        {Array.from({ length: maxSlots }).map((_, i) => {
          const trinket = equippedTrinkets[i];
          const slotColor = trinket ? RARITY_COLORS[trinket.rarity] : '#4b5563';
          
          return (
            <button
              key={i}
              onClick={() => setShowSelector(!showSelector)}
              className="w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all hover:scale-105"
              style={{ 
                borderColor: slotColor,
                backgroundColor: `${slotColor}20`,
                boxShadow: trinket ? `0 0 10px ${slotColor}50` : 'none',
              }}
              title={trinket ? `${trinket.name}: ${trinket.description}` : 'Empty slot - click to equip'}
            >
              {trinket ? (
                <Image
                  src={trinket.image}
                  alt={trinket.name}
                  width={36}
                  height={36}
                  className="object-contain"
                />
              ) : (
                <span className="text-gray-500 text-xl">+</span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Active Bonuses Tooltip */}
      {hasActiveBonuses && (
        <div className="absolute top-full left-0 mt-1 text-[10px] text-green-400 whitespace-nowrap">
          {bonuses.moneyBonus > 0 && <span className="mr-2">💰+{(bonuses.moneyBonus * 100).toFixed(0)}%</span>}
          {bonuses.rockDamageBonus > 0 && <span className="mr-2">⛏️+{(bonuses.rockDamageBonus * 100).toFixed(0)}%</span>}
          {bonuses.couponBonus > 0 && <span className="mr-2">🎟️+{(bonuses.couponBonus * 100).toFixed(0)}%</span>}
        </div>
      )}
      
      {/* Backdrop to close on click outside */}
      {showSelector && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSelector(false)}
        />
      )}
      
      {/* Trinket Selector Dropdown */}
      {showSelector && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 rounded-xl p-3 border border-gray-600 shadow-xl z-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-bold text-sm">Your Trinkets</h4>
            <button 
              onClick={() => setShowSelector(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          {ownedTrinkets.length === 0 ? (
            <p className="text-gray-500 text-xs">No trinkets owned. Buy some from the shop!</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto scrollable-touch">
              {ownedTrinkets.map(trinket => {
                const isEquipped = gameState.equippedTrinketIds.includes(trinket.id);
                const rarityColor = RARITY_COLORS[trinket.rarity];
                
                return (
                  <div
                    key={trinket.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      if (isEquipped) {
                        unequipTrinket(trinket.id);
                      } else {
                        equipTrinket(trinket.id);
                      }
                    }}
                  >
                    <Image
                      src={trinket.image}
                      alt={trinket.name}
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: rarityColor }}>
                        {trinket.name}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {trinket.description}
                      </p>
                    </div>
                    {isEquipped && (
                      <span className="text-green-400 text-xs">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

