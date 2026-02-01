'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '@/contexts/GameContext';
import { WanderingTraderOffer, TRINKETS } from '@/types/game';
import TrinketSelectionModal from './TrinketSelectionModal';
import RouletteWheel from './RouletteWheel';

interface WanderingTraderShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Format number with suffix
function formatNumber(num: number): string {
  if (num >= 1e18) return `${(num / 1e18).toFixed(1)}Qi`;
  if (num >= 1e15) return `${(num / 1e15).toFixed(1)}Q`;
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toFixed(0);
}

// Get cost display text
function getCostDisplay(offer: WanderingTraderOffer): string {
  switch (offer.cost.type) {
    case 'money':
      return `$${formatNumber(offer.cost.amount || 0)}`;
    case 'all_money':
      return '💀 ALL YOUR MONEY';
    case 'trinkets':
      return `🎁 ${offer.cost.trinketCount || 2} Trinkets`;
    case 'debuff':
      if (offer.cost.debuff) {
        const percent = Math.abs(offer.cost.debuff.value * 100).toFixed(0);
        const duration = (offer.cost.debuff.duration / 1000).toFixed(0);
        return `⚠️ -${percent}% Click Speed (${duration}s)`;
      }
      return 'Debuff';
    case 'free':
      return '✨ FREE';
    default:
      return '???';
  }
}

export default function WanderingTraderShopModal({ isOpen, onClose }: WanderingTraderShopModalProps) {
  const { 
    gameState, 
    getWanderingTraderOffers, 
    purchaseWanderingTraderOffer,
    getWanderingTraderTimeLeft,
    dismissWanderingTrader,
    getStokens,
  } = useGame();
  
  const [mounted, setMounted] = useState(false);
  const [offers, setOffers] = useState<WanderingTraderOffer[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedOffer, setSelectedOffer] = useState<WanderingTraderOffer | null>(null);
  const [showTrinketPicker, setShowTrinketPicker] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setOffers(getWanderingTraderOffers());
    }
  }, [isOpen, getWanderingTraderOffers]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil(getWanderingTraderTimeLeft() / 1000);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        onClose();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, getWanderingTraderTimeLeft, onClose]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (purchaseMessage) {
      const timeout = setTimeout(() => setPurchaseMessage(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [purchaseMessage]);

  const handlePurchase = (offer: WanderingTraderOffer) => {
    // Check if offer requires trinket selection
    if (offer.cost.type === 'trinkets') {
      setSelectedOffer(offer);
      setShowTrinketPicker(true);
      return;
    }

    // Check if offer is roulette
    if (offer.effect.type === 'roulette') {
      // First purchase the roulette spin
      const success = purchaseWanderingTraderOffer(offer.id);
      if (success) {
        setSelectedOffer(offer);
        setShowRoulette(true);
      } else {
        setPurchaseMessage({ type: 'error', text: 'Not enough money!' });
      }
      return;
    }

    // Check affordability for money costs
    if (offer.cost.type === 'money' && gameState.yatesDollars < (offer.cost.amount || 0)) {
      setPurchaseMessage({ type: 'error', text: 'Not enough money!' });
      return;
    }

    // Regular purchase
    const success = purchaseWanderingTraderOffer(offer.id);
    if (success) {
      setPurchaseMessage({ type: 'success', text: 'Purchase successful!' });
      setOffers(getWanderingTraderOffers());
    } else {
      setPurchaseMessage({ type: 'error', text: 'Purchase failed!' });
    }
  };

  const handleTrinketSelection = (selectedTrinketIds: string[]) => {
    if (!selectedOffer) return;
    
    const success = purchaseWanderingTraderOffer(selectedOffer.id, selectedTrinketIds);
    if (success) {
      setPurchaseMessage({ type: 'success', text: 'Purchase successful!' });
      setOffers(getWanderingTraderOffers());
    } else {
      setPurchaseMessage({ type: 'error', text: 'Purchase failed!' });
    }
    
    setShowTrinketPicker(false);
    setSelectedOffer(null);
  };

  const handleRouletteComplete = () => {
    setShowRoulette(false);
    setSelectedOffer(null);
    setOffers(getWanderingTraderOffers());
  };

  const handleLeave = () => {
    dismissWanderingTrader();
    onClose();
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-b from-gray-900 via-purple-950/50 to-gray-900 rounded-2xl border-2 border-purple-500/50 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/80 to-gray-900/80 px-6 py-4 border-b border-purple-500/30 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧙</span>
              <div>
                <h2 className="text-xl font-bold text-purple-200">Wandering Trader</h2>
                <p className="text-purple-400 text-sm">Hmm... what do you seek?</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-purple-300 font-bold">⏱️ {timeLeft}s</div>
              <div className="text-purple-400 text-xs">💎 {getStokens()} Stokens</div>
            </div>
          </div>
        </div>

        {/* Purchase message */}
        {purchaseMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-lg text-center font-bold ${
            purchaseMessage.type === 'success' 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {purchaseMessage.text}
          </div>
        )}

        {/* Offers */}
        <div className="p-6 space-y-4">
          {offers.length === 0 ? (
            <div className="text-center text-purple-400 py-8">
              <span className="text-4xl">🤷</span>
              <p className="mt-2">No more offers available...</p>
            </div>
          ) : (
            offers.map((offer) => (
              <div 
                key={offer.id}
                className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-4 hover:border-purple-400/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-purple-200">{offer.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{offer.description}</p>
                    <div className="mt-2 text-sm">
                      <span className="text-purple-400">Cost: </span>
                      <span className={`font-bold ${
                        offer.cost.type === 'free' ? 'text-green-400' :
                        offer.cost.type === 'all_money' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {getCostDisplay(offer)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchase(offer)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
                  >
                    {offer.effect.type === 'roulette' ? '🎰 SPIN' : '🛒 BUY'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-900/50 px-6 py-4 border-t border-purple-500/30 rounded-b-2xl flex justify-between items-center">
          <p className="text-purple-400/60 text-xs italic">
            "The void whispers many secrets..."
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
            >
              Browse More
            </button>
            <button
              onClick={handleLeave}
              className="px-4 py-2 bg-red-600/50 hover:bg-red-600 text-red-200 rounded-lg transition-colors"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Trinket Selection Modal */}
      {showTrinketPicker && selectedOffer && (
        <TrinketSelectionModal
          isOpen={showTrinketPicker}
          onClose={() => {
            setShowTrinketPicker(false);
            setSelectedOffer(null);
          }}
          requiredCount={selectedOffer.cost.trinketCount || 2}
          onConfirm={handleTrinketSelection}
        />
      )}

      {/* Roulette Wheel */}
      {showRoulette && (
        <RouletteWheel
          isOpen={showRoulette}
          onClose={handleRouletteComplete}
        />
      )}
    </div>,
    document.body
  );
}
