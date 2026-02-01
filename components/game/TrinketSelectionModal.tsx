'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';
import { TRINKETS, RARITY_COLORS } from '@/types/game';

interface TrinketSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCount: number;
  onConfirm: (selectedTrinketIds: string[]) => void;
}

export default function TrinketSelectionModal({ 
  isOpen, 
  onClose, 
  requiredCount, 
  onConfirm 
}: TrinketSelectionModalProps) {
  const { gameState } = useGame();
  const [mounted, setMounted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
    }
  }, [isOpen]);

  // Get owned trinkets (excluding equipped and already as relics/talismans)
  const availableTrinkets = TRINKETS.filter(t => {
    const isOwned = gameState.ownedTrinketIds.includes(t.id);
    const isRelic = gameState.ownedRelicIds.includes(t.id);
    const isTalisman = gameState.ownedTalismanIds.includes(t.id);
    // Can give away equipped trinkets too
    return isOwned && !isRelic && !isTalisman;
  });

  const handleToggleTrinket = (trinketId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(trinketId)) {
        return prev.filter(id => id !== trinketId);
      }
      if (prev.length >= requiredCount) {
        // Replace oldest selection
        return [...prev.slice(1), trinketId];
      }
      return [...prev, trinketId];
    });
  };

  const handleConfirm = () => {
    if (selectedIds.length === requiredCount) {
      onConfirm(selectedIds);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl border-2 border-purple-500/50 shadow-2xl max-w-xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/80 to-gray-900/80 px-6 py-4 border-b border-purple-500/30">
          <h2 className="text-xl font-bold text-purple-200">Select {requiredCount} Trinket{requiredCount > 1 ? 's' : ''}</h2>
          <p className="text-purple-400 text-sm">
            Selected: {selectedIds.length}/{requiredCount}
          </p>
        </div>

        {/* Trinket Grid */}
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          {availableTrinkets.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <span className="text-4xl">😢</span>
              <p className="mt-2">You don&apos;t have enough trinkets!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {availableTrinkets.map(trinket => {
                const isSelected = selectedIds.includes(trinket.id);
                const isEquipped = gameState.equippedTrinketIds.includes(trinket.id);
                
                return (
                  <button
                    key={trinket.id}
                    onClick={() => handleToggleTrinket(trinket.id)}
                    className={`relative p-2 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-purple-400 bg-purple-500/20 scale-105' 
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                  >
                    {/* Trinket image */}
                    <div className="relative w-12 h-12 mx-auto">
                      <Image
                        src={trinket.image}
                        alt={trinket.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    
                    {/* Trinket name */}
                    <p 
                      className="text-xs font-medium mt-1 text-center truncate"
                      style={{ color: RARITY_COLORS[trinket.rarity] }}
                    >
                      {trinket.name}
                    </p>
                    
                    {/* Equipped badge */}
                    {isEquipped && (
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[8px] font-bold px-1 rounded-bl rounded-tr">
                        EQUIPPED
                      </div>
                    )}
                    
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="px-6 py-3 bg-red-900/20 border-t border-red-500/30">
          <p className="text-red-400 text-sm text-center">
            ⚠️ Warning: You will LOSE these trinkets permanently!
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIds.length !== requiredCount}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              selectedIds.length === requiredCount
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Confirm Trade
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
