'use client';

import { useState, useEffect } from 'react';
import { 
  getCurrentTerminalPassword, 
  getSecondsUntilExpiry, 
  formatTimeRemaining,
  getCurrentTimeWindow
} from '@/lib/terminalPassword';

interface TerminalPasswordDisplayProps {
  onClose: () => void;
}

export default function TerminalPasswordDisplay({ onClose }: TerminalPasswordDisplayProps) {
  const [password, setPassword] = useState(getCurrentTerminalPassword());
  const [timeRemaining, setTimeRemaining] = useState(getSecondsUntilExpiry());
  const [copied, setCopied] = useState(false);
  const [lastTimeWindow, setLastTimeWindow] = useState(getCurrentTimeWindow());

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = getSecondsUntilExpiry();
      setTimeRemaining(seconds);
      
      // Check if we've entered a new time window (password changed)
      const currentWindow = getCurrentTimeWindow();
      if (currentWindow !== lastTimeWindow) {
        setPassword(getCurrentTerminalPassword());
        setLastTimeWindow(currentWindow);
        setCopied(false); // Reset copied state when password changes
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastTimeWindow]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Format time display with color based on urgency
  const getTimeColor = () => {
    if (timeRemaining <= 30) return 'text-red-500';
    if (timeRemaining <= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="fixed right-0 top-16 bottom-0 w-96 bg-black/95 shadow-2xl z-[60] flex flex-col border-l border-red-500/30">
      {/* Header */}
      <div className="p-4 border-b border-red-500/30 bg-red-900/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-xl">🔐</span>
            <h2 className="text-lg font-bold text-red-300">SYSTEM</h2>
          </div>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-300 transition-colors text-xl"
          >
            ✕
          </button>
        </div>
        <p className="text-red-500/70 text-xs mt-1">Terminal Access Password</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        {/* Password Display */}
        <div className="mb-6 text-center">
          <p className="text-red-500/70 text-sm mb-2 uppercase tracking-wider">
            Current Password
          </p>
          <div 
            onClick={handleCopy}
            className="bg-red-900/30 border-2 border-red-500/50 rounded-lg px-6 py-4 cursor-pointer hover:bg-red-900/40 transition-colors group"
          >
            <p className="text-4xl font-mono font-bold text-red-300 tracking-[0.3em] select-all">
              {password}
            </p>
            <p className="text-xs text-red-500/50 mt-2 group-hover:text-red-400 transition-colors">
              {copied ? '✓ Copied!' : 'Click to copy'}
            </p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="text-center mb-8">
          <p className="text-red-500/70 text-sm mb-1 uppercase tracking-wider">
            Expires In
          </p>
          <div className={`text-3xl font-mono font-bold ${getTimeColor()}`}>
            {formatTimeRemaining(timeRemaining)}
          </div>
          {timeRemaining <= 30 && (
            <p className="text-red-500 text-xs mt-1 animate-pulse">
              ⚠️ Password changing soon!
            </p>
          )}
        </div>

        {/* Info Section */}
        <div className="w-full bg-red-900/20 border border-red-500/20 rounded-lg p-4">
          <h3 className="text-red-400 font-semibold mb-2 text-sm">ℹ️ Information</h3>
          <ul className="text-red-300/70 text-xs space-y-2">
            <li>• Password rotates every 5 minutes</li>
            <li>• Share with trusted users who need terminal access</li>
            <li>• Guest access cannot use ban/unban commands</li>
            <li>• Terminal access clears when window is closed</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-red-500/30 bg-red-900/10">
        <div className="flex items-center justify-center gap-2 text-red-500/50 text-xs">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>LIVE - Auto-updates when password changes</span>
        </div>
      </div>
    </div>
  );
}
