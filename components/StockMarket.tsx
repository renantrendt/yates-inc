'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useStock } from '@/contexts/StockContext';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';

interface StockMarketProps {
  isOpen: boolean;
  onClose: () => void;
}

// Format money with T, B, M, K suffixes
function formatStockMoney(amount: number): string {
  if (amount >= 1000000000000) return `$${(amount / 1000000000000).toFixed(2)}T`;
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
}

export default function StockMarket({ isOpen, onClose }: StockMarketProps) {
  const { currentPrice, priceHistory, ownedStocks, stockProfits, buyStock, sellStock, canBuyStocks } = useStock();
  const { gameState, spendMoney } = useGame();
  const { employee } = useAuth();
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isUnlocked = canBuyStocks(gameState.currentRockId, gameState.ownedPickaxeIds, gameState.hasStocksUnlocked);
  const isEmployee = !!employee;

  // Calculate price change
  const priceChange = useMemo(() => {
    if (priceHistory.length < 2) return { value: 0, percent: 0 };
    const oldPrice = priceHistory[Math.max(0, priceHistory.length - 10)]?.price || currentPrice;
    const change = currentPrice - oldPrice;
    const percent = oldPrice > 0 ? (change / oldPrice) * 100 : 0;
    return { value: change, percent };
  }, [priceHistory, currentPrice]);

  // Draw the chart
  useEffect(() => {
    if (!isOpen || !canvasRef.current || priceHistory.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, width, height);

    // Get price range
    const prices = priceHistory.map(p => p.price);
    const minPrice = Math.min(...prices) * 0.95;
    const maxPrice = Math.max(...prices) * 1.05;
    const priceRange = maxPrice - minPrice;

    // Draw grid lines
    ctx.strokeStyle = '#21262d';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Price labels
      const price = maxPrice - (priceRange / 5) * i;
      ctx.fillStyle = '#8b949e';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(formatStockMoney(price).replace('$', ''), width - 5, y + 4);
    }

    // Draw the price line
    const isUp = priceChange.value >= 0;
    const lineColor = isUp ? '#26a641' : '#f85149';
    const gradientColor = isUp ? 'rgba(38, 166, 65, 0.2)' : 'rgba(248, 81, 73, 0.2)';

    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, gradientColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    // Draw area fill
    ctx.beginPath();
    priceHistory.forEach((point, i) => {
      const x = padding.left + (chartWidth / (priceHistory.length - 1)) * i;
      const y = padding.top + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    priceHistory.forEach((point, i) => {
      const x = padding.left + (chartWidth / (priceHistory.length - 1)) * i;
      const y = padding.top + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw current price dot
    const lastPoint = priceHistory[priceHistory.length - 1];
    const lastX = width - padding.right;
    const lastY = padding.top + chartHeight - ((lastPoint.price - minPrice) / priceRange) * chartHeight;
    
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    
    // Pulsing glow effect
    ctx.beginPath();
    ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [isOpen, priceHistory, priceChange.value, currentPrice]);

  const handleBuy = () => {
    const success = buyStock(buyQuantity, spendMoney);
    if (success) {
      setNotification({ type: 'success', message: `Bought ${buyQuantity} stock${buyQuantity > 1 ? 's' : ''} for $${(currentPrice * buyQuantity).toLocaleString()}!` });
      setBuyQuantity(1);
    } else {
      setNotification({ type: 'error', message: 'Not enough Yates Dollars!' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSell = () => {
    const success = sellStock(sellQuantity);
    if (success) {
      setNotification({ type: 'success', message: `Sold ${sellQuantity} stock${sellQuantity > 1 ? 's' : ''} for $${(currentPrice * sellQuantity).toLocaleString()}!` });
      setSellQuantity(1);
    } else {
      setNotification({ type: 'error', message: 'Not enough stocks to sell!' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const maxAffordable = Math.floor(gameState.yatesDollars / currentPrice);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-12 bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl z-[61] flex flex-col overflow-hidden">
        {/* Header - TradingView style */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📈</span>
              <h2 className="text-lg font-bold text-white">YATES/USD</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white font-mono">
                {formatStockMoney(currentPrice)}
              </span>
              <span className={`text-sm font-mono ${priceChange.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange.value >= 0 ? '+' : ''}{priceChange.percent.toFixed(2)}%
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`px-4 py-2 text-sm font-medium ${
            notification.type === 'success' 
              ? 'bg-green-900/50 text-green-400 border-b border-green-800' 
              : 'bg-red-900/50 text-red-400 border-b border-red-800'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Chart area */}
          <div className="flex-1 p-4 flex flex-col">
            {/* Time frame buttons (decorative) */}
            <div className="flex gap-2 mb-4">
              {['15m', '1H', '4H', '1D', '1W'].map((tf, i) => (
                <button
                  key={tf}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    i === 0 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-[#21262d] text-gray-400 hover:bg-[#30363d]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Canvas chart */}
            <div className="flex-1 relative min-h-[200px]">
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ display: 'block' }}
              />
            </div>

            {/* Stats bar */}
            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <span className="text-gray-500">24h High</span>
                <span className="ml-2 text-white font-mono">
                  {formatStockMoney(Math.max(...priceHistory.slice(-96).map(p => p.price)))}
                </span>
              </div>
              <div>
                <span className="text-gray-500">24h Low</span>
                <span className="ml-2 text-white font-mono">
                  {formatStockMoney(Math.min(...priceHistory.slice(-96).map(p => p.price)))}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Your Stocks</span>
                <span className="ml-2 text-yellow-400 font-mono font-bold">{ownedStocks}</span>
              </div>
            </div>
          </div>

          {/* Trading panel */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[#30363d] bg-[#161b22] flex flex-col">
            {/* Portfolio summary */}
            <div className="p-4 border-b border-[#30363d]">
              <h3 className="text-sm text-gray-400 mb-2">Your Portfolio</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0d1117] rounded-lg p-3">
                  <div className="text-xs text-gray-500">Stocks Owned</div>
                  <div className="text-xl font-bold text-yellow-400">{ownedStocks}</div>
                </div>
                <div className="bg-[#0d1117] rounded-lg p-3">
                  <div className="text-xs text-gray-500">Value</div>
                  <div className="text-xl font-bold text-green-400">
                    {formatStockMoney(ownedStocks * currentPrice)}
                  </div>
                </div>
                <div className="bg-[#0d1117] rounded-lg p-3 col-span-2">
                  <div className="text-xs text-gray-500">Premium Balance (from sales)</div>
                  <div className="text-xl font-bold text-purple-400">
                    {formatStockMoney(stockProfits)}
                  </div>
                </div>
              </div>
              
              {/* Employee bonus notice */}
              {isEmployee && (
                <div className="mt-3 text-xs text-blue-400 bg-blue-900/20 rounded px-2 py-1">
                  💼 Employees receive 4 stocks/month
                </div>
              )}
            </div>

            {/* Lock message or trading UI */}
            {!isUnlocked ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">🔒</div>
                  <h3 className="text-lg font-bold text-white mb-2">Stock Market Locked</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Unlock by reaching:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center justify-center gap-2 ${gameState.currentRockId >= 16 ? 'text-green-400' : 'text-gray-500'}`}>
                      {gameState.currentRockId >= 16 ? '✓' : '○'} Rock Level 16
                    </div>
                    <div className={`flex items-center justify-center gap-2 ${gameState.ownedPickaxeIds.length >= 12 ? 'text-green-400' : 'text-gray-500'}`}>
                      {gameState.ownedPickaxeIds.length >= 12 ? '✓' : '○'} Own 12 Pickaxes
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Current: Rock {gameState.currentRockId}, {gameState.ownedPickaxeIds.length} Pickaxes
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Buy/Sell tabs */}
                <div className="flex border-b border-[#30363d]">
                  <button
                    onClick={() => setActiveTab('buy')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'buy'
                        ? 'text-green-400 border-b-2 border-green-400 bg-green-900/10'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setActiveTab('sell')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'sell'
                        ? 'text-red-400 border-b-2 border-red-400 bg-red-900/10'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                {/* Trading form */}
                <div className="flex-1 p-4">
                  {activeTab === 'buy' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Quantity</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            max={maxAffordable}
                            value={buyQuantity}
                            onChange={(e) => setBuyQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-white font-mono focus:border-green-500 focus:outline-none"
                          />
                          <button
                            onClick={() => setBuyQuantity(Math.max(1, maxAffordable))}
                            className="px-3 py-2 bg-[#21262d] text-gray-300 rounded text-sm hover:bg-[#30363d]"
                          >
                            Max
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Max affordable: {maxAffordable}
                        </div>
                      </div>

                      <div className="bg-[#0d1117] rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Total Cost</span>
                          <span className="text-white font-mono font-bold">
                            ${(currentPrice * buyQuantity).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-500">Your Balance</span>
                          <span className="text-gray-400 font-mono">
                            ${gameState.yatesDollars.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleBuy}
                        disabled={buyQuantity < 1 || gameState.yatesDollars < currentPrice * buyQuantity}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-colors"
                      >
                        Buy {buyQuantity} Stock{buyQuantity > 1 ? 's' : ''}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Quantity</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            max={ownedStocks}
                            value={sellQuantity}
                            onChange={(e) => setSellQuantity(Math.max(1, Math.min(ownedStocks, parseInt(e.target.value) || 1)))}
                            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-white font-mono focus:border-red-500 focus:outline-none"
                          />
                          <button
                            onClick={() => setSellQuantity(Math.max(1, ownedStocks))}
                            className="px-3 py-2 bg-[#21262d] text-gray-300 rounded text-sm hover:bg-[#30363d]"
                          >
                            Max
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Available: {ownedStocks}
                        </div>
                      </div>

                      <div className="bg-[#0d1117] rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">You&apos;ll Receive</span>
                          <span className="text-white font-mono font-bold">
                            ${(currentPrice * sellQuantity).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-purple-400 mt-1">
                          → Goes to Premium Balance for luxury purchases
                        </div>
                      </div>

                      <button
                        onClick={handleSell}
                        disabled={sellQuantity < 1 || ownedStocks < sellQuantity}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-colors"
                      >
                        Sell {sellQuantity} Stock{sellQuantity > 1 ? 's' : ''}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

