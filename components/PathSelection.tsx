'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

interface PathSelectionProps {
    onSelectPath: (path: 'lore' | 'gameplay') => void;
}

export default function PathSelection({ onSelectPath }: PathSelectionProps) {
    const [stevePosition, setStevePosition] = useState({ x: 400, y: 300 });
    const keysPressed = useRef<Set<string>>(new Set());
    const animationFrameRef = useRef<number>();

    // Movement speed
    const moveSpeed = 3;

    // Path zones (left = LORE, right = GAMEPLAY)
    const loreZone = { x: 0, y: 0, width: 350, height: 600 };
    const gameplayZone = { x: 450, y: 0, width: 350, height: 600 };

    // Handle keyboard input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                e.preventDefault();
                keysPressed.current.add(key);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            keysPressed.current.delete(key);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Game loop for smooth movement
    useEffect(() => {
        const gameLoop = () => {
            setStevePosition((prev) => {
                let newX = prev.x;
                let newY = prev.y;

                // Check all pressed keys
                if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
                    newY -= moveSpeed;
                }
                if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
                    newY += moveSpeed;
                }
                if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
                    newX -= moveSpeed;
                }
                if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
                    newX += moveSpeed;
                }

                // Keep Steve in bounds
                newX = Math.max(0, Math.min(750, newX));
                newY = Math.max(0, Math.min(550, newY));

                // Check if Steve entered a path zone
                if (newX < loreZone.width && newY >= loreZone.y && newY <= loreZone.height) {
                    onSelectPath('lore');
                } else if (newX > gameplayZone.x && newY >= gameplayZone.y && newY <= gameplayZone.height) {
                    onSelectPath('gameplay');
                }

                return { x: newX, y: newY };
            });

            animationFrameRef.current = requestAnimationFrame(gameLoop);
        };

        animationFrameRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [onSelectPath]);

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
            <div className="relative w-[800px] h-[600px]">
                {/* Background */}
                <Image
                    src="/grass-path.png"
                    alt="Path selection"
                    fill
                    className="pixelated object-cover"
                    priority
                />

                {/* Path Labels */}
                <div className="absolute top-10 left-10 bg-purple-600 text-white px-6 py-3 rounded-lg font-bold text-xl shadow-lg">
                    ← LORE
                </div>
                <div className="absolute top-10 right-10 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-xl shadow-lg">
                    GAMEPLAY →
                </div>

                {/* Instructions */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-6 py-3 rounded-lg text-center">
                    <p className="font-bold mb-1">Use WASD or Arrow Keys to move</p>
                    <p className="text-sm text-gray-300">Walk to either side to choose your path</p>
                </div>

                {/* Steve Character */}
                <div
                    className="absolute transition-none"
                    style={{
                        left: `${stevePosition.x}px`,
                        top: `${stevePosition.y}px`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <Image
                        src="/steve.png"
                        alt="Steve"
                        width={64}
                        height={64}
                        className="pixelated"
                    />
                </div>
            </div>
        </div>
    );
}
