'use client';

import { useState } from 'react';
import PathSelection from '@/components/PathSelection';
import LoreMode from '@/components/LoreMode';
import MiningGame from '@/components/game/MiningGame';
import GameCutscene from '@/components/game/GameCutscene';
import { GameProvider, useGame } from '@/contexts/GameContext';

type GameState = 'path-selection' | 'lore' | 'cutscene' | 'gameplay';

function GameContent() {
    const [gameState, setGameState] = useState<GameState>('path-selection');
    const { gameState: savedState, markCutsceneSeen } = useGame();

    const handlePathSelection = (path: 'lore' | 'gameplay') => {
        if (path === 'lore') {
            setGameState('lore');
        } else {
            // Check if user has seen cutscene before
            if (savedState.hasSeenCutscene) {
                setGameState('gameplay');
            } else {
                setGameState('cutscene');
            }
        }
    };

    const handleCutsceneComplete = () => {
        markCutsceneSeen();
        setGameState('gameplay');
    };

    return (
        <div className="w-full h-screen">
            {gameState === 'path-selection' && (
                <PathSelection onSelectPath={handlePathSelection} />
            )}

            {gameState === 'lore' && (
                <LoreMode onNavigateToGameplay={() => {
                    if (savedState.hasSeenCutscene) {
                        setGameState('gameplay');
                    } else {
                        setGameState('cutscene');
                    }
                }} />
            )}

            {gameState === 'cutscene' && (
                <GameCutscene onComplete={handleCutsceneComplete} />
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
