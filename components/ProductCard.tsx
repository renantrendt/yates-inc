'use client';

import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  
  const hasMultipleImages = product.images && product.images.length > 1;
  const displayImages = product.images || [product.image];
  const currentImage = displayImages[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  // Handle touch/swipe events
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swiped left
      nextImage();
    }
    if (touchStart - touchEnd < -50) {
      // Swiped right
      prevImage();
    }
  };

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStart) {
      setTouchEnd(e.clientX);
    }
  };

  const handleMouseUp = () => {
    if (touchStart - touchEnd > 50) {
      nextImage();
    }
    if (touchStart - touchEnd < -50) {
      prevImage();
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Handle two-finger trackpad scroll with cooldown
  const handleWheel = (e: React.WheelEvent) => {
    if (isScrolling) return; // Prevent multiple scrolls
    
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // Horizontal scroll detected
      e.preventDefault();
      if (e.deltaX > 20) {
        setIsScrolling(true);
        nextImage();
        setTimeout(() => setIsScrolling(false), 500); // 500ms cooldown
      } else if (e.deltaX < -20) {
        setIsScrolling(true);
        prevImage();
        setTimeout(() => setIsScrolling(false), 500); // 500ms cooldown
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all">
      {/* Image with carousel */}
      <div 
        className="relative w-full h-48 sm:h-56 bg-gray-100 dark:bg-gray-700 cursor-grab active:cursor-grabbing select-none touch-manipulation"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {currentImage === 'N/A' ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl sm:text-4xl font-bold text-gray-400 dark:text-gray-500">N/A</span>
          </div>
        ) : (
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-48 sm:h-56 object-cover pointer-events-none"
          />
        )}
        
        {/* Carousel controls */}
        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition touch-manipulation text-xl sm:text-2xl"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition touch-manipulation text-xl sm:text-2xl"
            >
              ›
            </button>
            
            {/* Dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {displayImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition touch-manipulation ${
                    index === currentImageIndex
                      ? 'bg-white w-6'
                      : 'bg-white/50 hover:bg-white/75 w-2'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">{product.name}</h3>
        
        {product.isCustom ? (
          <>
            <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-3">
              Made by professional editor{' '}
              <Link href="/employees#MMMM" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 underline">
                Mr. MMMM
              </Link>
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Custom Pricing</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Contact Michael for pricing</p>
          </>
        ) : (
          <>
            <div className="group relative inline-block mb-4">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white cursor-default">
                {product.price}
              </p>
              {product.hoverText && (
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 dark:bg-gray-700 text-white text-xs rounded py-2 px-3 whitespace-nowrap z-10 shadow-lg max-w-[200px] sm:max-w-none">
                  {product.hoverText}
                </div>
              )}
            </div>
            {product.hasAddToCart && (
              <button
                onClick={() => addToCart(product)}
                className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition text-sm sm:text-base touch-manipulation"
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

