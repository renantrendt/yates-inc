'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { PICKAXES } from '@/lib/gameData';

interface GameTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onMine: () => void;
}

export default function GameTerminal({ isOpen, onClose, onMine }: GameTerminalProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([
    '🎮 YATES MINING TERMINAL',
    'Type yatesHelp() to see commands',
    '',
  ]);
  const [cmActive, setCmActive] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const cmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { gameState, resetGame, buyPickaxe, equipPickaxe } = useGame();

  // Focus input when terminal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-scroll history to bottom
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (terminalRef.current && !terminalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Small delay to prevent immediate close on open
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // CM() mode - 7 clicks/sec + auto-buy pickaxes
  useEffect(() => {
    if (cmActive) {
      cmIntervalRef.current = setInterval(() => {
        // Auto-click
        onMine();
        
        // Auto-buy next pickaxe if affordable
        const highestOwned = Math.max(...gameState.ownedPickaxeIds);
        const nextPickaxe = PICKAXES.find(p => p.id === highestOwned + 1);
        if (nextPickaxe && gameState.yatesDollars >= nextPickaxe.price) {
          buyPickaxe(nextPickaxe.id);
        }
      }, 1000 / 7); // 7 clicks per second
    } else {
      if (cmIntervalRef.current) {
        clearInterval(cmIntervalRef.current);
        cmIntervalRef.current = null;
      }
    }

    return () => {
      if (cmIntervalRef.current) {
        clearInterval(cmIntervalRef.current);
      }
    };
  }, [cmActive, onMine, gameState.ownedPickaxeIds, gameState.yatesDollars, buyPickaxe]);

  const addToHistory = useCallback((line: string) => {
    setHistory(prev => [...prev, line]);
  }, []);

  const executeCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    addToHistory(`> ${trimmed}`);

    // Parse command
    if (trimmed === 'yatesHelp()') {
      addToHistory('');
      addToHistory('🎮 YATES MINING GAME CHEATS:');
      addToHistory('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addToHistory('yatesReset()         - Reset all progress');
      addToHistory(`yatesGivePcx(id)     - Give pickaxe by ID (1-${PICKAXES.length})`);
      addToHistory('yatesGiveAllPcx()    - Unlock all pickaxes');
      addToHistory('yatesGiveMoney(amt)  - Add Yates Dollars');
      addToHistory('yatesHelp()          - Show this help');
      addToHistory('');
    } 
    else if (trimmed === 'yatesReset()') {
      resetGame();
      addToHistory('🎮 Progress reset! Refresh the page.');
    }
    else if (trimmed.startsWith('yatesGivePcx(') && trimmed.endsWith(')')) {
      const idStr = trimmed.slice(13, -1);
      const id = parseInt(idStr, 10);
      if (isNaN(id) || id < 1 || id > PICKAXES.length) {
        addToHistory(`❌ Invalid pickaxe ID. Use 1-${PICKAXES.length}`);
      } else {
        buyPickaxe(id);
        equipPickaxe(id);
        const pcx = PICKAXES.find(p => p.id === id);
        addToHistory(`⛏️ Gave pickaxe: ${pcx?.name} (ID: ${id})`);
      }
    }
    else if (trimmed === 'yatesGiveAllPcx()') {
      PICKAXES.forEach(p => {
        buyPickaxe(p.id);
      });
      equipPickaxe(PICKAXES[PICKAXES.length - 1].id);
      addToHistory('⛏️ Unlocked ALL pickaxes!');
    }
    else if (trimmed.startsWith('yatesGiveMoney(') && trimmed.endsWith(')')) {
      const amtStr = trimmed.slice(15, -1);
      const amt = parseInt(amtStr, 10);
      if (isNaN(amt)) {
        addToHistory('❌ Invalid amount');
      } else {
        // We need to use spendMoney with negative... or access gameState directly
        // For now, let's emit to window
        if (typeof window !== 'undefined') {
          ((window as unknown) as Record<string, unknown>).yatesGiveMoney?.(amt);
        }
        addToHistory(`💰 Added $${amt.toLocaleString()} Yates Dollars!`);
      }
    }
    // Secret CM() command - not in help
    else if (trimmed === 'CM()' || trimmed === 'CM(true)') {
      setCmActive(true);
      addToHistory('🤫 CM mode ACTIVATED - auto-clicking + auto-buying...');
    }
    else if (trimmed === 'CM(false)') {
      setCmActive(false);
      addToHistory('🛑 CM mode DEACTIVATED');
    }
    else if (trimmed === 'clear' || trimmed === 'clear()') {
      setHistory(['🎮 YATES MINING TERMINAL', 'Type yatesHelp() to see commands', '']);
    }
    else {
      addToHistory(`❌ Unknown command: ${trimmed}`);
      addToHistory('Type yatesHelp() for available commands');
    }
  }, [addToHistory, resetGame, buyPickaxe, equipPickaxe]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      executeCommand(input);
      setInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={terminalRef}
      className="fixed bottom-4 right-4 w-80 sm:w-96 bg-black/95 border border-green-500/50 rounded-lg shadow-2xl shadow-green-500/20 z-[200] font-mono text-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-green-500/30 bg-green-900/20">
        <div className="flex items-center gap-2">
          <span className="text-green-400">⌨️</span>
          <span className="text-green-300 text-xs">TERMINAL</span>
          {cmActive && (
            <span className="text-yellow-400 text-xs animate-pulse">[CM]</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-green-500 hover:text-green-300 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* History */}
      <div
        ref={historyRef}
        className="h-48 overflow-y-auto p-3 text-green-400 text-xs space-y-0.5"
      >
        {history.map((line, i) => (
          <div key={i} className={line.startsWith('>') ? 'text-green-200' : ''}>
            {line || '\u00A0'}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-green-500/30">
        <div className="flex items-center px-3 py-2">
          <span className="text-green-500 mr-2">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-green-300 outline-none placeholder-green-700"
            placeholder="type a command..."
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </form>
    </div>
  );
}

