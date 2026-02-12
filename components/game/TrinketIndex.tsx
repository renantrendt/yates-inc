'use client';

import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { TRINKETS, RARITY_COLORS, TrinketRarity } from '@/types/game';
import Image from 'next/image';

interface TrinketIndexProps {
  isOpen: boolean;
  onClose: () => void;
}

const RARITY_ORDER: TrinketRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic', 'secret'];

export default function TrinketIndex({ isOpen, onClose }: TrinketIndexProps) {
  const { gameState } = useGame();
  const [selectedRarity, setSelectedRarity] = useState<TrinketRarity | 'all'>('all');

  const groupedTrinkets = useMemo(() => {
    const rarities = selectedRarity === 'all' ? RARITY_ORDER : [selectedRarity];
    return rarities.map(rarity => ({
      rarity,
      trinkets: TRINKETS.filter(t => t.rarity === rarity),
    }));
  }, [selectedRarity]);

  const ownedCount = gameState.ownedTrinketIds.length;
  const totalCount = TRINKETS.length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 z-[150]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-gray-900 rounded-lg shadow-2xl z-[160] max-h-[90vh] overflow-hidden border-2 border-purple-500 mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-4 sm:p-6 border-b-2 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">💎 Trinket Collection</h2>
              <p className="text-purple-200 text-sm">
                Collected: <span className="font-bold text-yellow-300">{ownedCount}/{totalCount}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-400 text-4xl font-bold transition-colors"
            >
              ×
            </button>
          </div>

          {/* Rarity Filter Buttons */}
          <div className="flex gap-1.5 sm:gap-2 mt-4 overflow-x-auto scrollable-touch pb-1">
            {([
              { value: 'all' as const, label: 'All' },
              ...RARITY_ORDER.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) })),
            ]).map(({ value, label }) => {
              const isActive = selectedRarity === value;
              const color = value === 'all' ? '#a78bfa' : RARITY_COLORS[value];
              return (
                <button
                  key={value}
                  onClick={() => setSelectedRarity(value)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-all shrink-0 ${
                    isActive ? 'ring-2 ring-white/50' : 'opacity-50 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isActive ? `${color}40` : `${color}15`,
                    color: color,
                    border: `1.5px solid ${isActive ? color : `${color}40`}`,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Trinket Grid — grouped by rarity */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {groupedTrinkets.map(({ rarity, trinkets }) => {
            const rarityColor = RARITY_COLORS[rarity];
            const ownedInRarity = trinkets.filter(t => gameState.ownedTrinketIds.includes(t.id)).length;

            return (
              <div key={rarity} className="mb-6 last:mb-0">
                {/* Rarity Header */}
                <div className="flex items-center gap-3 mb-3">
                  <h3
                    className="text-sm sm:text-base font-bold uppercase tracking-wider"
                    style={{ color: rarityColor }}
                  >
                    {rarity}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {ownedInRarity}/{trinkets.length}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: `${rarityColor}30` }} />
                </div>

                {/* Trinket Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {trinkets.map((trinket) => {
                    const isOwned = gameState.ownedTrinketIds.includes(trinket.id);
                    const isEquipped = gameState.equippedTrinketIds.includes(trinket.id);

                    return (
                      <div
                        key={trinket.id}
                        className={`relative bg-gray-800 rounded-lg p-3 border-2 transition-all ${
                          isOwned
                            ? 'opacity-100'
                            : 'border-gray-600 opacity-40 grayscale'
                        }`}
                        style={{
                          borderColor: isOwned ? rarityColor : undefined,
                        }}
                      >
                        {/* Equipped Badge */}
                        {isEquipped && (
                          <div className="absolute top-1.5 right-1.5 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                            EQUIPPED
                          </div>
                        )}

                        {/* Trinket Image */}
                        <div className="relative w-full aspect-square mb-2">
                          <Image
                            src={trinket.image}
                            alt={trinket.name}
                            fill
                            className="object-contain"
                          />
                        </div>

                        {/* Trinket Name */}
                        <h3
                          className="text-center font-bold text-sm mb-1"
                          style={{ color: rarityColor }}
                        >
                          {trinket.name}
                        </h3>

                        {/* Description */}
                        <p className="text-center text-[10px] text-gray-400 mb-2">
                          {trinket.description}
                        </p>

                        {/* Status */}
                        <div className="text-center">
                          {isOwned ? (
                            <span className="text-green-400 text-xs font-bold">✓ OWNED</span>
                          ) : (
                            <span className="text-gray-500 text-xs">✗ Not owned</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
