'use client';

import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-56 object-cover"
      />
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{product.name}</h3>
        
        {product.isCustom ? (
          <>
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
              Made by professional editor{' '}
              <Link href="/employees#MMMM" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 underline">
                Mr. MMMM
              </Link>
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Custom Pricing</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Contact Michael for pricing</p>
          </>
        ) : (
          <>
            <div className="group relative inline-block mb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white cursor-default">
                {product.price}
              </p>
              {product.hoverText && (
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 dark:bg-gray-700 text-white text-xs rounded py-2 px-3 whitespace-nowrap z-10 shadow-lg">
                  {product.hoverText}
                </div>
              )}
            </div>
            {product.hasAddToCart && (
              <button
                onClick={() => addToCart(product)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-base"
              >
                Add to Cart
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

