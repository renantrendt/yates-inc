'use client';

import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { ActiveBuff, ActiveDebuff } from '@/types/game';

export default function BuffBar() {
  const { getActiveBuffs, getActiveDebuffs, isWizardRitualActive, gameState } = useGame();
  const [buffs, setBuffs] = useState<ActiveBuff[]>([]);
  const [debuffs, setDebuffs] = useState<ActiveDebuff[]>([]);
  const [now, setNow] = useState(Date.now());

  // Update buffs and time every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      setBuffs(getActiveBuffs());
      setDebuffs(getActiveDebuffs());
      setNow(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, [getActiveBuffs, getActiveDebuffs]);

  // Check for wizard ritual
  const ritualActive = isWizardRitualActive();
  const ritualTimeLeft = ritualActive && gameState.buildings.wizard_tower.ritualEndTime 
    ? Math.max(0, gameState.buildings.wizard_tower.ritualEndTime - now) 
    : 0;

  // Check for sacrifice buff
  const sacrificeBuff = gameState.sacrificeBuff;
  const sacrificeTimeLeft = sacrificeBuff 
    ? Math.max(0, sacrificeBuff.endsAt - now) 
    : 0;

  // Format time remaining
  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  // Calculate progress percentage
  const getProgress = (buff: ActiveBuff): number => {
    const elapsed = now - buff.startTime;
    return Math.max(0, Math.min(100, (1 - elapsed / buff.duration) * 100));
  };

  // Combine all active effects
  const allEffects: { 
    id: string; 
    name: string; 
    icon: string; 
    timeLeft: number; 
    progress: number;
    type: 'buff' | 'debuff' | 'ritual' | 'sacrifice';
  }[] = [];

  // Add regular buffs
  buffs.forEach(buff => {
    const timeLeft = Math.max(0, (buff.startTime + buff.duration) - now);
    allEffects.push({
      id: buff.id,
      name: buff.name,
      icon: buff.icon,
      timeLeft,
      progress: getProgress(buff),
      type: 'buff',
    });
  });

  // Add wizard ritual
  if (ritualActive) {
    allEffects.push({
      id: 'wizard_ritual',
      name: 'Dark Ritual',
      icon: '🔮',
      timeLeft: ritualTimeLeft,
      progress: (ritualTimeLeft / 60000) * 100,
      type: 'ritual',
    });
  }

  // Add sacrifice buff
  if (sacrificeBuff && sacrificeTimeLeft > 0) {
    const totalDuration = sacrificeBuff.endsAt - (sacrificeBuff.endsAt - sacrificeTimeLeft);
    allEffects.push({
      id: 'sacrifice_buff',
      name: 'Sacrifice Buff',
      icon: '🩸',
      timeLeft: sacrificeTimeLeft,
      progress: (sacrificeTimeLeft / (sacrificeBuff.endsAt - now + sacrificeTimeLeft)) * 100,
      type: 'sacrifice',
    });
  }

  // Add debuffs
  debuffs.forEach(debuff => {
    if (debuff.duration === null) {
      allEffects.push({
        id: debuff.id,
        name: debuff.name,
        icon: debuff.icon,
        timeLeft: -1, // Permanent
        progress: 100,
        type: 'debuff',
      });
    } else {
      const timeLeft = Math.max(0, (debuff.startTime + debuff.duration) - now);
      allEffects.push({
        id: debuff.id,
        name: debuff.name,
        icon: debuff.icon,
        timeLeft,
        progress: (timeLeft / debuff.duration) * 100,
        type: 'debuff',
      });
    }
  });

  // Don't render if nothing active
  if (allEffects.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
      {allEffects.map(effect => (
        <div 
          key={effect.id}
          className={`relative flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border backdrop-blur-sm ${
            effect.type === 'debuff' 
              ? 'bg-red-900/60 border-red-500/50'
              : effect.type === 'ritual'
                ? 'bg-purple-900/60 border-purple-500/50 animate-pulse'
                : effect.type === 'sacrifice'
                  ? 'bg-red-800/60 border-red-400/50'
                  : 'bg-green-900/60 border-green-500/50'
          }`}
        >
          {/* Progress bar background */}
          <div 
            className={`absolute inset-0 rounded-lg opacity-30 ${
              effect.type === 'debuff' ? 'bg-red-600' : 
              effect.type === 'ritual' ? 'bg-purple-600' :
              effect.type === 'sacrifice' ? 'bg-red-500' :
              'bg-green-600'
            }`}
            style={{ 
              width: `${effect.progress}%`,
              transition: 'width 0.1s linear',
            }}
          />
          
          {/* Content */}
          <span className="text-base sm:text-lg relative z-10">{effect.icon}</span>
          <div className="relative z-10 hidden sm:block">
            <span className="text-white text-xs font-medium">{effect.name}</span>
          </div>
          <span className={`text-xs font-bold relative z-10 ${
            effect.type === 'debuff' ? 'text-red-300' : 
            effect.type === 'ritual' ? 'text-purple-300' :
            effect.type === 'sacrifice' ? 'text-red-300' :
            'text-green-300'
          }`}>
            {effect.timeLeft === -1 ? '∞' : formatTime(effect.timeLeft)}
          </span>
        </div>
      ))}
    </div>
  );
}
