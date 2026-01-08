'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';
import { MINER_VISIBLE_MAX } from '@/types/game';
import { ROCKS, getRockById } from '@/lib/gameData';

interface FloatingMoney {
  id: number;
  amount: number;
}

export default function MinerSprites() {
  const { gameState } = useGame();
  const [floatingMoney, setFloatingMoney] = useState<FloatingMoney[]>([]);
  const [swingPhase, setSwingPhase] = useState(0);
  const lastRocksMinedRef = useRef(gameState.rocksMinedCount);
  const floatingIdRef = useRef(0);

  // Number of visible miners (max 10)
  const visibleCount = Math.min(gameState.minerCount, MINER_VISIBLE_MAX);

  // Track when rocks are mined to show floating money
  useEffect(() => {
    if (gameState.rocksMinedCount > lastRocksMinedRef.current && gameState.minerCount > 0) {
      const rock = getRockById(gameState.currentRockId) || ROCKS[0];
      const money = Math.ceil(rock.moneyPerBreak * gameState.prestigeMultiplier);

      const id = floatingIdRef.current++;
      setFloatingMoney(prev => [...prev, { id, amount: money }]);

      setTimeout(() => {
        setFloatingMoney(prev => prev.filter(f => f.id !== id));
      }, 1500);
    }
    lastRocksMinedRef.current = gameState.rocksMinedCount;
  }, [gameState.rocksMinedCount, gameState.minerCount, gameState.currentRockId, gameState.prestigeMultiplier]);

  // Swing animation for miners (subtle animation while staying still)
  useEffect(() => {
    if (gameState.minerCount === 0) return;
    const interval = setInterval(() => {
      setSwingPhase(prev => (prev + 1) % 20);
    }, 100);
    return () => clearInterval(interval);
  }, [gameState.minerCount]);

  if (gameState.minerCount === 0) return null;

  // Create array of visible miners
  const minerArray = Array.from({ length: visibleCount }, (_, i) => i);

  // Calculate static positions around the rock (screen center)
  const getMinerPosition = (index: number) => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Cluster miners to the right of the bottom UI panel (stats area)
    const centerX = vw / 2;
    const statsPanelWidth = 672; // max-w-2xl is about 672px
    const startX = centerX + (statsPanelWidth / 2) + 40; // Start to the right of the panel
    const startY = vh - 100; // Near bottom

    // Create a cloud/cluster effect
    const col = index % 5;
    const row = Math.floor(index / 5);

    // Add some randomness to make it look natural but organized
    const offsetX = (col * 25) + (Math.sin(index * 13) * 10);
    const offsetY = (row * -20) + (Math.cos(index * 7) * 5); // Stack upwards

    const x = startX + offsetX;
    const y = startY + offsetY;

    return { x, y };
  };

  return (
    <>
      {/* Static miner sprites arranged around the rock */}
      {minerArray.map((_, i) => {
        const pos = getMinerPosition(i);
        const isSwinging = (swingPhase + i * 3) % 20 < 10;

        return (
          <div
            key={i}
            className="fixed pointer-events-none z-20"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: `translate(-50%, -50%) rotate(${isSwinging ? -15 : 0}deg)`,
              transition: 'transform 0.1s ease-in-out',
            }}
          >
            <Image
              src="/game/characters/minerworker.png"
              alt="Miner"
              width={48}
              height={48}
              className="drop-shadow-lg"
            />
          </div>
        );
      })}

      {/* Show count if more than visible - REMOVED per user request */}
    </>
  );
}

// Miner purchase button component
export function MinerPurchaseButton() {
  const { gameState, buyMiner, getMinerCost } = useGame();
  const cost = getMinerCost();
  const canAfford = gameState.yatesDollars >= cost;
  const atMax = gameState.minerCount >= 360;

  const formatCost = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  return (
    <button
      onClick={() => buyMiner()}
      disabled={!canAfford || atMax}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${canAfford && !atMax
        ? 'bg-amber-600 hover:bg-amber-500 text-white'
        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
    >
      <span>⛏️</span>
      <div className="text-left">
        <p className="text-sm">Hire Miner</p>
        <p className="text-xs opacity-80">
          {atMax ? 'MAX (360)' : `$${formatCost(cost)}`}
        </p>
      </div>
      <span className="text-xs bg-black/30 px-2 py-0.5 rounded">
        {gameState.minerCount}/360
      </span>
    </button>
  );
}
