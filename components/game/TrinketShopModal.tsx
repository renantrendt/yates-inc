'use client';

import React from 'react';
import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';
import { RARITY_COLORS, Trinket } from '@/types/game';

interface TrinketShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatMoney(amount: number): string {
  if (amount >= 1000000000000) return `${(amount / 1000000000000).toFixed(1)}T`;
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toString();
}

function TrinketCard({ trinket, onBuy, owned, canAfford }: { 
  trinket: Trinket; 
  onBuy: () => void; 
  owned: boolean;
  canAfford: boolean;
}) {
  const rarityColor = RARITY_COLORS[trinket.rarity];
  
  return (
    <div 
      className="relative bg-gray-900/90 rounded-xl p-4 border-2 transition-all hover:scale-[1.02]"
      style={{ borderColor: rarityColor, boxShadow: `0 0 15px ${rarityColor}40` }}
    >
      {/* Rarity Badge */}
      <div 
        className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold uppercase"
        style={{ backgroundColor: rarityColor, color: 'white' }}
      >
        {trinket.rarity}
      </div>
      
      {/* Image */}
      <div className="w-24 h-24 mx-auto mb-3 relative">
        <Image
          src={trinket.image}
          alt={trinket.name}
          fill
          className="object-contain drop-shadow-lg"
        />
      </div>
      
      {/* Name */}
      <h3 className="text-white font-bold text-center mb-1" style={{ color: rarityColor }}>
        {trinket.name}
      </h3>
      
      {/* Description */}
      <p className="text-gray-400 text-xs text-center mb-3">
        {trinket.description}
      </p>
      
      {/* Price & Buy Button */}
      <div className="flex items-center justify-between">
        <span className="text-yellow-400 font-bold">
          ${formatMoney(trinket.cost)}
        </span>
        
        {owned ? (
          <span className="text-green-400 text-sm">✓ Owned</span>
        ) : (
          <button
            onClick={onBuy}
            disabled={!canAfford}
            className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all ${
              canAfford 
                ? 'bg-green-600 hover:bg-green-500 text-white' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Buy
          </button>
        )}
      </div>
    </div>
  );
}

export default function TrinketShopModal({ isOpen, onClose }: TrinketShopModalProps) {
  const { 
    trinketShopItems, 
    buyTrinket, 
    ownsTrinket, 
    gameState,
    getTrinketShopTimeLeft 
  } = useGame();
  
  if (!isOpen) return null;
  
  const timeLeft = getTrinketShopTimeLeft();
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto scrollable-touch border border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              💎 Trinket Shop
            </h2>
            <p className="text-gray-400 text-sm">
              Refreshes in {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-yellow-400 font-bold text-lg">
              ${formatMoney(gameState.yatesDollars)}
            </p>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>
        
        {/* Trinket Grid */}
        {trinketShopItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No trinkets available right now...</p>
            <p className="text-gray-500 text-sm">Check back when the shop refreshes!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trinketShopItems.map(trinket => (
              <TrinketCard
                key={trinket.id}
                trinket={trinket}
                onBuy={() => buyTrinket(trinket.id)}
                owned={ownsTrinket(trinket.id)}
                canAfford={gameState.yatesDollars >= trinket.cost}
              />
            ))}
          </div>
        )}
        
        {/* Owned Trinkets Section */}
        <div className="mt-6 pt-6 border-t border-gray-600">
          <h3 className="text-white font-bold mb-3">Your Trinkets ({gameState.ownedTrinketIds.length})</h3>
          {gameState.ownedTrinketIds.length === 0 ? (
            <p className="text-gray-500 text-sm">You don&apos;t own any trinkets yet.</p>
          ) : (
            <div className="max-h-40 overflow-y-auto scrollable-touch pr-2">
              <div className="flex flex-wrap gap-2">
                {gameState.ownedTrinketIds.map(id => {
                  const trinket = trinketShopItems.find(t => t.id === id);
                  // We need to check all trinkets, not just shop items
                  return (
                    <div
                      key={id}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ 
                        backgroundColor: trinket ? `${RARITY_COLORS[trinket.rarity]}30` : '#374151',
                        color: trinket ? RARITY_COLORS[trinket.rarity] : '#9ca3af',
                      }}
                    >
                      {id.replace(/_/g, ' ')}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

