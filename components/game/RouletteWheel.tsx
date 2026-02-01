'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '@/contexts/GameContext';
import { RouletteResult, ROULETTE_SEGMENTS } from '@/types/game';

interface RouletteWheelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Wheel segment colors matching the template image
const SEGMENT_COLORS = [
  '#22c55e', // green - Nothing
  '#7c3aed', // purple - Nothing
  '#ef4444', // red - Nothing
  '#eab308', // yellow - 80% money loss
  '#eab308', // yellow - Special trinket
  '#3b82f6', // blue - 5 Stokens
  '#f97316', // orange - nothing
  '#f97316', // orange - 10 prestige tokens
];

// Segment labels
const SEGMENT_LABELS = [
  'NOthing',
  'Nothing',
  'Nothing',
  '80% of your money',
  'A special trinket',
  '5 Stokens',
  'nothing',
  '10 prestige tokens',
];

export default function RouletteWheel({ isOpen, onClose }: RouletteWheelProps) {
  const { spinRouletteWheel } = useGame();
  const [mounted, setMounted] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<RouletteResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsSpinning(false);
      setRotation(0);
      setResult(null);
      setShowResult(false);
    }
  }, [isOpen]);

  const handleSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);

    // Get the result first
    const spinResult = spinRouletteWheel();
    setResult(spinResult);

    // Calculate which segment to land on
    let targetSegmentIndex = 0;
    switch (spinResult.segment) {
      case 'nothing':
        // Random nothing segment (0, 1, 2, or 6)
        const nothingSegments = [0, 1, 2, 6];
        targetSegmentIndex = nothingSegments[Math.floor(Math.random() * nothingSegments.length)];
        break;
      case 'money_loss':
        targetSegmentIndex = 3; // 80% money loss
        break;
      case 'special_trinket':
        targetSegmentIndex = 4; // Special trinket
        break;
      case 'stokens':
        targetSegmentIndex = 5; // 5 Stokens
        break;
      case 'prestige_tokens':
        targetSegmentIndex = 7; // 10 prestige tokens
        break;
    }

    // Calculate rotation angle
    // Each segment is 45 degrees (360/8)
    const segmentAngle = 360 / 8;
    // Target angle for the segment (with offset to center on segment)
    const targetAngle = targetSegmentIndex * segmentAngle + segmentAngle / 2;
    // Add multiple full rotations for effect (5-8 full spins)
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    // Final rotation (spin counter-clockwise so result is at top)
    const finalRotation = fullSpins * 360 + (360 - targetAngle) + 90; // +90 to align with pointer at top

    setRotation(finalRotation);

    // Show result after spin completes
    setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
    }, 5000); // 5 second spin
  };

  const getResultMessage = (): { emoji: string; title: string; description: string; color: string } => {
    if (!result) return { emoji: '?', title: '', description: '', color: 'text-white' };

    switch (result.segment) {
      case 'nothing':
        return {
          emoji: '😐',
          title: 'Nothing...',
          description: 'Better luck next time!',
          color: 'text-gray-400',
        };
      case 'money_loss':
        return {
          emoji: '💀',
          title: 'Ouch! -80% Money',
          description: 'The wheel takes what it wants...',
          color: 'text-red-400',
        };
      case 'special_trinket':
        return {
          emoji: '🎁',
          title: "Fortune's Gambit!",
          description: 'You won the legendary trinket! +100% ALL stats!',
          color: 'text-yellow-400',
        };
      case 'stokens':
        return {
          emoji: '💎',
          title: '+5 Stokens!',
          description: 'Spend them wisely...',
          color: 'text-blue-400',
        };
      case 'prestige_tokens':
        return {
          emoji: '⭐',
          title: '+10 Prestige Tokens!',
          description: 'Fortune smiles upon you!',
          color: 'text-purple-400',
        };
      default:
        return { emoji: '?', title: 'Unknown', description: '', color: 'text-white' };
    }
  };

  if (!mounted || !isOpen) return null;

  const resultInfo = getResultMessage();

  return createPortal(
    <div 
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
    >
      <div className="relative max-w-lg w-full">
        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-purple-300 mb-6">
          🎰 Wheel of Fortune 🎰
        </h2>

        {/* Wheel Container */}
        <div className="relative mx-auto" style={{ width: 320, height: 320 }}>
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />
          </div>

          {/* Wheel */}
          <div
            ref={wheelRef}
            className="relative w-full h-full rounded-full border-8 border-gray-700 shadow-2xl overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            }}
          >
            {/* SVG Wheel */}
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {SEGMENT_COLORS.map((color, i) => {
                const angle = (360 / 8) * i;
                const startAngle = (angle - 90) * (Math.PI / 180);
                const endAngle = (angle + 45 - 90) * (Math.PI / 180);
                
                const x1 = 100 + 100 * Math.cos(startAngle);
                const y1 = 100 + 100 * Math.sin(startAngle);
                const x2 = 100 + 100 * Math.cos(endAngle);
                const y2 = 100 + 100 * Math.sin(endAngle);

                const pathD = `M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`;

                // Text position (middle of segment)
                const midAngle = (angle + 22.5 - 90) * (Math.PI / 180);
                const textX = 100 + 60 * Math.cos(midAngle);
                const textY = 100 + 60 * Math.sin(midAngle);
                const textRotation = angle + 22.5;

                return (
                  <g key={i}>
                    <path d={pathD} fill={color} stroke="#333" strokeWidth="1" />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                      style={{ textShadow: '1px 1px 2px black' }}
                    >
                      {SEGMENT_LABELS[i].length > 12 
                        ? SEGMENT_LABELS[i].slice(0, 10) + '...'
                        : SEGMENT_LABELS[i]
                      }
                    </text>
                  </g>
                );
              })}
              {/* Center circle */}
              <circle cx="100" cy="100" r="20" fill="white" stroke="#333" strokeWidth="2" />
              <text
                x="100"
                y="100"
                fill="#333"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                SPIN
              </text>
            </svg>
          </div>
        </div>

        {/* Spin Button / Result */}
        <div className="mt-8 text-center">
          {!showResult ? (
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className={`px-8 py-4 text-xl font-bold rounded-full transition-all ${
                isSpinning
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-purple-500/50'
              }`}
            >
              {isSpinning ? '🎡 Spinning...' : '🎰 SPIN THE WHEEL!'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">{resultInfo.emoji}</div>
              <h3 className={`text-2xl font-bold ${resultInfo.color}`}>{resultInfo.title}</h3>
              <p className="text-gray-400">{resultInfo.description}</p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          )}
        </div>

        {/* Decorative sparkles */}
        {showResult && result?.segment === 'special_trinket' && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: '1.5s',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
