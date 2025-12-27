'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { StageConfig } from '@/components/lore/CombatStage';

export interface LoreSceneConfig {
  id: string;
  text: string;
  background: string;
  stage: StageConfig;
  autoAdvanceDelay?: number;
}

export interface LoreTimelineState {
  scene: LoreSceneConfig | null;
  index: number;
  total: number;
  text: string;
  textComplete: boolean;
  isFinished: boolean;
  completeText: () => void;
  nextScene: () => void;
}

export function useLoreTimeline(scenes: LoreSceneConfig[]): LoreTimelineState {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [textComplete, setTextComplete] = useState(false);

  const scene = scenes[index] ?? null;
  const total = scenes.length;
  const autoDelay = scene?.autoAdvanceDelay ?? 2600;

  const nextScene = useCallback(() => {
    setIndex(prev => {
      if (prev >= scenes.length - 1) {
        return prev + 1; // triggers finished state
      }
      return prev + 1;
    });
  }, [scenes.length]);

  const completeText = useCallback(() => {
    if (scene) {
      setText(scene.text);
      setTextComplete(true);
    }
  }, [scene]);

  useEffect(() => {
    if (!scene) return;

    let charIndex = 0;
    setText('');
    setTextComplete(false);

    const typeTimer = setInterval(() => {
      if (charIndex < scene.text.length) {
        setText(scene.text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setTextComplete(true);
        clearInterval(typeTimer);
        const delay = setTimeout(() => {
          nextScene();
        }, autoDelay);
        return () => clearTimeout(delay);
      }
    }, 35);

    return () => clearInterval(typeTimer);
  }, [scene, nextScene, autoDelay]);

  const isFinished = useMemo(() => index >= scenes.length, [index, scenes.length]);

  return {
    scene,
    index,
    total,
    text,
    textComplete,
    isFinished,
    completeText,
    nextScene,
  };
}
