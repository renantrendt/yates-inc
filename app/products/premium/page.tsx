'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useStock } from '@/contexts/StockContext';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { savePurchase, fetchUserPurchases } from '@/lib/userDataSync';

// Format money with T, B, M, K suffixes
function formatMoney(amount: number): string {
  if (amount >= 1000000000000) return `$${(amount / 1000000000000).toFixed(2)}T`;
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
}

interface PremiumProduct {
  id: number;
  name: string;
  price: string;
  priceValue: number;
  stockPrice: number;
  description: string;
  image: string;
  edition?: string;
}

const premiumProducts: PremiumProduct[] = [
  {
    id: 1,
    name: 'Patek Philippe Nautilus',
    price: '$5,000,000',
    priceValue: 5000000,
    stockPrice: 20000,
    description: 'Made from pure 100mg of gold',
    image: '/premium/Patek Philippe Nautilus.png',
  },
  {
    id: 2,
    name: 'Richard Mille',
    price: '$4,500,000',
    priceValue: 4500000,
    stockPrice: 17000,
    description: 'Personalized timer made of 5g of pure diamonds',
    image: '/premium/Richardmille.png',
  },
  {
    id: 3,
    name: 'Luxury Yacht',
    price: '$100,000,000',
    priceValue: 100000000,
    stockPrice: 70000,
    description: 'Made personalized to your specifications',
    image: '/premium/100M$Yatch.png',
  },
  {
    id: 4,
    name: 'McLaren F1',
    price: '$250,000,000',
    priceValue: 250000000,
    stockPrice: 200000,
    description: 'The legendary supercar',
    image: '/premium/mclaren.png',
    edition: '3rd Edition',
  },
  {
    id: 5,
    name: 'Bugatti La Voiture Noire',
    price: '$20,000,000',
    priceValue: 20000000,
    stockPrice: 45000,
    description: 'The most expensive new car ever sold',
    image: '/premium/Bugatti La Voiture Noire.png',
    edition: '5th Edition',
  },
  {
    id: 6,
    name: '16oz Gold Bar',
    price: '$1,000,000',
    priceValue: 1000000,
    stockPrice: 10000,
    description: 'Original pure gold investment piece',
    image: '/premium/16gbar.png',
  },
];

export default function PremiumProductsPage() {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [purchasedItems, setPurchasedItems] = useState<number[]>([]);
  const { ownedStocks, stockProfits, spendStocks } = useStock();
  const { gameState, spendMoney } = useGame();
  const { employee } = useAuth();
  const { client } = useClient();
  
  // Get current user ID and type
  const userId = employee?.id || client?.id || null;
  const userType: 'employee' | 'client' | null = employee ? 'employee' : client ? 'client' : null;
  
  // Premium cash is half of game money
  const premiumCash = Math.floor(gameState.yatesDollars / 2);


  // Load purchased items from Supabase on mount
  useEffect(() => {
    const loadPurchases = async () => {
      if (userId) {
        const purchases = await fetchUserPurchases(userId);
        setPurchasedItems(purchases.map(p => p.product_id));
      }
    };
    loadPurchases();
  }, [userId]);


  // Buy with cash (spends 2x from game because premium cash is half)
  const handleBuyCash = async (product: PremiumProduct) => {
    const actualCost = product.priceValue * 2; // Need 2x game money since premium is half
    if (gameState.yatesDollars >= actualCost) {
      spendMoney(actualCost);
      setPurchasedItems((prev) => [...prev, product.id]);
      
      // Save to Supabase if logged in
      if (userId && userType) {
        await savePurchase({
          user_id: userId,
          user_type: userType,
          product_id: product.id,
          product_name: product.name,
          purchase_type: 'cash',
          amount_paid: product.priceValue,
        });
      }
      
      setNotification({ type: 'success', message: `🎉 Purchased ${product.name} with Cash!` });
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification({ type: 'error', message: `Not enough Premium Cash! Need $${product.priceValue.toLocaleString()}` });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Buy with stocks
  const handleBuyStocks = async (product: PremiumProduct) => {
    if (ownedStocks >= product.stockPrice) {
      const success = spendStocks(product.stockPrice);
      if (success) {
        setPurchasedItems((prev) => [...prev, product.id]);
        
        // Save to Supabase if logged in
        if (userId && userType) {
          await savePurchase({
            user_id: userId,
            user_type: userType,
            product_id: product.id,
            product_name: product.name,
            purchase_type: 'stocks',
            amount_paid: product.stockPrice,
          });
        }
        
        setNotification({ type: 'success', message: `🎉 Purchased ${product.name} with ${product.stockPrice.toLocaleString()} Stocks!` });
        setTimeout(() => setNotification(null), 4000);
      }
    } else {
      setNotification({ type: 'error', message: `Not enough Stocks! Need ${product.stockPrice.toLocaleString()}` });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const canAffordCash = (price: number) => premiumCash >= price;
  const canAffordStocks = (stockPrice: number) => ownedStocks >= stockPrice;
  const isPurchased = (productId: number) => purchasedItems.includes(productId);

  return (
    <div className="min-h-screen bg-black relative">
      {/* Wallet Display - Absolute positioned in page content */}
      <div 
        className="absolute top-4 left-4 bg-gradient-to-br from-gray-900 to-black border border-yellow-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(234,179,8,0.2)] z-10"
      >
        <div className="text-xs text-yellow-500/60 uppercase tracking-wider mb-2 flex items-center gap-1">
          <span>💎</span> Your Wallet
        </div>
        
        {/* Premium Cash (half of game money) */}
        <div className="mb-3">
          <div className="text-xs text-green-500/80">Premium Cash</div>
          <div className="text-lg font-bold text-green-400 font-mono">
            ${premiumCash.toLocaleString()}
          </div>
        </div>
        
        {/* Stocks */}
        <div className="mb-3 pt-2 border-t border-yellow-500/20">
          <div className="text-xs text-yellow-500/80">Stocks Owned</div>
          <div className="text-lg font-bold text-yellow-400 font-mono flex items-center gap-1">
            📈 {ownedStocks.toLocaleString()}
          </div>
        </div>
        
        {/* Stock Profits (for premium purchases) */}
        <div className="pt-2 border-t border-yellow-500/20">
          <div className="text-xs text-purple-400/80">Stock Profits</div>
          <div className="text-lg font-bold text-purple-400 font-mono">
            {formatMoney(stockProfits)}
          </div>
        </div>
      </div>

      {/* Purchase Notification */}
      {notification && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl font-bold shadow-2xl transition-all animate-bounce-in ${
          notification.type === 'success'
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
            : 'bg-gradient-to-r from-red-600 to-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Animated gold particles background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              opacity: 0.3 + Math.random() * 0.5,
            }}
          />
        ))}
      </div>

      {/* Gold gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-yellow-900/10 via-transparent to-yellow-900/20 pointer-events-none" />

      {/* Header */}
      <header className="relative pt-12 pb-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          {/* Back link */}
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 mb-8 transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Products</span>
          </Link>

          {/* Title with sparkle effect */}
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight premium-title">
              <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                PREMIUM
              </span>
            </h1>
            <h2 className="text-3xl md:text-5xl font-light tracking-[0.3em] text-yellow-100/80 mt-2">
              COLLECTION
            </h2>
            {/* Sparkle decorations */}
            <div className="absolute -top-4 -left-8 text-yellow-400 animate-pulse text-2xl">✦</div>
            <div className="absolute -top-2 -right-6 text-yellow-300 animate-pulse delay-100 text-xl">✧</div>
            <div className="absolute -bottom-2 left-1/4 text-yellow-500 animate-pulse delay-200 text-lg">✦</div>
          </div>

          <p className="mt-6 text-yellow-100/60 text-lg max-w-2xl mx-auto font-light tracking-wide">
            Exclusive items for the elite. Purchase with{' '}
            <span className="text-yellow-400 font-semibold">Stocks</span> only.
          </p>

          {/* Decorative line */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-yellow-500/50" />
            <div className="text-yellow-500 text-2xl">♦</div>
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-yellow-500/50" />
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="relative max-w-7xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {premiumProducts.map((product) => (
            <div
              key={product.id}
              className="group relative"
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              {/* Card */}
              <div className="relative bg-gradient-to-b from-gray-900 to-black border border-yellow-500/20 rounded-2xl overflow-hidden transition-all duration-500 hover:border-yellow-500/60 hover:shadow-[0_0_40px_rgba(234,179,8,0.15)]">
                {/* Edition badge */}
                {product.edition && (
                  <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    {product.edition}
                  </div>
                )}

                {/* Image container */}
                <div className="relative h-64 bg-gradient-to-b from-gray-800/50 to-transparent p-6 flex items-center justify-center overflow-hidden">
                  {/* Glow effect on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent transition-opacity duration-500 ${hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'}`} />
                  
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={250}
                    height={200}
                    className="object-contain max-h-48 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)] group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Sparkle overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping"
                        style={{
                          left: `${20 + Math.random() * 60}%`,
                          top: `${20 + Math.random() * 60}%`,
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: '1.5s',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 border-t border-yellow-500/10">
                  <h3 className="text-xl font-bold text-yellow-100 tracking-wide group-hover:text-yellow-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-yellow-100/50 text-sm font-light">
                    {product.description}
                  </p>
                  
                  {/* Prices - Cash & Stocks */}
                  <div className="mt-4 space-y-3">
                    {/* Price display */}
                    <div className="flex items-center justify-between gap-4">
                      {/* Cash price */}
                      <div className="flex-1">
                        <div className="text-xs text-green-500/80 uppercase tracking-wider flex items-center gap-1">
                          <span>💵</span> Cash
                        </div>
                        <div className="text-xl font-black text-green-400">
                          {product.price}
                        </div>
                      </div>
                      
                      {/* Divider */}
                      <div className="text-yellow-500/40 text-sm">or</div>
                      
                      {/* Stock price */}
                      <div className="flex-1 text-right">
                        <div className="text-xs text-yellow-500/80 uppercase tracking-wider flex items-center justify-end gap-1">
                          <span>📈</span> Stocks
                        </div>
                        <div className="text-xl font-black bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 bg-clip-text text-transparent">
                          {product.stockPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Buy buttons */}
                    <div className="flex gap-2">
                      {isPurchased(product.id) ? (
                        <div className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-lg text-sm text-center">
                          ✓ OWNED
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleBuyCash(product)}
                            disabled={!canAffordCash(product.priceValue)}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-lg hover:from-green-500 hover:to-green-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
                          >
                            <span className="flex items-center justify-center gap-1.5">
                              💵 Buy Cash
                            </span>
                          </button>
                          <button 
                            onClick={() => handleBuyStocks(product)}
                            disabled={!canAffordStocks(product.stockPrice)}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
                          >
                            <span className="flex items-center justify-center gap-1.5">
                              📈 Buy Stocks
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-yellow-500/30 rounded-tl-2xl" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-yellow-500/30 rounded-br-2xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom decoration */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 text-yellow-500/40">
            <span className="text-2xl">✦</span>
            <span className="text-sm uppercase tracking-[0.4em] font-light">Exclusive Collection</span>
            <span className="text-2xl">✦</span>
          </div>
        </div>
      </main>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          50% {
            transform: translateY(-100px) translateX(20px);
            opacity: 0.8;
          }
          90% {
            opacity: 0.4;
          }
        }
        .animate-float-particle {
          animation: float-particle 5s ease-in-out infinite;
        }
        .premium-title {
          text-shadow: 0 0 40px rgba(234, 179, 8, 0.3);
        }
      `}</style>
    </div>
  );
}

