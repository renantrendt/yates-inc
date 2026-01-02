'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { calculateTax, getTaxRateLabel } from '@/utils/taxes';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GameCoupons {
  discount30: number;
  discount50: number;
  discount100: number;
}

type CouponType = 'discount30' | 'discount50' | 'discount100' | null;

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { cart, removeFromCart, updateQuantity, cartSubtotal, cartTax, cartTaxRateLabel, cartTotal } = useCart();
  const router = useRouter();
  
  const [coupons, setCoupons] = useState<GameCoupons>({ discount30: 0, discount50: 0, discount100: 0 });
  const [appliedCoupon, setAppliedCoupon] = useState<CouponType>(null);
  const [showCouponPicker, setShowCouponPicker] = useState(false);

  // Load coupons from game save
  useEffect(() => {
    const loadCoupons = () => {
      const saved = localStorage.getItem('yates-mining-game');
      if (saved) {
        try {
          const gameState = JSON.parse(saved);
          if (gameState.coupons) {
            setCoupons(gameState.coupons);
          }
        } catch {
          console.error('Failed to load coupons from game save');
        }
      }
    };
    loadCoupons();
    // Reload when sidebar opens
    if (isOpen) loadCoupons();
  }, [isOpen]);

  const getDiscountPercent = (type: CouponType): number => {
    if (type === 'discount30') return 0.30;
    if (type === 'discount50') return 0.50;
    if (type === 'discount100') return 1.00;
    return 0;
  };

  const getDiscountLabel = (type: CouponType): string => {
    if (type === 'discount30') return '30% OFF';
    if (type === 'discount50') return '50% OFF';
    if (type === 'discount100') return 'FREE (100% OFF)';
    return '';
  };

  const applyCoupon = (type: CouponType) => {
    if (!type || coupons[type] <= 0) return;
    setAppliedCoupon(type);
    setShowCouponPicker(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const useCouponFromSave = (type: CouponType) => {
    if (!type) return;
    const saved = localStorage.getItem('yates-mining-game');
    if (saved) {
      try {
        const gameState = JSON.parse(saved);
        if (gameState.coupons && gameState.coupons[type] > 0) {
          gameState.coupons[type] -= 1;
          localStorage.setItem('yates-mining-game', JSON.stringify(gameState));
          setCoupons(gameState.coupons);
        }
      } catch {
        console.error('Failed to use coupon');
      }
    }
  };

  // Apply discount to subtotal, then calculate tax on discounted amount
  const discountAmount = cartSubtotal * getDiscountPercent(appliedCoupon);
  const discountedSubtotal = cartSubtotal - discountAmount;
  // Recalculate tax on discounted amount
  const effectiveTax = appliedCoupon ? calculateTax(discountedSubtotal, 'product') : cartTax;
  const effectiveTaxRateLabel = appliedCoupon ? getTaxRateLabel(discountedSubtotal, 'product') : cartTaxRateLabel;
  const finalTotal = discountedSubtotal + effectiveTax;
  const totalCoupons = coupons.discount30 + coupons.discount50 + coupons.discount100;

  const handlePayment = () => {
    // Consume the coupon if one was applied
    if (appliedCoupon) {
      useCouponFromSave(appliedCoupon);
      setAppliedCoupon(null);
    }
    onClose(); // Close sidebar
    router.push('/pay'); // Navigate to pay page
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100]"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl z-[110] transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping Cart</h2>
              <button
                onClick={onClose}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800">
            {cart.length === 0 ? (
              <p className="text-gray-700 dark:text-gray-300 text-center mt-8">Your cart is empty</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center space-x-4 border-b dark:border-gray-700 pb-4"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-white">{item.product.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold">{item.product.price}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <select
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.product.id, parseInt(e.target.value))
                          }
                          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                        >
                          {[1, 2, 3, 4, 5].map((num) => (
                            <option key={num} value={num}>
                              Qty: {num}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 text-lg"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-6 border-t dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">
              {/* Coupon Section */}
              {totalCoupons > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-700 dark:text-purple-300 font-medium text-sm">🎟️ Coupons Available</span>
                    {!appliedCoupon ? (
                      <button
                        onClick={() => setShowCouponPicker(!showCouponPicker)}
                        className="text-purple-600 dark:text-purple-400 text-sm font-bold hover:underline"
                      >
                        Use Coupon
                      </button>
                    ) : (
                      <button
                        onClick={removeCoupon}
                        className="text-red-500 text-sm font-bold hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {/* Coupon Picker */}
                  {showCouponPicker && !appliedCoupon && (
                    <div className="mt-3 space-y-2">
                      {coupons.discount30 > 0 && (
                        <button
                          onClick={() => applyCoupon('discount30')}
                          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded text-sm font-bold"
                        >
                          30% OFF ({coupons.discount30} available)
                        </button>
                      )}
                      {coupons.discount50 > 0 && (
                        <button
                          onClick={() => applyCoupon('discount50')}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-sm font-bold"
                        >
                          50% OFF ({coupons.discount50} available)
                        </button>
                      )}
                      {coupons.discount100 > 0 && (
                        <button
                          onClick={() => applyCoupon('discount100')}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-2 rounded text-sm font-bold"
                        >
                          FREE! 100% OFF ({coupons.discount100} available)
                        </button>
                      )}
                    </div>
                  )}

                  {/* Applied Coupon Display */}
                  {appliedCoupon && (
                    <div className="mt-2 text-green-600 dark:text-green-400 font-bold text-sm">
                      ✓ {getDiscountLabel(appliedCoupon)} applied!
                    </div>
                  )}
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span>${cartSubtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                    <span>Discount ({getDiscountLabel(appliedCoupon)}):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                  <span>Tax ({effectiveTaxRateLabel}):</span>
                  <span>+${effectiveTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white pt-2 border-t dark:border-gray-700">
                  <span>Total:</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                PAY ${finalTotal.toFixed(2)}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

