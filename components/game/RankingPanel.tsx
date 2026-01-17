'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';

interface RankingEntry {
  user_id: string;
  username: string;
  total_money_earned: number;
  fastest_prestige_time: number | null;
  total_prestiges: number;
}

interface RankingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type RankingCategory = 'money' | 'speed' | 'prestiges';

export default function RankingPanel({ isOpen, onClose }: RankingPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState<RankingCategory>('money');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodEndTime, setPeriodEndTime] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate next period end (every Sunday at midnight)
  const getNextPeriodEnd = useCallback(() => {
    const now = new Date();
    const nextSunday = new Date(now);
    // Get to next Sunday
    const daysUntilSunday = (7 - now.getDay()) % 7;
    // If today is Sunday and we're past midnight, go to next Sunday
    if (daysUntilSunday === 0 && now.getHours() >= 0) {
      nextSunday.setDate(now.getDate() + 7);
    } else {
      nextSunday.setDate(now.getDate() + (daysUntilSunday || 7));
    }
    nextSunday.setHours(0, 0, 0, 0);
    return nextSunday;
  }, []);

  // Check and process ranking period end
  const checkAndProcessPeriodEnd = useCallback(async () => {
    // Just set the next Sunday as the period end - no DB dependency
    setPeriodEndTime(getNextPeriodEnd());
  }, [getNextPeriodEnd]);

  // Fetch rankings when panel opens or category changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchRankings = async () => {
      setLoading(true);
      try {
        // Check/process period end first
        await checkAndProcessPeriodEnd();

        // Fetch top 5 from user_game_data based on category
        // We need to join with clients/employees to get usernames
        let query = supabase
          .from('user_game_data')
          .select('user_id, user_type, total_money_earned, fastest_prestige_time, prestige_count')
          .limit(5);

        switch (category) {
          case 'money':
            query = query
              .gt('total_money_earned', 0)
              .order('total_money_earned', { ascending: false });
            break;
          case 'speed':
            query = query
              .not('fastest_prestige_time', 'is', null)
              .order('fastest_prestige_time', { ascending: true });
            break;
          case 'prestiges':
            query = query
              .gt('prestige_count', 0)
              .order('prestige_count', { ascending: false });
            break;
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching rankings:', error);
          setRankings([]);
          return;
        }

        if (!data || data.length === 0) {
          setRankings([]);
          return;
        }

        // Fetch usernames for each user
        const rankingsWithNames: RankingEntry[] = [];
        for (const entry of data) {
          let username = 'Unknown';
          
          if (entry.user_type === 'client') {
            const { data: clientData } = await supabase
              .from('clients')
              .select('username')
              .eq('id', entry.user_id)
              .maybeSingle();
            username = clientData?.username || 'Unknown';
          } else {
            const { data: empData } = await supabase
              .from('employees')
              .select('name')
              .eq('id', entry.user_id)
              .maybeSingle();
            username = empData?.name || 'Unknown';
          }

          rankingsWithNames.push({
            user_id: entry.user_id,
            username,
            total_money_earned: entry.total_money_earned || 0,
            fastest_prestige_time: entry.fastest_prestige_time,
            total_prestiges: entry.prestige_count || 0,
          });
        }

        setRankings(rankingsWithNames);
      } catch (err) {
        console.error('Failed to fetch rankings:', err);
        setRankings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [isOpen, category, checkAndProcessPeriodEnd]);

  // Format number for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000000000000000) return `$${(num / 1000000000000000000).toFixed(1)}Qi`;
    if (num >= 1000000000000000) return `$${(num / 1000000000000000).toFixed(1)}Q`;
    if (num >= 1000000000000) return `$${(num / 1000000000000).toFixed(1)}T`;
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num}`;
  };

  // Format time for speed ranking
  const formatTime = (ms: number | null): string => {
    if (ms === null) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  // Format time remaining until period ends
  const formatTimeRemaining = (): string => {
    if (!periodEndTime) return 'Unknown';
    const now = new Date();
    const diff = periodEndTime.getTime() - now.getTime();
    if (diff <= 0) return 'Ending soon...';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Get rank medal/emoji
  const getRankDisplay = (index: number): string => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}.`;
    }
  };

  // Get value to display based on category
  const getValueDisplay = (entry: RankingEntry): string => {
    switch (category) {
      case 'money':
        return formatNumber(entry.total_money_earned);
      case 'speed':
        return formatTime(entry.fastest_prestige_time);
      case 'prestiges':
        return `${entry.total_prestiges}x`;
    }
  };

  // Category titles
  const categoryTitles: Record<RankingCategory, string> = {
    money: '💰 Most Money',
    speed: '⚡ Fastest Prestige',
    prestiges: '✨ Most Prestiges',
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border-2 border-cyan-500 shadow-xl shadow-cyan-500/20 z-[9999]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <span>🏆</span> Rankings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Period countdown */}
        <div className="text-center mb-4 text-sm">
          <span className="text-gray-400">Resets in: </span>
          <span className="text-cyan-300 font-bold">{formatTimeRemaining()}</span>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6">
          {(['money', 'speed', 'prestiges'] as RankingCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-sm transition-all ${
                category === cat
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {cat === 'money' && '💰'}
              {cat === 'speed' && '⚡'}
              {cat === 'prestiges' && '✨'}
              <span className="ml-1 hidden sm:inline">
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </span>
            </button>
          ))}
        </div>

        {/* Category Title */}
        <h3 className="text-lg font-bold text-white mb-4 text-center">
          {categoryTitles[category]}
        </h3>

        {/* Leaderboard */}
        <div className="space-y-2 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center h-[200px]">
              <div className="text-cyan-400 animate-pulse">Loading...</div>
            </div>
          ) : rankings.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-500">
              No rankings yet. Be the first!
            </div>
          ) : (
            rankings.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  index === 0
                    ? 'bg-gradient-to-r from-yellow-600/30 to-amber-600/30 border border-yellow-500/50'
                    : index === 1
                    ? 'bg-gradient-to-r from-gray-500/30 to-gray-400/30 border border-gray-400/50'
                    : index === 2
                    ? 'bg-gradient-to-r from-amber-700/30 to-orange-700/30 border border-amber-600/50'
                    : 'bg-gray-800/50 border border-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-8 text-center">{getRankDisplay(index)}</span>
                  <span className={`font-bold truncate max-w-[120px] ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-amber-500' :
                    'text-white'
                  }`}>
                    {entry.username}
                  </span>
                </div>
                <span className={`font-bold ${
                  index === 0 ? 'text-yellow-300' :
                  index === 1 ? 'text-gray-200' :
                  index === 2 ? 'text-amber-400' :
                  'text-cyan-400'
                }`}>
                  {getValueDisplay(entry)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Rewards info */}
        <div className="mt-6 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
          <p className="text-gray-400 text-xs text-center">
            🏆 Top 2 players in each category earn exclusive titles with buffs when the ranking resets!
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
