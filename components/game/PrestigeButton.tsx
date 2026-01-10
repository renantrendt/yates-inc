'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '@/contexts/GameContext';
import { useBudget } from '@/contexts/BudgetContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { PRESTIGE_REQUIREMENTS } from '@/types/game';

export default function PrestigeButton() {
  const { gameState, canPrestige, prestige } = useGame();
  const { addToActiveBudget } = useBudget();
  const { employee } = useAuth();
  const { client } = useClient();
  
  // Get player name
  const playerName = employee?.name || client?.username || 'Unknown Player';
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPrestiging, setIsPrestiging] = useState(false);
  const [mounted, setMounted] = useState(false);

  // For portal - need to wait for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!canPrestige()) return null;

  const formatMoney = (amount: number): string => {
    if (amount >= 1000000000000) return `$${(amount / 1000000000000).toFixed(2)}T`;
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const nextMultiplier = 1.0 + ((gameState.prestigeCount + 1) * 0.1);
  const contributionAmount = Math.floor(gameState.yatesDollars / 32);

  const handlePrestige = async () => {
    setIsPrestiging(true);
    
    const result = prestige();
    
    if (result && result.amountToCompany > 0) {
      // Add contribution to active budget (money in circulation)
      await addToActiveBudget(
        result.amountToCompany,
        `Prestige contribution from ${playerName}`,
        'prestige'
      );
    }
    
    setIsPrestiging(false);
    setShowConfirm(false);
  };

  // Modal content - rendered via portal to escape stacking context
  const modalContent = showConfirm && mounted ? createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/70 z-[9998]"
        onClick={() => setShowConfirm(false)}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-xl p-6 z-[9999] w-[400px] max-w-[90vw] shadow-2xl border border-purple-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Ready to Prestige?
          </h2>
          <p className="text-gray-300 mb-4">
            This will reset your rocks and pickaxes!
          </p>
        </div>

        <div className="space-y-3 mb-6 bg-black/30 rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Current Multiplier:</span>
            <span className="text-yellow-400 font-bold">
              {gameState.prestigeMultiplier.toFixed(1)}x
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">New Multiplier:</span>
            <span className="text-green-400 font-bold">
              {nextMultiplier.toFixed(1)}x 🎉
            </span>
          </div>
          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current Money:</span>
              <span className="text-yellow-400">
                {formatMoney(gameState.yatesDollars)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">To Company Budget:</span>
              <span className="text-emerald-400">
                {formatMoney(contributionAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-400 mb-4 text-center">
          <p>✅ Keeps: Coupons, Autoclicker, Cutscene</p>
          <p>❌ Resets: Rocks, Pickaxes, Clicks, Money</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrestige}
            disabled={isPrestiging}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
          >
            {isPrestiging ? 'Prestiging...' : 'PRESTIGE!'}
          </button>
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="relative bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all animate-pulse"
      >
        <span className="flex items-center gap-2">
          🌟 PRESTIGE {gameState.prestigeCount + 1}
        </span>
        <span className="block text-xs opacity-80">
          Get {nextMultiplier.toFixed(1)}x multiplier
        </span>
      </button>

      {/* Modal rendered via portal to document.body */}
      {modalContent}
    </>
  );
}
