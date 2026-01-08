'use client';

export type FXType = 'fireball' | 'shield' | 'domain' | 'impact' | 'shadow' | 'lightning' | 'time-freeze';

export interface FXProps {
  type: FXType;
  origin?: 'left' | 'right' | 'center';
  intensity?: 'low' | 'medium' | 'high';
}

export function LoreFX({ type, origin = 'center', intensity = 'medium' }: FXProps) {
  const baseClass = `lore-fx lore-fx-${type} lore-fx-${origin} lore-fx-${intensity}`;
  return <div className={baseClass} aria-hidden />;
}
