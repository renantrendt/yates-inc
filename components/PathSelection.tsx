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
            // Don't capture WASD if user is typing in an input/textarea
            const target = e.target as HTMLElement;
            const activeElement = document.activeElement as HTMLElement;
            if (
                target.tagName === 'INPUT' || 
                target.tagName === 'TEXTAREA' ||
                target.contentEditable === 'true' ||
                activeElement?.tagName === 'INPUT' || 
                activeElement?.tagName === 'TEXTAREA' ||
                activeElement?.contentEditable === 'true'
            ) {
                return; // Let the user type normally
            }

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
            <div className="relative w-full h-full max-w-[1280px] max-h-[720px]">
                {/* Background */}
                <Image
                    src="/locations/grass-path.png"
                    alt="Path selection"
                    fill
                    className="pixelated object-cover"
                    priority
                />

                {/* Path Labels - Responsive */}
                <div className="absolute top-4 sm:top-12 md:top-24 left-2 sm:left-6 md:left-10 bg-purple-600 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg font-bold text-sm sm:text-base md:text-xl shadow-lg">
                    ← LORE
                </div>
                <div className="absolute top-4 sm:top-12 md:top-24 right-2 sm:right-6 md:right-10 bg-blue-600 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg font-bold text-sm sm:text-base md:text-xl shadow-lg">
                    GAMEPLAY →
                </div>

                {/* Direct Buttons for Mobile - Visible on small screens */}
                <div className="md:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-4 w-full max-w-xs px-4">
                    <button
                        onClick={() => onSelectPath('lore')}
                        className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-xl hover:from-purple-500 hover:to-purple-400 active:scale-95 transition-all touch-manipulation flex items-center justify-center gap-2"
                    >
                        ← LORE
                    </button>
                    <button
                        onClick={() => onSelectPath('gameplay')}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-xl hover:from-blue-500 hover:to-blue-400 active:scale-95 transition-all touch-manipulation flex items-center justify-center gap-2"
                    >
                        GAMEPLAY →
                    </button>
                </div>

                {/* Instructions - Desktop only (keyboard controls) */}
                <div className="hidden md:block absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-center">
                    <p className="font-bold mb-1 text-sm sm:text-base">Use WASD or Arrow Keys to move</p>
                    <p className="text-xs sm:text-sm text-gray-300">Walk to either side to choose your path</p>
                </div>

                {/* Mobile Instructions */}
                <div className="md:hidden absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg text-center">
                    <p className="text-xs text-gray-300">Tap a button above to start</p>
                </div>

                {/* Steve Character - Desktop only */}
                <div
                    className="hidden md:block absolute transition-none"
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

                {/* Mobile character indicator */}
                <div className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2">
                    <Image
                        src="/characters/steve.png"
                        alt="Steve"
                        width={48}
                        height={48}
                        className="pixelated opacity-50"
                    />
                </div>
            </div>
        </div>
    );
}
