'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';
import { TRINKETS, RARITY_COLORS, Trinket, RELIC_MULTIPLIERS, TALISMAN_MULTIPLIERS } from '@/types/game';

export default function TrinketSlot() {
  const [showSelector, setShowSelector] = useState(false);
  const [showBonusDetails, setShowBonusDetails] = useState(false);
  const [now, setNow] = useState(Date.now());
  const { 
    gameState, 
    getEquippedTrinkets, 
    equipTrinket, 
    unequipTrinket, 
    canEquipDualTrinkets,
    canEquipTripleTrinkets,
    getTotalBonuses,
    getActiveBuffs,
    isWizardRitualActive,
    currentPickaxe,
    ownsRelic,
    ownsTalisman,
    wanderingTraderPermBuffs,
  } = useGame();
  
  // Update time every second for buff timers
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  const equippedTrinkets = getEquippedTrinkets();
  
  // Build list of all equippable items: trinkets, relics, and talismans
  type EquippableItem = {
    id: string;
    baseTrinket: Trinket;
    type: 'trinket' | 'relic' | 'talisman';
    multiplier: number;
  };
  
  const equippableItems: EquippableItem[] = [];
  
  // Add regular trinkets
  for (const id of gameState.ownedTrinketIds) {
    const trinket = TRINKETS.find(t => t.id === id);
    if (trinket) {
      equippableItems.push({ id, baseTrinket: trinket, type: 'trinket', multiplier: 1 });
    }
  }
  
  // Add relics (Light path conversions)
  for (const relicId of (gameState.ownedRelicIds || [])) {
    const baseTrinketId = relicId.replace('_relic', '');
    const trinket = TRINKETS.find(t => t.id === baseTrinketId);
    if (trinket) {
      equippableItems.push({ 
        id: relicId, 
        baseTrinket: trinket, 
        type: 'relic', 
        multiplier: RELIC_MULTIPLIERS[trinket.rarity] 
      });
    }
  }
  
  // Add talismans (Dark path conversions)
  for (const talismanId of (gameState.ownedTalismanIds || [])) {
    const baseTrinketId = talismanId.replace('_talisman', '');
    const trinket = TRINKETS.find(t => t.id === baseTrinketId);
    if (trinket) {
      equippableItems.push({ 
        id: talismanId, 
        baseTrinket: trinket, 
        type: 'talisman', 
        multiplier: TALISMAN_MULTIPLIERS[trinket.rarity] 
      });
    }
  }
  
  const maxSlots = canEquipTripleTrinkets() ? 3 : canEquipDualTrinkets() ? 2 : 1;
  const bonuses = getTotalBonuses();
  
  // Check if any bonuses are active
  const hasActiveBonuses = Object.values(bonuses).some(v => v > 0);
  
  // Check for active sacrifice buff
  const hasActiveSacrificeBuff = gameState.sacrificeBuff && now < gameState.sacrificeBuff.endsAt;
  const sacrificeTimeRemaining = hasActiveSacrificeBuff ? Math.ceil((gameState.sacrificeBuff!.endsAt - now) / 1000) : 0;

  // Check for active factory buffs
  const activeBuffs = getActiveBuffs();
  const hasActiveFactoryBuffs = activeBuffs.length > 0;

  // Check for wizard ritual
  const wizardRitualActive = isWizardRitualActive();
  const wizardTimeRemaining = wizardRitualActive && gameState.buildings.wizard_tower.ritualEndTime 
    ? Math.ceil((gameState.buildings.wizard_tower.ritualEndTime - now) / 1000) : 0;

  return (
    <div className="relative">
      {/* Equipped Trinket Slots */}
      <div className="flex gap-2">
        {Array.from({ length: maxSlots }).map((_, i) => {
          const equippedId = gameState.equippedTrinketIds[i];
          const equippedItem = equippableItems.find(item => item.id === equippedId);
          const trinket = equippedItem?.baseTrinket;
          const slotColor = trinket ? RARITY_COLORS[trinket.rarity] : '#4b5563';
          
          // Visual distinction for relics (golden) and talismans (dark cosmic)
          const isRelic = equippedItem?.type === 'relic';
          const isTalisman = equippedItem?.type === 'talisman';
          const glowColor = isRelic 
            ? '#fbbf24' // Golden glow for relics
            : isTalisman 
              ? '#a855f7' // Purple cosmic glow for talismans
              : slotColor;
          const extraGlow = isRelic 
            ? '0 0 15px #fbbf2480, 0 0 25px #fbbf2440' 
            : isTalisman 
              ? '0 0 15px #a855f780, 0 0 25px #7c3aed40' 
              : '';
          
          return (
            <button
              key={i}
              onClick={() => setShowSelector(!showSelector)}
              className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all hover:scale-105 relative ${
                isRelic ? 'animate-pulse' : isTalisman ? 'animate-pulse' : ''
              }`}
              style={{ 
                borderColor: isRelic ? '#fbbf24' : isTalisman ? '#a855f7' : slotColor,
                backgroundColor: isRelic 
                  ? 'rgba(251, 191, 36, 0.15)' 
                  : isTalisman 
                    ? 'rgba(168, 85, 247, 0.15)' 
                    : `${slotColor}20`,
                boxShadow: trinket 
                  ? `0 0 10px ${glowColor}50${extraGlow ? ', ' + extraGlow : ''}` 
                  : 'none',
              }}
              title={trinket 
                ? `${trinket.name}${isRelic ? ' (Relic)' : isTalisman ? ' (Talisman)' : ''}: ${trinket.description}${equippedItem && equippedItem.multiplier > 1 ? ` (${equippedItem.multiplier}x)` : ''}` 
                : 'Empty slot - click to equip'}
            >
              {trinket ? (
                <>
                  <Image
                    src={trinket.image}
                    alt={trinket.name}
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                  {/* Type indicator */}
                  {isRelic && (
                    <span className="absolute -top-1 -right-1 text-[10px] text-yellow-400">✦</span>
                  )}
                  {isTalisman && (
                    <span className="absolute -top-1 -right-1 text-[10px] text-purple-400">✧</span>
                  )}
                </>
              ) : (
                <span className="text-gray-500 text-xl">+</span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Active Bonuses Summary (Compact view below trinkets) */}
      {hasActiveBonuses && (
        <div 
          className="absolute top-full left-0 mt-1 cursor-pointer max-w-[120px] sm:max-w-none"
          onClick={() => setShowBonusDetails(!showBonusDetails)}
        >
          {/* Mobile: Ultra compact single row with just icons and total bonus */}
          <div className="sm:hidden flex items-center gap-0.5 text-[9px] bg-black/60 rounded px-1 py-0.5">
            {bonuses.moneyBonus > 0 && <span className="text-green-400">💰</span>}
            {bonuses.rockDamageBonus > 0 && <span className="text-orange-400">⛏️</span>}
            {bonuses.minerDamageBonus > 0 && <span className="text-yellow-400">👷</span>}
            {bonuses.couponBonus > 0 && <span className="text-purple-400">🎟️</span>}
            <span className="text-gray-300 text-[8px]">tap</span>
          </div>
          
          {/* Desktop: Full bonus display */}
          <div className="hidden sm:flex flex-wrap gap-1 text-[10px] whitespace-nowrap">
            {bonuses.moneyBonus > 0 && (
              <span className="bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded">
                💰+{(bonuses.moneyBonus * 100).toFixed(0)}%
              </span>
            )}
            {bonuses.rockDamageBonus > 0 && (
              <span className="bg-orange-900/50 text-orange-400 px-1.5 py-0.5 rounded">
                ⛏️+{(bonuses.rockDamageBonus * 100).toFixed(0)}%
              </span>
            )}
            {bonuses.minerDamageBonus > 0 && (
              <span className="bg-yellow-900/50 text-yellow-400 px-1.5 py-0.5 rounded">
                👷+{(bonuses.minerDamageBonus * 100).toFixed(0)}%
              </span>
            )}
            {bonuses.couponBonus > 0 && (
              <span className="bg-purple-900/50 text-purple-400 px-1.5 py-0.5 rounded">
                🎟️+{(bonuses.couponBonus * 100).toFixed(0)}%
              </span>
            )}
          </div>
          
          {/* Path indicator - more compact on mobile */}
          {gameState.chosenPath && (
            <div className={`mt-0.5 sm:mt-1 text-[8px] sm:text-[9px] font-bold ${
              gameState.chosenPath === 'light' ? 'text-yellow-400' : 'text-purple-400'
            }`}>
              {gameState.chosenPath === 'light' ? '☀️' : '🌑'}<span className="hidden sm:inline"> {gameState.chosenPath === 'light' ? 'Light Path' : 'Darkness Path'}</span>
            </div>
          )}
          
          {/* Cookie status - hidden on mobile */}
          {gameState.chosenPath === 'darkness' && !gameState.goldenCookieRitualActive && (
            <div className="text-[9px] text-gray-500 hidden sm:block">
              🟣 Do ritual for Dark Cookies
            </div>
          )}
          
          {/* Pickaxe Passive Bonuses - hidden on mobile */}
          {currentPickaxe && (currentPickaxe.moneyMultiplier || currentPickaxe.couponLuckBonus) && (
            <div className="mt-0.5 text-[8px] text-gray-400 hidden sm:block">
              {currentPickaxe.moneyMultiplier && currentPickaxe.moneyMultiplier > 1 && (
                <span className="text-green-400">💰+{Math.round((currentPickaxe.moneyMultiplier - 1) * 100)}% money </span>
              )}
              {currentPickaxe.couponLuckBonus && currentPickaxe.couponLuckBonus > 0 && (
                <span className="text-purple-400">🎟️+{Math.round(currentPickaxe.couponLuckBonus * 100)}% luck</span>
              )}
            </div>
          )}
          
          {/* Active Buffs with detailed descriptions - more compact on mobile */}
          <div className="mt-0.5 flex flex-wrap gap-0.5 sm:gap-1">
            {/* Sacrifice Buff - show actual effect */}
            {hasActiveSacrificeBuff && gameState.sacrificeBuff && (
              <span className="text-[8px] sm:text-[9px] text-red-400 animate-pulse bg-black/60 px-1 rounded" title="Sacrifice buff active">
                🩸<span className="hidden sm:inline">{gameState.sacrificeBuff.allBonus > 0 
                  ? `+${Math.round(gameState.sacrificeBuff.allBonus * 100)}% all` 
                  : `+${Math.round(gameState.sacrificeBuff.moneyBonus * 100)}% money`
                }</span> {sacrificeTimeRemaining}s
              </span>
            )}
            
            {/* Wizard Ritual - show what it does */}
            {wizardRitualActive && (
              <span className="text-[8px] sm:text-[9px] text-purple-400 animate-pulse bg-black/60 px-1 rounded" title="Wizard Ritual: 3x all stats">
                🔮<span className="hidden sm:inline">3x all</span> {wizardTimeRemaining}s
              </span>
            )}
            
            {/* Factory Buffs - icons only on mobile */}
            {activeBuffs.map(buff => {
              const timeLeft = Math.ceil((buff.startTime + buff.duration - now) / 1000);
              if (timeLeft <= 0) return null;
              const buffInfoMap: Record<string, { icon: string; label: string }> = {
                damage: { icon: '⚔️', label: 'damage' },
                money: { icon: '💰', label: 'money' },
                clickSpeed: { icon: '⚡', label: 'speed' },
                miner: { icon: '👷', label: 'miners' },
                allStats: { icon: '✨', label: 'all stats' },
                goldenCookie: { icon: '🍪', label: 'cookie' },
                minerSpeed: { icon: '🏃', label: 'miner speed' },
                minerDamage: { icon: '💪', label: 'miner damage' },
              };
              const buffInfo = buffInfoMap[buff.type] || { icon: '🏭', label: buff.type };
              return (
                <span key={buff.id} className="text-[8px] sm:text-[9px] text-amber-400 bg-black/60 px-1 rounded" title={`Factory buff: +${Math.round(buff.multiplier * 100)}% ${buffInfo.label}`}>
                  {buffInfo.icon}<span className="hidden sm:inline">+{Math.round(buff.multiplier * 100)}% {buffInfo.label}</span> {timeLeft}s
                </span>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Detailed Bonus Breakdown Popup - high z-index to render above TrinketShopModal */}
      {showBonusDetails && hasActiveBonuses && (
        <>
          <div 
            className="fixed inset-0 z-[170]" 
            onClick={() => setShowBonusDetails(false)}
          />
          <div className="fixed top-20 left-4 w-56 bg-gray-900/95 backdrop-blur rounded-xl p-3 border border-gray-600 shadow-xl z-[180]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-bold text-xs">Total Bonuses</h4>
              <button 
                onClick={() => setShowBonusDetails(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 text-[10px]">
              {bonuses.moneyBonus > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>💰 Money</span>
                  <span>+{(bonuses.moneyBonus * 100).toFixed(0)}%</span>
                </div>
              )}
              {bonuses.rockDamageBonus > 0 && (
                <div className="flex justify-between text-orange-400">
                  <span>⛏️ Pickaxe Damage</span>
                  <span>+{(bonuses.rockDamageBonus * 100).toFixed(0)}%</span>
                </div>
              )}
              {bonuses.clickSpeedBonus > 0 && (
                <div className="flex justify-between text-blue-400">
                  <span>👆 Click Speed</span>
                  <span>+{(bonuses.clickSpeedBonus * 100).toFixed(0)}%</span>
                </div>
              )}
              {bonuses.couponBonus > 0 && (
                <div className="flex justify-between text-purple-400">
                  <span>🎟️ Coupon Luck</span>
                  <span>+{(bonuses.couponBonus * 100).toFixed(0)}%</span>
                </div>
              )}
              {bonuses.minerSpeedBonus > 0 && (
                <div className="flex justify-between text-cyan-400">
                  <span>🏃 Miner Speed</span>
                  <span>+{(bonuses.minerSpeedBonus * 100).toFixed(0)}%</span>
                </div>
              )}
              {bonuses.minerDamageBonus > 0 && (
                <div className="flex justify-between text-yellow-400">
                  <span>👷 Miner Damage</span>
                  <span>+{(bonuses.minerDamageBonus * 100).toFixed(0)}%</span>
                </div>
              )}
              
              {/* Sources breakdown */}
              <div className="border-t border-gray-700 pt-1.5 mt-2">
                <p className="text-gray-500 text-[9px] mb-1">Sources:</p>
                <div className="space-y-0.5 text-gray-400">
                  {equippedTrinkets.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span>💎</span>
                      <span>{equippedTrinkets.length} Trinket{equippedTrinkets.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {gameState.ownedPrestigeUpgradeIds.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span>🌟</span>
                      <span>{gameState.ownedPrestigeUpgradeIds.length} Prestige Upgrade{gameState.ownedPrestigeUpgradeIds.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {(gameState.equippedTitleIds?.length || 0) > 0 && (
                    <div className="flex items-center gap-1">
                      <span>👑</span>
                      <span>{gameState.equippedTitleIds?.length} Title{(gameState.equippedTitleIds?.length || 0) > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {gameState.chosenPath === 'light' && (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <span>☀️</span>
                      <span>Light Path (+50% trinkets, +30% money)</span>
                    </div>
                  )}
                  {/* Buildings */}
                  {(gameState.buildings.temple.equippedRank ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-amber-400">
                      <span>🏛️</span>
                      <span>Temple Rank {gameState.buildings.temple.equippedRank}</span>
                    </div>
                  )}
                  {wizardRitualActive && (
                    <div className="flex items-center gap-1 text-purple-400">
                      <span>🧙</span>
                      <span>Wizard Ritual ({wizardTimeRemaining}s)</span>
                    </div>
                  )}
                  {hasActiveFactoryBuffs && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <span>🏭</span>
                      <span>{activeBuffs.length} Factory Buff{activeBuffs.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {/* Wandering Trader permanent buffs */}
                  {(wanderingTraderPermBuffs.moneyBonus > 0 || wanderingTraderPermBuffs.couponLuckBonus > 0 || 
                    wanderingTraderPermBuffs.minerSpeedBonus > 0 || wanderingTraderPermBuffs.minerDamageBonus > 0) && (
                    <div className="flex items-center gap-1 text-emerald-400">
                      <span>🧳</span>
                      <span>Wandering Trader Buffs</span>
                    </div>
                  )}
                  {/* Premium Products */}
                  {gameState.ownedPremiumProductIds.length > 0 && (
                    <div className="flex items-center gap-1 text-pink-400">
                      <span>💎</span>
                      <span>{gameState.ownedPremiumProductIds.length} Premium Product{gameState.ownedPremiumProductIds.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {hasActiveSacrificeBuff && (
                    <div className="flex items-center gap-1 text-red-400">
                      <span>🔥</span>
                      <span>Sacrifice Buff ({sacrificeTimeRemaining}s left)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Backdrop to close on click outside */}
      {showSelector && (
        <div 
          className="fixed inset-0 z-[70]" 
          onClick={() => setShowSelector(false)}
        />
      )}
      
      {/* Trinket Selector Dropdown */}
      {showSelector && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-gray-900 rounded-xl p-3 border border-gray-600 shadow-xl z-[80]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-bold text-sm">Your Trinkets</h4>
            <button 
              onClick={() => setShowSelector(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          {equippableItems.length === 0 ? (
            <p className="text-gray-500 text-xs">No trinkets owned. Buy some from the shop!</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto scrollable-touch">
              {equippableItems.map(item => {
                const isEquipped = gameState.equippedTrinketIds.includes(item.id);
                const rarityColor = RARITY_COLORS[item.baseTrinket.rarity];
                const isRelic = item.type === 'relic';
                const isTalisman = item.type === 'talisman';
                
                // Visual styling based on type
                const bgGradient = isRelic 
                  ? 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, transparent 50%)'
                  : isTalisman 
                    ? 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, transparent 50%)'
                    : undefined;
                const borderColor = isRelic 
                  ? '#fbbf2450' 
                  : isTalisman 
                    ? '#a855f750' 
                    : 'transparent';
                
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 cursor-pointer border ${
                      isEquipped ? 'bg-gray-800' : ''
                    }`}
                    style={{ 
                      background: bgGradient,
                      borderColor: borderColor,
                    }}
                    onClick={() => {
                      if (isEquipped) {
                        unequipTrinket(item.id);
                      } else {
                        equipTrinket(item.id);
                      }
                    }}
                  >
                    <div className="relative">
                      <Image
                        src={item.baseTrinket.image}
                        alt={item.baseTrinket.name}
                        width={28}
                        height={28}
                        className={`object-contain ${isRelic ? 'drop-shadow-[0_0_4px_#fbbf24]' : isTalisman ? 'drop-shadow-[0_0_4px_#a855f7]' : ''}`}
                      />
                      {isRelic && (
                        <span className="absolute -top-1 -right-1 text-[8px] text-yellow-400">✦</span>
                      )}
                      {isTalisman && (
                        <span className="absolute -top-1 -right-1 text-[8px] text-purple-400">✧</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium truncate" style={{ color: isRelic ? '#fbbf24' : isTalisman ? '#a855f7' : rarityColor }}>
                          {item.baseTrinket.name}
                        </p>
                        {isRelic && (
                          <span className="text-[9px] text-yellow-400 bg-yellow-900/30 px-1 rounded">Relic</span>
                        )}
                        {isTalisman && (
                          <span className="text-[9px] text-purple-400 bg-purple-900/30 px-1 rounded">Talisman</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">
                        {item.baseTrinket.description}
                        {item.multiplier > 1 && (
                          <span className={`ml-1 ${isRelic ? 'text-yellow-400' : 'text-purple-400'}`}>
                            ({item.multiplier}x)
                          </span>
                        )}
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
