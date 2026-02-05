'use client';

import { useState } from 'react';
import PathSelection from '@/components/PathSelection';
import LoreMode from '@/components/LoreMode';
import MiningGame from '@/components/game/MiningGame';
import { GameProvider } from '@/contexts/GameContext';

type GameState = 'path-selection' | 'lore' | 'gameplay' | 'gameplay-hard';

export default function GamePage() {
    const [gameState, setGameState] = useState<GameState>('path-selection');

    const handlePathSelection = (path: 'lore' | 'gameplay' | 'hard') => {
        if (path === 'lore') {
            setGameState('lore');
        } else if (path === 'hard') {
            setGameState('gameplay-hard');
        } else {
            setGameState('gameplay');
        }
    };

    // Determine if we're in hard mode
    const isHardMode = gameState === 'gameplay-hard';

    return (
        <div className="w-full h-screen">
            {gameState === 'path-selection' && (
                <PathSelection onSelectPath={handlePathSelection} />
            )}

            {gameState === 'lore' && (
                <LoreMode onNavigateToGameplay={() => {
                    setGameState('gameplay');
                }} />
            )}

            {(gameState === 'gameplay' || gameState === 'gameplay-hard') && (
                <GameProvider isHardMode={isHardMode} key={isHardMode ? 'hard' : 'normal'}>
                    <MiningGame onExit={() => setGameState('path-selection')} />
                </GameProvider>
            )}
        </div>
    );
}
