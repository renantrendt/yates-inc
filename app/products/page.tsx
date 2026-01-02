import ProductCard from '@/components/ProductCard';
import { products } from '@/utils/products';
import Link from 'next/link';

export default function ProductsPage() {
  return (
    <div className="min-h-screen py-8 sm:py-12 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-gray-900 dark:text-white">Our Products</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product) => (
            <div key={product.id} className="relative">
              {product.isCustom && (
                <span className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-green-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold z-10 shadow-lg">
                  NEW
                </span>
              )}
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Premium Products Link */}
        <div className="mt-16 mb-8">
          <div className="relative">
            {/* Decorative line */}
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-gray-50 dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Scroll down for more
              </span>
            </div>
          </div>

          <Link href="/products/premium" className="block mt-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-black via-gray-900 to-black border-2 border-yellow-500/30 hover:border-yellow-500/70 transition-all duration-500 group cursor-pointer">
              {/* Gold shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              {/* Content */}
              <div className="relative px-8 py-12 text-center">
                {/* Sparkles */}
                <div className="absolute top-4 left-8 text-yellow-500 text-xl opacity-60 group-hover:opacity-100 transition-opacity">✦</div>
                <div className="absolute top-6 right-12 text-yellow-400 text-lg opacity-40 group-hover:opacity-80 transition-opacity">✧</div>
                <div className="absolute bottom-4 left-1/4 text-yellow-600 text-sm opacity-50 group-hover:opacity-90 transition-opacity">✦</div>
                <div className="absolute bottom-6 right-1/3 text-yellow-300 text-lg opacity-30 group-hover:opacity-70 transition-opacity">✧</div>

                <div className="text-yellow-500/60 text-sm uppercase tracking-[0.3em] mb-2">
                  Exclusive Access
                </div>
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent mb-3">
                  PREMIUM COLLECTION
                </h2>
                <p className="text-yellow-100/50 max-w-md mx-auto mb-4">
                  Luxury vehicles, rare timepieces, and investment-grade assets. For the elite.
                </p>
                
                {/* Arrow indicator */}
                <div className="flex items-center justify-center gap-2 text-yellow-500 group-hover:text-yellow-400 transition-colors">
                  <span className="text-sm font-medium uppercase tracking-wider">Enter</span>
                  <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-yellow-500/40 group-hover:border-yellow-500/80 transition-colors rounded-tl-2xl" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-yellow-500/40 group-hover:border-yellow-500/80 transition-colors rounded-br-2xl" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

