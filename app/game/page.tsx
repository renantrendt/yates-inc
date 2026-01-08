'use client';

import { useState } from 'react';
import PathSelection from '@/components/PathSelection';
import LoreMode from '@/components/LoreMode';
import MiningGame from '@/components/game/MiningGame';
import { GameProvider } from '@/contexts/GameContext';

type GameState = 'path-selection' | 'lore' | 'gameplay';

function GameContent() {
    const [gameState, setGameState] = useState<GameState>('path-selection');

    const handlePathSelection = (path: 'lore' | 'gameplay') => {
        if (path === 'lore') {
            setGameState('lore');
        } else {
            // Go straight to gameplay - no cutscene
            setGameState('gameplay');
        }
    };

    return (
        <div className="w-full h-screen">
            {gameState === 'path-selection' && (
                <PathSelection onSelectPath={handlePathSelection} />
            )}

            {gameState === 'lore' && (
                <LoreMode onNavigateToGameplay={() => {
                    // Go straight to gameplay - no cutscene
                    setGameState('gameplay');
                }} />
            )}

            {gameState === 'gameplay' && (
                <MiningGame onExit={() => setGameState('path-selection')} />
            )}
        </div>
    );
}

export default function GamePage() {
    return (
        <GameProvider>
            <GameContent />
        </GameProvider>
    );
}
