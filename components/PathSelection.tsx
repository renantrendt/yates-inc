'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

interface PathSelectionProps {
    onSelectPath: (path: 'lore' | 'gameplay') => void;
}

export default function PathSelection({ onSelectPath }: PathSelectionProps) {
    const [stevePosition, setStevePosition] = useState({ x: 640, y: 360 });
    const keysPressed = useRef<Set<string>>(new Set());
    const animationFrameRef = useRef<number | null>(null);

    // Movement speed
    const moveSpeed = 5;

    // Path zones - LORE has TWO paths (left and center), GAMEPLAY has one (right)
    const loreZoneLeft = { x: 0, y: 0, width: 200, height: 400 };
    const loreZoneCenter = { x: 200, y: 100, width: 300, height: 300 }; // The intersection area
    const gameplayZone = { x: 780, y: 0, width: 500, height: 500 }; // Right side - MUCH BIGGER

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

    // Track pending path selection to avoid calling during render
    const pendingPath = useRef<'lore' | 'gameplay' | null>(null);

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
                newX = Math.max(0, Math.min(1280, newX));
                newY = Math.max(0, Math.min(720, newY));

                // Check if Steve entered LORE zones (left path OR center intersection)
                const inLoreLeft = newX >= loreZoneLeft.x && newX <= loreZoneLeft.x + loreZoneLeft.width &&
                    newY >= loreZoneLeft.y && newY <= loreZoneLeft.y + loreZoneLeft.height;
                const inLoreCenter = newX >= loreZoneCenter.x && newX <= loreZoneCenter.x + loreZoneCenter.width &&
                    newY >= loreZoneCenter.y && newY <= loreZoneCenter.y + loreZoneCenter.height;

                if (inLoreLeft || inLoreCenter) {
                    pendingPath.current = 'lore';
                }

                // Check if Steve entered GAMEPLAY zone (right path)
                const inGameplay = newX >= gameplayZone.x && newX <= gameplayZone.x + gameplayZone.width &&
                    newY >= gameplayZone.y && newY <= gameplayZone.y + gameplayZone.height;

                if (inGameplay) {
                    pendingPath.current = 'gameplay';
                }

                return { x: newX, y: newY };
            });

            // Handle path selection outside of setState
            if (pendingPath.current) {
                const path = pendingPath.current;
                pendingPath.current = null;
                setTimeout(() => onSelectPath(path), 0);
            }

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
            <div className="relative w-[1280px] h-[720px]">
                {/* Background */}
                <Image
                    src="/locations/grass-path.png"
                    alt="Path selection"
                    fill
                    className="pixelated object-cover"
                    priority
                />

                {/* Path Labels */}
                <div className="absolute top-24 left-10 bg-purple-600 text-white px-6 py-3 rounded-lg font-bold text-xl shadow-lg">
                    ← LORE
                </div>
                <div className="absolute top-24 right-10 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-xl shadow-lg">
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
                        src="/characters/steve.png"
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
