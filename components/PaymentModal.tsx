'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { calculateDeliveryTime } from '@/utils/products';
import Link from 'next/link';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentMethod = 'Pix' | 'PayPal' | 'Apple pay' | 'Google pay' | 'Venmo' | 'Wells Fargo' | 'Chase' | null;

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { cart, clearCart, cartTotal } = useCart();
  const [step, setStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const paymentMethods: PaymentMethod[] = [
    'Pix',
    'PayPal',
    'Apple pay',
    'Google pay',
    'Venmo',
    'Wells Fargo',
    'Chase',
  ];

  const handlePayment = () => {
    if (!tosAccepted || !cardNumber || !expirationDate || !cvv || !cardName) {
      return;
    }
    setStep('success');
  };

  const handleClose = () => {
    setStep('cart');
    setSelectedMethod(null);
    setTosAccepted(false);
    setCardNumber('');
    setExpirationDate('');
    setCvv('');
    setCardName('');
    onClose();
  };

  const handleGoHome = () => {
    clearCart();
    handleClose();
    window.location.href = '/';
  };

  if (!isOpen) return null;

  const deliveryTime = calculateDeliveryTime(cart.length);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Step 1: Cart Review */}
        {step === 'cart' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Review Your Order</h2>
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-900 font-medium">
                    {item.product.name} <span className="text-gray-600">x{item.quantity}</span>
                  </span>
                  <span className="text-gray-900 font-semibold">${(item.product.priceFloat * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-gray-300 pt-4 mb-8">
              <div className="flex justify-between font-bold text-xl">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">${cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('payment')}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Method Selection */}
        {step === 'payment' && (
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Pay: ${cartTotal.toFixed(2)}</h2>
              
              {/* Warning Box - Top Right */}
              <div className="bg-red-50 border-2 border-red-500 p-3 rounded-lg max-w-xs">
                <p className="font-bold text-red-700 text-center text-sm leading-tight">
                  IMPORTANT TEXT:<br />
                  DO NOT PUT AN ACTUAL<br />
                  NUMBER FROM AN<br />
                  EXISTING CARD!!!!
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-8">
              <h3 className="font-semibold mb-4 text-gray-900 text-lg">Select Payment Method:</h3>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    onClick={() => setSelectedMethod(method)}
                    className={`p-3 border-2 rounded-lg font-medium transition ${
                      selectedMethod === method
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-blue-400 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Information Form */}
            {selectedMethod && (
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Card number (16 digits on the front)
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900">
                      Expiration date
                    </label>
                    <input
                      type="text"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900">
                      CVV/CVC
                    </label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      maxLength={4}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Name on the card
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* TOS Checkbox */}
            <div className="mb-8 bg-gray-50 p-4 rounded-lg">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tosAccepted}
                  onChange={(e) => setTosAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5 cursor-pointer"
                />
                <span className="text-sm text-gray-900">
                  Please click in the check box, to agree to our{' '}
                  <Link href="/tos" target="_blank" className="text-blue-600 underline hover:text-blue-800 font-medium">
                    Terms of Service
                  </Link>
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setStep('cart')}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                disabled={!tosAccepted || !selectedMethod || !cardNumber || !expirationDate || !cvv || !cardName}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition"
              >
                PAY
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Message */}
        {step === 'success' && (
          <div className="p-6 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold mb-2">Thank you!</h2>
              <p className="text-lg">
                Your order will be delivered in <strong>{deliveryTime}</strong>
              </p>
            </div>
            <button
              onClick={handleGoHome}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700"
            >
              Go back home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

