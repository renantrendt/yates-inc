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
    <div className="flex flex-wrap gap-1">
      {allEffects.map(effect => (
        <span 
          key={effect.id}
          className={`text-[8px] sm:text-[9px] bg-black/60 px-1 rounded whitespace-nowrap ${
            effect.type === 'debuff' 
              ? 'text-red-400'
              : effect.type === 'ritual'
                ? 'text-purple-400 animate-pulse'
                : effect.type === 'sacrifice'
                  ? 'text-red-400'
                  : 'text-green-400'
          }`}
        >
          {effect.icon} {effect.name} {effect.timeLeft === -1 ? '∞' : formatTime(effect.timeLeft)}
        </span>
      ))}
    </div>
  );
}
