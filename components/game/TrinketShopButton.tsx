'use client';

import React, { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import TrinketShopModal from './TrinketShopModal';
import { RARITY_COLORS } from '@/types/game';

interface TrinketShopButtonProps {
  hidden?: boolean;
}

export default function TrinketShopButton({ hidden = false }: TrinketShopButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { trinketShopItems, getTrinketShopTimeLeft, yatesTotemSpawned } = useGame();
  
  // Update timer every second
  useEffect(() => {
    setTimeLeft(getTrinketShopTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(getTrinketShopTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, [getTrinketShopTimeLeft]);
  
  // Don't render if hidden (e.g., when trinket index is open)
  if (hidden) return null;
  
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  
  // Get rarest trinket in shop for button color
  const rarityOrder = ['secret', 'mythic', 'legendary', 'epic', 'rare', 'common'];
  const rarestTrinket = trinketShopItems.sort((a, b) => 
    rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
  )[0];
  const buttonColor = rarestTrinket ? RARITY_COLORS[rarestTrinket.rarity] : '#9ca3af';

  return (
    <>
      {/* Yates Totem Warning */}
      {yatesTotemSpawned && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-pulse">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg border-2 border-red-400">
            <p className="font-bold text-lg">⚠️ Hurry up! A trinket directly from the USY has fallen! Go buy it! ⚠️</p>
          </div>
        </div>
      )}
      
      {/* Trinket Shop Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-30 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ 
          backgroundColor: buttonColor,
          boxShadow: `0 0 20px ${buttonColor}50`,
        }}
      >
        <span className="text-2xl">💎</span>
        <div className="text-left text-white">
          <p className="font-bold text-sm">Trinket Shop</p>
          <p className="text-xs opacity-80">
            {trinketShopItems.length} items • {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
        </div>
      </button>
      
      <TrinketShopModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

