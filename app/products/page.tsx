import ProductCard from '@/components/ProductCard';
import { products } from '@/utils/products';

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
      </div>
    </div>
  );
}

