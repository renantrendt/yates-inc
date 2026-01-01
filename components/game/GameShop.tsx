'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';
import { PICKAXES } from '@/lib/gameData';
import { products } from '@/utils/products';
import { SHOP_UNLOCK_REQUIREMENTS } from '@/types/game';

interface GameShopProps {
  onClose: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

type ShopTab = 'pickaxes' | 'products';

export default function GameShop({ onClose }: GameShopProps) {
  const { 
    gameState, 
    buyPickaxe, 
    canAffordPickaxe, 
    ownsPickaxe, 
    equipPickaxe,
    currentPickaxe,
    shopStock,
    buyShopProduct,
    getTimeUntilRestock,
  } = useGame();

  const [activeTab, setActiveTab] = useState<ShopTab>('pickaxes');
  const [restockTimer, setRestockTimer] = useState(getTimeUntilRestock());
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Update restock timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setRestockTimer(getTimeUntilRestock());
    }, 1000);
    return () => clearInterval(interval);
  }, [getTimeUntilRestock]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const canAccessProducts = 
    gameState.currentRockId >= SHOP_UNLOCK_REQUIREMENTS.productsTab.minRockId &&
    gameState.currentPickaxeId >= SHOP_UNLOCK_REQUIREMENTS.productsTab.minPickaxeId;

  // Product prices in Yates Dollars (15x the real price)
  const getProductPrice = (priceFloat: number): number => {
    return Math.floor(priceFloat * 15);
  };

  const handleBuyProduct = (productId: number, productName: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const price = getProductPrice(product.priceFloat);
    const success = buyShopProduct(productId);
    if (success) {
      showToast(`🛒 ${productName} purchased for $${formatNumber(price)} YD!`, 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Shop Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-amber-600/30 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-600 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <h2 className="text-lg sm:text-2xl font-bold text-white">🛒 SHOP</h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-black/30 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2">
              <span className="text-base sm:text-xl">💰</span>
              <span className="text-yellow-300 font-bold text-sm sm:text-base">${formatNumber(gameState.yatesDollars)}</span>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl sm:text-3xl leading-none touch-manipulation p-2"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('pickaxes')}
            className={`flex-1 py-2 sm:py-3 font-bold transition-colors text-xs sm:text-base touch-manipulation ${
              activeTab === 'pickaxes'
                ? 'bg-amber-600/20 text-amber-400 border-b-2 border-amber-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            ⛏️ Pickaxes
          </button>
          <button
            onClick={() => setActiveTab('products')}
            disabled={!canAccessProducts}
            className={`flex-1 py-2 sm:py-3 font-bold transition-colors text-xs sm:text-base touch-manipulation ${
              activeTab === 'products'
                ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400'
                : canAccessProducts
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            {canAccessProducts ? (
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                <span className="hidden xs:inline">🏪</span> Products
                <span className="text-[10px] xs:text-xs bg-purple-600/30 px-1 sm:px-2 py-0.5 rounded">
                  🔄 {formatTime(restockTimer)}
                </span>
              </span>
            ) : <span className="text-[10px] xs:text-xs">🔒 Unlock at R12 + P12</span>}
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto max-h-[70vh] sm:max-h-[60vh]">
          {activeTab === 'pickaxes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {PICKAXES.map((pickaxe) => {
                const owned = ownsPickaxe(pickaxe.id);
                const equipped = currentPickaxe.id === pickaxe.id;
                const canAfford = canAffordPickaxe(pickaxe.id);
                
                // Sequential purchase: can only buy if you own the previous one
                const highestOwnedId = Math.max(...gameState.ownedPickaxeIds);
                const isNextInSequence = pickaxe.id === highestOwnedId + 1;
                const isLocked = !owned && pickaxe.id > highestOwnedId + 1;
                const canPurchase = !owned && isNextInSequence && canAfford;

                return (
                  <div
                    key={pickaxe.id}
                    className={`relative rounded-lg sm:rounded-xl p-3 sm:p-4 border transition-all ${
                      equipped
                        ? 'bg-amber-600/20 border-amber-400'
                        : owned
                          ? 'bg-green-600/10 border-green-600/30'
                          : isLocked
                            ? 'bg-gray-900/50 border-gray-800/50 opacity-50'
                            : isNextInSequence
                              ? 'bg-amber-900/20 border-amber-600/50 hover:border-amber-500/50'
                              : 'bg-gray-800/50 border-gray-700/50'
                    }`}
                  >
                    {/* Equipped Badge */}
                    {equipped && (
                      <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        EQUIPPED
                      </div>
                    )}
                    
                    {/* Next Up Badge */}
                    {isNextInSequence && !owned && (
                      <div className="absolute -top-2 -left-2 bg-green-500 text-black text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        NEXT
                      </div>
                    )}
                    
                    {/* Locked Badge */}
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                        <span className="text-xl sm:text-2xl">🔒</span>
                      </div>
                    )}

                    {/* Pickaxe Image */}
                    <div className={`relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 ${isLocked ? 'grayscale' : ''}`}>
                      <Image
                        src={pickaxe.image}
                        alt={pickaxe.name}
                        fill
                        className="object-contain"
                      />
                    </div>

                    {/* Info */}
                    <h3 className="text-white font-bold text-center mb-1 text-sm sm:text-base">{pickaxe.name}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm text-center mb-2">
                      +{formatNumber(pickaxe.clickPower)} power
                    </p>

                    {pickaxe.specialAbility && (
                      <p className="text-purple-400 text-[10px] sm:text-xs text-center mb-2 italic">
                        ✨ {pickaxe.specialAbility}
                      </p>
                    )}

                    {/* Price / Action */}
                    <div className="mt-auto">
                      {owned ? (
                        equipped ? (
                          <div className="text-amber-400 text-center text-xs sm:text-sm font-medium">
                            Currently Using
                          </div>
                        ) : (
                          <button
                            onClick={() => equipPickaxe(pickaxe.id)}
                            className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm touch-manipulation"
                          >
                            Equip
                          </button>
                        )
                      ) : isLocked ? (
                        <div className="text-gray-500 text-center text-xs sm:text-sm">
                          Buy previous first
                        </div>
                      ) : (
                        <button
                          onClick={() => buyPickaxe(pickaxe.id)}
                          disabled={!canPurchase}
                          className={`w-full font-bold py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm touch-manipulation ${
                            canPurchase
                              ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white'
                              : !canAfford
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {pickaxe.price === 0 ? 'FREE' : `$${formatNumber(pickaxe.price)}`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'products' && canAccessProducts && (
            <div className="space-y-3 sm:space-y-4">
              {/* Restock Timer Banner */}
              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-2xl">🔄</span>
                  <div>
                    <p className="text-purple-300 font-bold text-xs sm:text-sm">RESTOCK IN</p>
                    <p className="text-white font-mono text-base sm:text-xl">{formatTime(restockTimer)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-[10px] sm:text-xs">Items available</p>
                  <p className="text-purple-300 font-bold text-sm sm:text-base">{shopStock.items.filter(i => i.quantity > 0).length} / {shopStock.items.length}</p>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {shopStock.items.map((stockItem) => {
                  const product = products.find(p => p.id === stockItem.productId);
                  if (!product) return null;

                  const price = getProductPrice(product.priceFloat);
                  const canAfford = gameState.yatesDollars >= price;
                  const soldOut = stockItem.quantity <= 0;

                  return (
                    <div
                      key={product.id}
                      className={`relative rounded-xl p-4 transition-all ${
                        soldOut
                          ? 'bg-gray-900/50 border border-gray-800/50 opacity-60'
                          : 'bg-gray-800/50 border border-gray-700/50 hover:border-purple-600/50'
                      }`}
                    >
                      {/* Stock Badge */}
                      <div className={`absolute -top-2 -right-2 text-xs font-bold px-2 py-1 rounded-full ${
                        soldOut 
                          ? 'bg-red-600 text-white' 
                          : stockItem.quantity === 1 
                            ? 'bg-yellow-500 text-black'
                            : 'bg-purple-500 text-white'
                      }`}>
                        {soldOut ? 'SOLD OUT' : `×${stockItem.quantity}`}
                      </div>

                      {/* Product Image */}
                      <div className={`relative w-24 h-24 mx-auto mb-3 bg-gray-700/30 rounded-lg overflow-hidden ${soldOut ? 'grayscale' : ''}`}>
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <h3 className="text-white font-bold text-center mb-1 text-sm">{product.name}</h3>
                      <p className="text-gray-500 text-xs text-center mb-3">
                        Real price: {product.price}
                      </p>

                      {/* Buy Button */}
                      {soldOut ? (
                        <div className="w-full text-center text-gray-500 font-bold py-2 text-sm">
                          Wait for restock
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBuyProduct(product.id, product.name)}
                          disabled={!canAfford}
                          className={`w-full font-bold py-2 rounded-lg transition-colors text-sm ${
                            canAfford
                              ? 'bg-purple-600 hover:bg-purple-500 text-white'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          ${formatNumber(price)} YD
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Empty Stock Message */}
              {shopStock.items.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-4xl mb-2">📦</p>
                  <p>No items in stock! Wait for restock...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none px-4 max-w-[90vw]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-2xl font-bold text-center animate-toast-in text-xs sm:text-base ${
              toast.type === 'success'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border border-green-400/30'
                : 'bg-gradient-to-r from-red-600 to-rose-600 text-white border border-red-400/30'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Toast Animation */}
      <style jsx>{`
        @keyframes toast-in {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          10% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          90% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
        }
        .animate-toast-in {
          animation: toast-in 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

