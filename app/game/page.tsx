'use client';

import { useState } from 'react';
import PathSelection from '@/components/PathSelection';
import LoreMode from '@/components/LoreMode';

type GameState = 'path-selection' | 'lore' | 'gameplay';

export default function GamePage() {
    const [gameState, setGameState] = useState<GameState>('path-selection');

    const handlePathSelection = (path: 'lore' | 'gameplay') => {
        setGameState(path);
    };

    return (
        <div className="w-full h-screen">
            {gameState === 'path-selection' && (
                <PathSelection onSelectPath={handlePathSelection} />
            )}

            {gameState === 'lore' && <LoreMode onNavigateToGameplay={() => setGameState('gameplay')} />}

            {gameState === 'gameplay' && (
                <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-6xl font-bold text-white mb-4">GAMEPLAY</h1>
                        <p className="text-2xl text-gray-300 mb-8">Coming Soon...</p>
                        <button
                            onClick={() => setGameState('path-selection')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
                        >
                            ← Back to Path Selection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
