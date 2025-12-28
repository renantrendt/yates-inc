'use client';

import { useEffect } from 'react';

interface LoreModeProps {
    onNavigateToGameplay?: () => void;
}

export default function LoreMode({ onNavigateToGameplay }: LoreModeProps) {
    useEffect(() => {
        // Auto-redirect to gameplay after 3 seconds
        const timer = setTimeout(() => {
            if (onNavigateToGameplay) {
                onNavigateToGameplay();
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [onNavigateToGameplay]);

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center overflow-hidden">
            <div className="text-center max-w-3xl px-8">
                <h1 className="text-7xl font-bold text-white mb-6 animate-pulse">
                    🚧 LORE MODE 🚧
                </h1>
                <p className="text-4xl text-purple-300 mb-8 font-bold">
                    HALFWAY THERE!
                </p>
                <p className="text-2xl text-gray-300 mb-12">
                    The epic story of Yates, Walters, and Kato is still being crafted...
                    <br />
                    <span className="text-purple-400 font-semibold">Check back next year!</span>
                </p>
                <div className="text-xl text-gray-400 italic">
                    Redirecting to gameplay in 3 seconds... 😎
                </div>
            </div>
        </div>
    );
}
