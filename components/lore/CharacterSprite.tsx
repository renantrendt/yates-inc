'use client';

export type CharacterName = 'yates' | 'walters' | 'kato';
export type CharacterAction =
  | 'idle'
  | 'argue'
  | 'power'
  | 'punch'
  | 'block'
  | 'hit'
  | 'dodge'
  | 'uppercut'
  | 'shadow';

interface CharacterSpriteProps {
  character: CharacterName;
  action?: CharacterAction;
  facing?: 'left' | 'right';
  size?: number;
  className?: string;
}

const palette = {
  yates: {
    skin: '#f4c9a1',
    outfit: '#1f2937',
    hoodie: '#0f172a',
  },
  walters: {
    skin: '#ffd9b3',
    outfit: '#2563eb',
    pants: '#b45309',
    accent: '#fbbf24',
  },
  kato: {
    skin: '#f7d7ad',
    outfit: '#7c3aed',
    belt: '#facc15',
    accent: '#c4b5fd',
    hair: '#d1d5db',
  },
};

const cn = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

export function CharacterSprite({
  character,
  action = 'idle',
  facing = 'right',
  size = 200,
  className,
}: CharacterSpriteProps) {
  const colors = palette[character];
  const width = 120;
  const height = 200;

  return (
    <div
      className={cn(
        'lore-character',
        `lore-${character}`,
        `lore-action-${action}`,
        `lore-facing-${facing}`,
        className
      )}
      style={{ width: size, height: size * (height / width) }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="lore-sprite" role="img" aria-label={character}>
        <ellipse cx="60" cy="190" rx="35" ry="10" fill="rgba(0,0,0,0.25)" />

        <g className="lore-legs">
          <rect x="38" y="120" width="18" height="55" fill={character === 'walters' ? palette.walters.pants : '#111827'} stroke="#000" strokeWidth="3" />
          <rect x="64" y="120" width="18" height="55" fill={character === 'walters' ? '#a16207' : '#111827'} stroke="#000" strokeWidth="3" />
        </g>

        <g className="lore-torso">
          <rect x="30" y="70" width="60" height="55" rx="8" fill={colors.outfit} stroke="#000" strokeWidth="3" />
          {character === 'kato' && <rect x="30" y="105" width="60" height="6" fill={palette.kato.belt} />}
          {character === 'walters' && <rect x="30" y="85" width="60" height="10" fill={palette.walters.accent} opacity={0.7} />}
        </g>

        <g className="lore-arm arm-left" style={{ transformOrigin: '35px 100px' }}>
          <rect x="18" y="80" width="16" height="60" rx="8" fill={colors.skin} stroke="#000" strokeWidth="3" />
        </g>
        <g className="lore-arm arm-right" style={{ transformOrigin: '85px 100px' }}>
          <rect x="86" y="80" width="16" height="60" rx="8" fill={colors.skin} stroke="#000" strokeWidth="3" />
        </g>

        <g className="lore-head">
          <rect x="35" y="25" width="50" height="45" rx="10" fill={colors.skin} stroke="#000" strokeWidth="3" />
          <rect x="45" y="42" width="8" height="6" fill="#111" />
          <rect x="67" y="42" width="8" height="6" fill="#111" />
          <rect x="50" y="58" width="20" height="4" fill="#a16207" opacity={0.8} />
          {character === 'kato' && <rect x="35" y="20" width="50" height="8" fill={palette.kato.hair} />}
          {character === 'walters' && <circle cx="60" cy="20" r="18" fill="#e5e7eb" stroke="#000" strokeWidth="3" />}
          {character === 'yates' && (
            <path d="M28 25 Q60 5 92 25" stroke="#0f172a" strokeWidth="6" fill="none" strokeLinecap="round" />
          )}
        </g>
      </svg>
    </div>
  );
}

export default CharacterSprite;
