'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface GameCutsceneProps {
  onComplete: () => void;
}

type CutscenePhase = 'entering' | 'walking' | 'meeting' | 'teleporting' | 'done';

export default function GameCutscene({ onComplete }: GameCutsceneProps) {
  const [phase, setPhase] = useState<CutscenePhase>('entering');
  const [stevePosition, setStevePosition] = useState(0);
  const [showNPC, setShowNPC] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showSkip, setShowSkip] = useState(false);

  const dialogues = [
    { speaker: 'npc', text: "Hey there, miner! Welcome to the caves." },
    { speaker: 'npc', text: "I'm here to help you get started." },
    { speaker: 'npc', text: "Click on rocks to mine them and earn Yates Dollars!" },
    { speaker: 'npc', text: "Ready to start? Let me teleport you to the mining area..." },
  ];

  // Show skip button after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-advance cutscene phases
  useEffect(() => {
    if (phase === 'entering') {
      const timer = setTimeout(() => setPhase('walking'), 500);
      return () => clearTimeout(timer);
    }

    if (phase === 'walking') {
      // Animate Steve walking
      const interval = setInterval(() => {
        setStevePosition((prev) => {
          if (prev >= 60) {
            clearInterval(interval);
            setPhase('meeting');
            return prev;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }

    if (phase === 'meeting') {
      setShowNPC(true);
    }

    if (phase === 'teleporting') {
      const timer = setTimeout(() => {
        setPhase('done');
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const handleDialogueClick = () => {
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex((prev) => prev + 1);
    } else {
      setPhase('teleporting');
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Cave/Tunnel Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, 
              #1a0f0a 0%, 
              #2d1f15 20%, 
              #3d2817 50%, 
              #2d1f15 80%, 
              #1a0f0a 100%
            )
          `,
        }}
      >
        {/* Tunnel walls */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(90deg, 
                rgba(0,0,0,0.8) 0%, 
                transparent 20%, 
                transparent 80%, 
                rgba(0,0,0,0.8) 100%
              )
            `,
          }}
        />

        {/* Ground */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{
            background: 'linear-gradient(180deg, #4a3728 0%, #3d2817 100%)',
          }}
        />

        {/* Torch glow effects */}
        <div 
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(255,150,50,0.3) 0%, transparent 70%)',
          }}
        />
        <div 
          className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(255,150,50,0.3) 0%, transparent 70%)',
            animationDelay: '0.5s',
          }}
        />
      </div>

      {/* Steve Character */}
      <div 
        className="absolute bottom-32 transition-all duration-100"
        style={{ 
          left: `${stevePosition}%`,
          transform: 'translateX(-50%)',
        }}
      >
        <div className="relative w-24 h-32">
          <Image
            src="/characters/steve.png"
            alt="Steve"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* NPC Miner */}
      {showNPC && (
        <div 
          className="absolute bottom-32 right-[25%] animate-fade-in"
          style={{ transform: 'translateX(50%)' }}
        >
          <div className="relative w-24 h-32">
            <Image
              src="/game/characters/npcminer.png"
              alt="NPC Miner"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Dialogue Box */}
      {phase === 'meeting' && (
        <div 
          className="absolute bottom-48 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 animate-fade-in cursor-pointer"
          onClick={handleDialogueClick}
        >
          <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-amber-600/30">
            <p className="text-amber-400 font-bold mb-2">
              {dialogues[dialogueIndex].speaker === 'npc' ? '⛏️ Miner' : '🧑 Steve'}
            </p>
            <p className="text-white text-lg">
              {dialogues[dialogueIndex].text}
            </p>
            <p className="text-gray-500 text-sm mt-4 text-right">
              Click to continue...
            </p>
          </div>
        </div>
      )}

      {/* Teleport Effect */}
      {phase === 'teleporting' && (
        <div className="absolute inset-0 animate-flash bg-white/80" />
      )}

      {/* Skip Button */}
      {showSkip && phase !== 'teleporting' && phase !== 'done' && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-lg transition-colors z-50"
        >
          Skip →
        </button>
      )}

      {/* Title */}
      {phase === 'entering' && (
        <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-amber-400 mb-4 drop-shadow-lg">
              ⛏️ THE MINES ⛏️
            </h1>
            <p className="text-gray-300 text-xl">Entering the caves...</p>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 1; }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .animate-flash {
          animation: flash 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

