'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';
import WanderingTraderShopModal from './WanderingTraderShopModal';

// DVD-style bouncing animation
const TRADER_SIZE = 80; // pixels
const SPEED = 1.5; // pixels per frame
const FRAME_RATE = 1000 / 60; // ~60fps

export default function WanderingTrader() {
  const { 
    gameState, 
    isWanderingTraderVisible, 
    getWanderingTraderTimeLeft,
    dismissWanderingTrader,
    clearWanderingTraderTimer,
  } = useGame();
  
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [velocity, setVelocity] = useState({ vx: SPEED, vy: SPEED });
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize random starting position and velocity
  useEffect(() => {
    if (isWanderingTraderVisible()) {
      // Random starting position
      const startX = Math.random() * (window.innerWidth - TRADER_SIZE - 100) + 50;
      const startY = Math.random() * (window.innerHeight - TRADER_SIZE - 100) + 50;
      setPosition({ x: startX, y: startY });
      
      // Random starting velocity direction
      const angle = Math.random() * Math.PI * 2;
      setVelocity({ 
        vx: Math.cos(angle) * SPEED, 
        vy: Math.sin(angle) * SPEED 
      });
    }
  }, [gameState.wanderingTraderVisible]);

  // DVD-style bouncing animation
  useEffect(() => {
    if (!isWanderingTraderVisible() || isShopOpen) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      setPosition(prev => {
        let newX = prev.x + velocity.vx;
        let newY = prev.y + velocity.vy;
        let newVx = velocity.vx;
        let newVy = velocity.vy;

        // Bounce off edges - keep away from bottom UI (stats panel ~180px from bottom)
        const maxX = window.innerWidth - TRADER_SIZE - 20;
        const maxY = window.innerHeight - TRADER_SIZE - 200; // Stay above bottom stats
        const minX = 20;
        const minY = 80; // Stay below top HUD

        if (newX <= minX || newX >= maxX) {
          newVx = -velocity.vx;
          newX = newX <= minX ? minX : maxX;
        }
        if (newY <= minY || newY >= maxY) {
          newVy = -velocity.vy;
          newY = newY <= minY ? minY : maxY;
        }

        // Update velocity if bounced
        if (newVx !== velocity.vx || newVy !== velocity.vy) {
          setVelocity({ vx: newVx, vy: newVy });
        }

        return { x: newX, y: newY };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isWanderingTraderVisible, isShopOpen, velocity]);

  // Update time left countdown
  useEffect(() => {
    if (!isWanderingTraderVisible()) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil(getWanderingTraderTimeLeft() / 1000);
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [isWanderingTraderVisible, getWanderingTraderTimeLeft]);

  const handleClick = useCallback(() => {
    clearWanderingTraderTimer(); // Stop the timer - player interacted
    setIsShopOpen(true);
  }, [clearWanderingTraderTimer]);

  const handleCloseShop = useCallback(() => {
    setIsShopOpen(false);
    // Despawn trader after user closes the shop (they interacted, so timer was cleared)
    dismissWanderingTrader();
  }, [dismissWanderingTrader]);

  if (!isWanderingTraderVisible()) return null;

  return (
    <>
      {/* Wandering Trader */}
      <div
        ref={containerRef}
        className="fixed z-[140] cursor-pointer transition-transform hover:scale-110"
        style={{
          left: position.x,
          top: position.y,
          width: TRADER_SIZE,
          height: TRADER_SIZE + 20,
        }}
        onClick={handleClick}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 -m-2 bg-purple-500/30 rounded-full blur-xl animate-pulse" />
        
        {/* Mysterious particles */}
        <div className="absolute inset-0 -m-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full animate-float-particle"
              style={{
                left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 50}%`,
                top: `${50 + Math.sin(i * 60 * Math.PI / 180) * 50}%`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        {/* Trader image */}
        <div className="relative w-full h-full">
          <Image
            src="/game/characters/wonderingtrader.png"
            alt="Wandering Trader"
            fill
            className="object-contain drop-shadow-[0_0_15px_rgba(147,51,234,0.6)]"
            unoptimized
          />
        </div>

        {/* Time remaining - only show if timer is active (not interacted yet) */}
        {timeLeft > 0 && !isShopOpen && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-purple-300 text-xs font-bold whitespace-nowrap bg-black/70 px-2 py-0.5 rounded-full">
            ⏱️ {timeLeft}s
          </div>
        )}

        {/* Click hint - hidden on mobile to reduce clutter */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-purple-300 text-xs font-bold whitespace-nowrap animate-bounce hidden sm:block">
          🛒 TRADE?
        </div>
      </div>

      {/* Shop Modal */}
      <WanderingTraderShopModal 
        isOpen={isShopOpen} 
        onClose={handleCloseShop}
      />

      {/* Animations */}
      <style jsx global>{`
        @keyframes float-particle {
          0%, 100% {
            opacity: 0.3;
            transform: translateY(0) scale(0.8);
          }
          50% {
            opacity: 1;
            transform: translateY(-10px) scale(1);
          }
        }
        
        .animate-float-particle {
          animation: float-particle 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
