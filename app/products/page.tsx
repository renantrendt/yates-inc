import ProductCard from '@/components/ProductCard';
import { products } from '@/utils/products';

export default function ProductsPage() {
  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Our Products</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="relative">
              {product.isCustom && (
                <span className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold z-10 shadow-lg">
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

