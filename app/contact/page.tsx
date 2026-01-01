'use client';

import { useEffect, useState } from 'react';

export default function ContactPage() {
  const backgrounds = ['/misc/dinosaur.png', '/fights/100Gvs1M.png', '/characters/thanos.png'];
  const [currentBg, setCurrentBg] = useState(0);

  // Auto-scroll through backgrounds every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen py-8 sm:py-12 relative overflow-hidden">
      {/* Auto-scrolling background images */}
      {backgrounds.map((bg, index) => (
        <div
          key={bg}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${bg})`,
            opacity: currentBg === index ? 1 : 0,
            zIndex: currentBg === index ? 1 : 0,
          }}
        />
      ))}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50 z-10" />

      {/* Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-white drop-shadow-lg">Contact Us</h1>
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl p-4 sm:p-6 md:p-8">
          <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none">
            <p className="text-base sm:text-lg text-gray-800 dark:text-gray-300 leading-relaxed">
              You are able to contact us by either:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-gray-800 dark:text-gray-300 mt-4">
              <li>Being at our HQ at MMS</li>
              <li>OR by some way shape or form, getting our contact</li>
            </ul>
            <p className="text-base sm:text-lg text-gray-800 dark:text-gray-300 leading-relaxed mt-6">
              If you do, we&apos;ll have a pleasure on getting your money back or simply talking to ya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

