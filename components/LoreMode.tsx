'use client';

import { useEffect, useState, useRef } from 'react';
import { loreFrames, LoreFrame } from '@/lib/loreFrames';
import Image from 'next/image';

export default function LoreMode() {
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const currentFrame = loreFrames[currentFrameIndex];
    const typingSpeed = 30; // milliseconds per character

    // Typewriter effect
    useEffect(() => {
        if (!currentFrame) return;

        setDisplayedText('');
        setIsTyping(true);
        let charIndex = 0;

        const typeInterval = setInterval(() => {
            if (charIndex < currentFrame.text.length) {
                setDisplayedText(currentFrame.text.substring(0, charIndex + 1));
                charIndex++;
            } else {
                setIsTyping(false);
                clearInterval(typeInterval);
            }
        }, typingSpeed);

        return () => clearInterval(typeInterval);
    }, [currentFrameIndex, currentFrame]);

    // Handle SPACE key to advance frames
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();

                if (currentFrameIndex < loreFrames.length - 1) {
                    setCurrentFrameIndex(currentFrameIndex + 1);
                } else {
                    // Story finished, could redirect or show ending
                    alert('Story complete! Thanks for watching!');
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentFrameIndex]);

    if (!currentFrame) return null;

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
            {/* Background Image/Animation */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                        src={currentFrame.image}
                        alt="Story scene"
                        fill
                        className="pixelated object-contain"
                        priority
                    />
                </div>
            </div>

            {/* Text Overlay at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 p-6 z-10">
                <div className="max-w-4xl mx-auto">
                    <p className="text-white text-2xl font-bold leading-relaxed min-h-[4rem]">
                        {displayedText}
                        {isTyping && <span className="animate-pulse">▋</span>}
                    </p>
                    <div className="mt-4 text-gray-400 text-sm text-right">
                        Press SPACE to continue ({currentFrameIndex + 1}/{loreFrames.length})
                    </div>
                </div>
            </div>

            {/* Section indicator */}
            <div className="absolute top-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold uppercase text-sm">
                {currentFrame.section === 'intro' && 'Introduction'}
                {currentFrame.section === 'first-war' && 'The First War'}
                {currentFrame.section === 'second-fight' && 'The Second Fight'}
            </div>
        </div>
    );
}
