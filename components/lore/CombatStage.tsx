'use client';

import CharacterSprite, { CharacterAction, CharacterName } from './CharacterSprite';
import LoreFX, { FXType } from './FX';

export interface CharacterState {
  character: CharacterName;
  action?: CharacterAction;
  facing?: 'left' | 'right';
}

export interface FXState {
  type: FXType;
  origin?: 'left' | 'right' | 'center';
  intensity?: 'low' | 'medium' | 'high';
}

export interface StageConfig {
  left?: CharacterState;
  right?: CharacterState;
  center?: CharacterState;
  fx?: FXState[];
}

interface CombatStageProps {
  config: StageConfig;
}

export function CombatStage({ config }: CombatStageProps) {
  return (
    <div className="lore-stage">
      {config.fx?.map((fx, index) => (
        <LoreFX key={`${fx.type}-${index}`} {...fx} />
      ))}

      {config.left && (
        <div className="lore-slot lore-slot-left">
          <CharacterSprite
            character={config.left.character}
            action={config.left.action}
            facing={config.left.facing ?? 'right'}
          />
        </div>
      )}

      {config.center && (
        <div className="lore-slot lore-slot-center">
          <CharacterSprite
            character={config.center.character}
            action={config.center.action}
            facing={config.center.facing ?? 'right'}
          />
        </div>
      )}

      {config.right && (
        <div className="lore-slot lore-slot-right">
          <CharacterSprite
            character={config.right.character}
            action={config.right.action}
            facing={config.right.facing ?? 'left'}
          />
        </div>
      )}
    </div>
  );
}

export default CombatStage;
