'use client';

import { useState } from 'react';
import Image from 'next/image';
import { GamePath } from '@/types/game';

interface PathSelectionModalProps {
  onSelectPath: (path: GamePath) => void;
}

export default function PathSelectionModal({ onSelectPath }: PathSelectionModalProps) {
  const [hoveredPath, setHoveredPath] = useState<GamePath>(null);
  const [selectedPath, setSelectedPath] = useState<GamePath>(null);
  const [confirming, setConfirming] = useState(false);

  const handlePathClick = (path: 'light' | 'darkness') => {
    setSelectedPath(path);
    setConfirming(true);
  };

  const handleConfirm = () => {
    if (selectedPath) {
      onSelectPath(selectedPath);
    }
  };

  const handleCancel = () => {
    setSelectedPath(null);
    setConfirming(false);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Light side gradient */}
        <div 
          className={`absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-amber-500/20 via-yellow-400/10 to-transparent transition-opacity duration-500 ${
            hoveredPath === 'light' ? 'opacity-100' : 'opacity-30'
          }`}
        />
        {/* Dark side gradient */}
        <div 
          className={`absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-purple-900/30 via-red-900/20 to-transparent transition-opacity duration-500 ${
            hoveredPath === 'darkness' ? 'opacity-100' : 'opacity-30'
          }`}
        />
        {/* Center divider */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent" />
      </div>

      {/* Confirmation Modal */}
      {confirming && selectedPath && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/80">
          <div className={`p-8 rounded-2xl border-2 max-w-md text-center ${
            selectedPath === 'light' 
              ? 'bg-gradient-to-b from-amber-900/80 to-yellow-900/60 border-yellow-500'
              : 'bg-gradient-to-b from-purple-900/80 to-red-900/60 border-red-500'
          }`}>
            <div className="text-6xl mb-4">
              {selectedPath === 'light' ? '☀️' : '🌑'}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Choose the Path of {selectedPath === 'light' ? 'Light' : 'Darkness'}?
            </h3>
            <p className="text-gray-300 mb-6">
              This choice is <span className="text-red-400 font-bold">permanent</span>. 
              You cannot change your path once chosen.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-6 py-3 font-bold rounded-xl transition-all transform hover:scale-105 ${
                  selectedPath === 'light'
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black'
                    : 'bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Choose Your Path
          </h1>
          <p className="text-gray-400 text-lg">
            Your first prestige has awakened something within you...
          </p>
        </div>

        {/* Path Selection */}
        <div className="flex justify-center gap-8 md:gap-16">
          {/* Light Path */}
          <button
            onClick={() => handlePathClick('light')}
            onMouseEnter={() => setHoveredPath('light')}
            onMouseLeave={() => setHoveredPath(null)}
            className={`group relative flex flex-col items-center p-8 rounded-3xl border-4 transition-all duration-300 transform hover:scale-105 ${
              hoveredPath === 'light'
                ? 'border-yellow-400 bg-yellow-500/10 shadow-[0_0_60px_rgba(234,179,8,0.3)]'
                : 'border-yellow-600/50 bg-yellow-900/10'
            }`}
          >
            {/* Glow effect */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-t from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            {/* Icon */}
            <div className="relative w-32 h-32 mb-6">
              <div className={`absolute inset-0 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 blur-xl opacity-50 group-hover:opacity-80 transition-opacity`} />
              <div className="relative flex items-center justify-center w-full h-full text-8xl">
                ☀️
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-3xl font-bold text-yellow-400 mb-3 group-hover:text-yellow-300 transition-colors">
              Light
            </h2>
            
            {/* Mysterious description - don't reveal what it does */}
            <p className="text-gray-400 text-center max-w-xs group-hover:text-gray-300 transition-colors">
              Embrace the radiance. Walk the path of the divine.
            </p>
            
            {/* Hint icons */}
            <div className="mt-4 flex gap-2 text-2xl opacity-50 group-hover:opacity-80 transition-opacity">
              <span title="???">✨</span>
              <span title="???">👼</span>
              <span title="???">💫</span>
            </div>
          </button>

          {/* Darkness Path */}
          <button
            onClick={() => handlePathClick('darkness')}
            onMouseEnter={() => setHoveredPath('darkness')}
            onMouseLeave={() => setHoveredPath(null)}
            className={`group relative flex flex-col items-center p-8 rounded-3xl border-4 transition-all duration-300 transform hover:scale-105 ${
              hoveredPath === 'darkness'
                ? 'border-red-500 bg-red-900/20 shadow-[0_0_60px_rgba(239,68,68,0.3)]'
                : 'border-purple-600/50 bg-purple-900/10'
            }`}
          >
            {/* Glow effect */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-t from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            {/* Icon */}
            <div className="relative w-32 h-32 mb-6">
              <div className={`absolute inset-0 rounded-full bg-gradient-to-b from-purple-600 to-red-600 blur-xl opacity-50 group-hover:opacity-80 transition-opacity`} />
              <div className="relative flex items-center justify-center w-full h-full text-8xl">
                🌑
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-3xl font-bold text-red-400 mb-3 group-hover:text-red-300 transition-colors">
              Darkness
            </h2>
            
            {/* Mysterious description - don't reveal what it does */}
            <p className="text-gray-400 text-center max-w-xs group-hover:text-gray-300 transition-colors">
              Embrace the shadows. Power awaits those who dare.
            </p>
            
            {/* Hint icons */}
            <div className="mt-4 flex gap-2 text-2xl opacity-50 group-hover:opacity-80 transition-opacity">
              <span title="???">😈</span>
              <span title="???">🔥</span>
              <span title="???">🍪</span>
            </div>
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-center text-gray-500 text-sm mt-12">
          Each path unlocks unique abilities, items, and secrets...
        </p>
      </div>
    </div>
  );
}
