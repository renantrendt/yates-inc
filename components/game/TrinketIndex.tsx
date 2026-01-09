'use client';

import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { TRINKETS, RARITY_COLORS, TrinketRarity } from '@/types/game';
import Image from 'next/image';

interface TrinketIndexProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrinketIndex({ isOpen, onClose }: TrinketIndexProps) {
  const { gameState } = useGame();
  const [selectedRarity, setSelectedRarity] = useState<TrinketRarity | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'rarity'>('rarity');

  const filteredAndSortedTrinkets = useMemo(() => {
    let filtered = TRINKETS;

    // Filter by rarity
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(t => t.rarity === selectedRarity);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cost':
          return a.cost - b.cost;
        case 'rarity':
          const rarityOrder: TrinketRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic', 'secret'];
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        default:
          return 0;
      }
    });

    return sorted;
  }, [selectedRarity, sortBy]);

  const ownedCount = gameState.ownedTrinketIds.length;
  const totalCount = TRINKETS.length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 z-[90]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-gray-900 rounded-lg shadow-2xl z-[100] max-h-[90vh] overflow-hidden border-2 border-purple-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-6 border-b-2 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">💎 Trinket Collection</h2>
              <p className="text-purple-200">
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

          {/* Filters */}
          <div className="flex gap-4 mt-4 flex-wrap">
            {/* Rarity Filter */}
            <div>
              <label className="text-sm text-purple-200 mb-1 block">Rarity:</label>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value as TrinketRarity | 'all')}
                className="bg-gray-800 text-white px-3 py-2 rounded border border-purple-500"
              >
                <option value="all">All</option>
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
                <option value="mythic">Mythic</option>
                <option value="secret">Secret</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-sm text-purple-200 mb-1 block">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'cost' | 'rarity')}
                className="bg-gray-800 text-white px-3 py-2 rounded border border-purple-500"
              >
                <option value="rarity">Rarity</option>
                <option value="name">Name</option>
                <option value="cost">Cost</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trinket Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredAndSortedTrinkets.map((trinket) => {
              const isOwned = gameState.ownedTrinketIds.includes(trinket.id);
              const isEquipped = gameState.equippedTrinketIds.includes(trinket.id);
              const rarityColor = RARITY_COLORS[trinket.rarity];

              return (
                <div
                  key={trinket.id}
                  className={`relative bg-gray-800 rounded-lg p-4 border-2 transition-all ${
                    isOwned
                      ? 'border-green-500 opacity-100'
                      : 'border-gray-600 opacity-50 grayscale'
                  }`}
                  style={{
                    borderColor: isOwned ? rarityColor : undefined,
                  }}
                >
                  {/* Equipped Badge */}
                  {isEquipped && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                      EQUIPPED
                    </div>
                  )}

                  {/* Trinket Image */}
                  <div className="relative w-full aspect-square mb-3">
                    <Image
                      src={trinket.image}
                      alt={trinket.name}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* Trinket Name */}
                  <h3
                    className="text-center font-bold mb-1"
                    style={{ color: rarityColor }}
                  >
                    {trinket.name}
                  </h3>

                  {/* Rarity */}
                  <p className="text-center text-xs text-gray-400 uppercase mb-2">
                    {trinket.rarity}
                  </p>

                  {/* Cost */}
                  <p className="text-center text-yellow-300 text-sm mb-2">
                    ${trinket.cost.toLocaleString()}
                  </p>

                  {/* Description */}
                  <p className="text-center text-xs text-gray-300 mb-2">
                    {trinket.description}
                  </p>

                  {/* Status */}
                  <div className="text-center">
                    {isOwned ? (
                      <span className="text-green-400 text-xs font-bold">✓ OWNED</span>
                    ) : (
                      <span className="text-red-400 text-xs font-bold">✗ NOT OWNED</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAndSortedTrinkets.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              No trinkets found with the selected filters.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
