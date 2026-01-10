'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { PICKAXES, ROCKS } from '@/lib/gameData';
import { supabase } from '@/lib/supabase';
import { TRINKETS } from '@/types/game';

// Admin IDs that can ban users (only Bernardo and Logan)
const BAN_ADMIN_IDS = ['123456', '000001'];

interface GameTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onMine: () => void;
}

export default function GameTerminal({ isOpen, onClose, onMine }: GameTerminalProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([
    '🔒 ADMIN TERMINAL',
    'Type help for commands',
    '',
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cmActive, setCmActive] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const cmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { gameState, resetGame, buyPickaxe, equipPickaxe, prestige, dismissWarning, clearClickHistory, addMoney, addMiners, addPrestigeTokens, giveTrinket, givePickaxe, setTotalClicks, toggleAutoPrestige } = useGame();
  const { employee } = useAuth();
  const { client } = useClient();
  
  // Check if current user is employee (numbered ID) or ban admin
  const userId = employee?.id || client?.id || null;
  const isEmployee = userId ? /^\d+$/.test(userId) : false;
  const isBanAdmin = userId ? BAN_ADMIN_IDS.includes(userId) : false;

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

  // CM() mode - 7 clicks/sec + auto-buy pickaxes (NO auto-prestige - use 'autoprestige' command separately)
  useEffect(() => {
    if (cmActive) {
      // Clear any blocks when CM is activated (admin mode)
      if (gameState.isBlocked) {
        dismissWarning();
      }
      // Clear click history when CM starts
      clearClickHistory();
      
      cmIntervalRef.current = setInterval(() => {
        // Auto-click
        onMine();
        
        // Auto-buy next pickaxe if affordable
        const highestOwned = Math.max(...gameState.ownedPickaxeIds);
        const nextPickaxe = PICKAXES.find(p => p.id === highestOwned + 1);
        if (nextPickaxe && gameState.yatesDollars >= nextPickaxe.price) {
          buyPickaxe(nextPickaxe.id);
        }
        // Note: Auto-prestige removed - use 'autoprestige' command if you want it
      }, 1000 / 7); // 7 clicks per second
    } else {
      if (cmIntervalRef.current) {
        clearInterval(cmIntervalRef.current);
        cmIntervalRef.current = null;
      }
      // Clear click history when CM is turned off so manual clicks don't trigger anti-cheat
      clearClickHistory();
      // Also clear any blocks
      if (gameState.isBlocked) {
        dismissWarning();
      }
    }

    return () => {
      if (cmIntervalRef.current) {
        clearInterval(cmIntervalRef.current);
      }
    };
  }, [cmActive, onMine, gameState.ownedPickaxeIds, gameState.yatesDollars, buyPickaxe, prestige]);

  const addToHistory = useCallback((line: string) => {
    setHistory(prev => [...prev, line]);
  }, []);

  // Ban a user by their user_id, email, or username (only ban admins can do this)
  const banUser = useCallback(async (targetInput: string, reason?: string) => {
    if (!isBanAdmin) {
      addToHistory('❌ ACCESS DENIED - Only Bernardo/Logan can ban');
      return;
    }
    
    try {
      let targetUserId = targetInput;
      let empData = null;
      let clientData = null;
      
      // Check if input looks like a UUID (contains dashes and is long) or numeric ID
      const isDirectId = targetInput.includes('-') || /^\d+$/.test(targetInput);
      
      if (!isDirectId) {
        // Search by email or username
        addToHistory(`🔍 Searching for "${targetInput}"...`);
        
        // Search in clients by mail_handle or username
        const { data: clientByEmail } = await supabase
          .from('clients')
          .select('id, username, mail_handle')
          .ilike('mail_handle', targetInput)
          .maybeSingle();
        
        const { data: clientByUsername } = await supabase
          .from('clients')
          .select('id, username, mail_handle')
          .ilike('username', targetInput)
          .maybeSingle();
        
        // Search in employees by name
        const { data: empByName } = await supabase
          .from('employees')
          .select('id, name')
          .ilike('name', targetInput)
          .maybeSingle();
        
        if (clientByEmail) {
          clientData = clientByEmail;
          targetUserId = clientByEmail.id;
          addToHistory(`✅ Found client by email: ${clientByEmail.username}`);
        } else if (clientByUsername) {
          clientData = clientByUsername;
          targetUserId = clientByUsername.id;
          addToHistory(`✅ Found client by username: ${clientByUsername.username}`);
        } else if (empByName) {
          empData = empByName;
          targetUserId = empByName.id;
          addToHistory(`✅ Found employee: ${empByName.name}`);
        } else {
          addToHistory(`❌ No user found matching "${targetInput}"`);
          return;
        }
      } else {
        // Direct ID lookup
        const { data: emp } = await supabase
          .from('employees')
          .select('id, name')
          .eq('id', targetUserId)
          .maybeSingle();
        
        const { data: client } = await supabase
          .from('clients')
          .select('id, username, mail_handle')
          .eq('id', targetUserId)
          .maybeSingle();
        
        empData = emp;
        clientData = client;
        
        if (!empData && !clientData) {
          addToHistory(`❌ User ID "${targetUserId}" not found`);
          return;
        }
      }
      
      const userType = empData ? 'employee' : 'client';
      const username = empData?.name || clientData?.username || 'Unknown';
      const email = clientData?.mail_handle || null;
      
      // Insert ban record
      const { error } = await supabase.from('banned_users').upsert({
        user_id: targetUserId,
        user_type: userType,
        email: email,
        username: username,
        banned_by: userId,
        ban_reason: reason || 'No reason provided',
        is_permanent: true,
      }, {
        onConflict: 'user_id'
      });
      
      if (error) {
        addToHistory(`❌ Failed to ban: ${error.message}`);
        return;
      }
      
      addToHistory(`🔨 BANNED: ${username} (${targetUserId})`);
      addToHistory(`   Type: ${userType}`);
      if (reason) addToHistory(`   Reason: ${reason}`);
    } catch (err) {
      addToHistory(`❌ Error: ${err}`);
    }
  }, [isBanAdmin, userId, addToHistory]);

  // Unban a user (only ban admins can do this)
  // Can accept user_id, email, or username - same as ban
  const unbanUser = useCallback(async (targetInput: string) => {
    if (!isBanAdmin) {
      addToHistory('❌ ACCESS DENIED - Only Bernardo/Logan can unban');
      return;
    }
    
    try {
      let targetUserId = targetInput;
      let foundUsername = targetInput;
      
      // Check if input looks like a UUID (contains dashes) or numeric ID (employee)
      const isDirectId = targetInput.includes('-') || /^\d+$/.test(targetInput);
      
      if (!isDirectId) {
        // Search by email or username in banned_users table first
        addToHistory(`🔍 Searching for "${targetInput}"...`);
        
        // Check banned_users by username or email
        const { data: bannedByUsername } = await supabase
          .from('banned_users')
          .select('user_id, username, email')
          .ilike('username', targetInput)
          .maybeSingle();
        
        const { data: bannedByEmail } = await supabase
          .from('banned_users')
          .select('user_id, username, email')
          .ilike('email', targetInput)
          .maybeSingle();
        
        if (bannedByUsername) {
          targetUserId = bannedByUsername.user_id;
          foundUsername = bannedByUsername.username || targetUserId;
          addToHistory(`✅ Found banned user by username: ${foundUsername}`);
        } else if (bannedByEmail) {
          targetUserId = bannedByEmail.user_id;
          foundUsername = bannedByEmail.username || targetUserId;
          addToHistory(`✅ Found banned user by email: ${foundUsername}`);
        } else {
          // Try searching in clients/employees tables
          const { data: clientByEmail } = await supabase
            .from('clients')
            .select('id, username, mail_handle')
            .ilike('mail_handle', targetInput)
            .maybeSingle();
          
          const { data: clientByUsername } = await supabase
            .from('clients')
            .select('id, username, mail_handle')
            .ilike('username', targetInput)
            .maybeSingle();
          
          const { data: empByName } = await supabase
            .from('employees')
            .select('id, name')
            .ilike('name', targetInput)
            .maybeSingle();
          
          if (clientByEmail) {
            targetUserId = clientByEmail.id;
            foundUsername = clientByEmail.username;
          } else if (clientByUsername) {
            targetUserId = clientByUsername.id;
            foundUsername = clientByUsername.username;
          } else if (empByName) {
            targetUserId = empByName.id;
            foundUsername = empByName.name;
          } else {
            addToHistory(`❌ No user found matching "${targetInput}"`);
            return;
          }
          addToHistory(`✅ Found user: ${foundUsername}`);
        }
      } else {
        // Check if this ID is actually banned
        const { data: banRecord } = await supabase
          .from('banned_users')
          .select('username')
          .eq('user_id', targetUserId)
          .maybeSingle();
        
        if (banRecord?.username) {
          foundUsername = banRecord.username;
        }
      }
      
      // First check if user is actually banned
      const { data: existingBan } = await supabase
        .from('banned_users')
        .select('user_id')
        .eq('user_id', targetUserId)
        .maybeSingle();
      
      if (!existingBan) {
        addToHistory(`⚠️ User "${foundUsername}" is not banned`);
        return;
      }
      
      // Now delete the ban
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('user_id', targetUserId);
      
      if (error) {
        addToHistory(`❌ Failed to unban: ${error.message}`);
        return;
      }
      
      addToHistory(`✅ UNBANNED: ${foundUsername} (${targetUserId})`);
    } catch (err) {
      addToHistory(`❌ Error: ${err}`);
    }
  }, [isBanAdmin, addToHistory]);

  // List all banned users (only ban admins can see this)
  const listBanned = useCallback(async () => {
    if (!isBanAdmin) {
      addToHistory('❌ ACCESS DENIED - Only Bernardo/Logan can view');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('banned_users')
        .select('*')
        .order('banned_at', { ascending: false });
      
      if (error) {
        addToHistory(`❌ Error: ${error.message}`);
        return;
}

      if (!data || data.length === 0) {
        addToHistory('📋 No banned users');
        return;
      }
      
      addToHistory('');
      addToHistory('🔨 BANNED USERS:');
      addToHistory('━━━━━━━━━━━━━━━━');
      data.forEach((ban) => {
        addToHistory(`${ban.username || ban.user_id} (${ban.user_type})`);
        addToHistory(`  ID: ${ban.user_id}`);
        addToHistory(`  Reason: ${ban.ban_reason || 'None'}`);
        addToHistory('');
      });
    } catch (err) {
      addToHistory(`❌ Error: ${err}`);
    }
  }, [isBanAdmin, addToHistory]);

  // List all users (clients) - ban admins only
  const listUsers = useCallback(async () => {
    if (!isBanAdmin) {
      addToHistory('❌ ACCESS DENIED - Only Bernardo/Logan can view');
      return;
      }
    
    try {
      // Fetch clients
      const { data: clients, error: clientErr } = await supabase
        .from('clients')
        .select('id, username, mail_handle')
        .order('created_at', { ascending: false });
      
      if (clientErr) {
        addToHistory(`❌ Error: ${clientErr.message}`);
        return;
      }
      
      addToHistory('');
      addToHistory('👥 CLIENTS:');
      addToHistory('━━━━━━━━━━━');
      if (!clients || clients.length === 0) {
        addToHistory('  No clients found');
    } else {
        clients.forEach((c: { id: string; username: string; mail_handle: string }) => {
          addToHistory(`${c.username || 'no-name'}`);
          addToHistory(`  ID: ${c.id}`);
          addToHistory(`  Handle: @${c.mail_handle || 'none'}`);
          addToHistory('');
        });
      }
    } catch (err) {
      addToHistory(`❌ Error: ${err}`);
    }
  }, [isBanAdmin, addToHistory]);

  // Give items to another player
  const giveToPlayer = useCallback(async (username: string, type: string, amount: number) => {
    if (!isBanAdmin) {
      addToHistory('❌ ACCESS DENIED - Only Bernardo/Logan can give items');
      return;
    }

    try {
      // Find user by username (case insensitive)
      const { data: clientData, error: clientErr } = await supabase
        .from('clients')
        .select('id, username')
        .ilike('username', username)
        .maybeSingle();

      // Also check employees
      const { data: employeeData, error: employeeErr } = await supabase
        .from('employees')
        .select('id, name')
        .ilike('name', username)
        .maybeSingle();

      const targetUser = clientData || employeeData;
      const targetName = clientData?.username || employeeData?.name;
      const targetId = targetUser?.id;

      if (!targetUser || !targetId) {
        addToHistory(`❌ User "${username}" not found`);
        return;
      }

      // Fetch their game data
      const { data: gameData, error: gameErr } = await supabase
        .from('user_game_data')
        .select('*')
        .eq('user_id', targetId)
        .maybeSingle();

      if (gameErr) {
        addToHistory(`❌ Error fetching game data: ${gameErr.message}`);
        return;
      }

      if (!gameData) {
        addToHistory(`❌ No game data for ${targetName}. They need to play first.`);
        return;
      }

      // Update based on type
      let updateData: Record<string, unknown> = {};
      let successMsg = '';

      switch (type.toLowerCase()) {
        case 'money':
          updateData.yates_dollars = (gameData.yates_dollars || 0) + amount;
          successMsg = `💰 Gave $${amount.toLocaleString()} to ${targetName}!`;
          break;
        case 'tokens':
          updateData.prestige_tokens = (gameData.prestige_tokens || 0) + amount;
          successMsg = `✨ Gave ${amount} prestige tokens to ${targetName}!`;
          break;
        case 'miners':
          updateData.miner_count = Math.min(360, (gameData.miner_count || 0) + amount);
          successMsg = `👷 Gave ${amount} miners to ${targetName}!`;
          break;
        default:
          addToHistory(`❌ Unknown type: ${type}. Use: money, tokens, miners`);
          return;
      }

      // Save to Supabase
      const { error: updateErr } = await supabase
        .from('user_game_data')
        .update(updateData)
        .eq('user_id', targetId);

      if (updateErr) {
        addToHistory(`❌ Update failed: ${updateErr.message}`);
        return;
      }

      addToHistory(successMsg);
      addToHistory(`📊 ${targetName}'s new balance:`);
      if (type.toLowerCase() === 'money') {
        addToHistory(`   💵 $${(updateData.yates_dollars as number).toLocaleString()}`);
      } else if (type.toLowerCase() === 'tokens') {
        addToHistory(`   ✨ ${updateData.prestige_tokens} tokens`);
      } else if (type.toLowerCase() === 'miners') {
        addToHistory(`   👷 ${updateData.miner_count} miners`);
      }
    } catch (err) {
      addToHistory(`❌ Error: ${err}`);
    }
  }, [isBanAdmin, addToHistory]);

  const executeCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    addToHistory(`> ${trimmed}`);

    // Check employee access for all commands except clear
    if (!isEmployee && trimmed !== 'clear' && trimmed !== 'clear()') {
      addToHistory('❌ ACCESS DENIED - Employees only');
      return;
    }

    // Parse command
    if (trimmed === 'help') {
      addToHistory('');
      addToHistory('⛏️ EMPLOYEE COMMANDS:');
      addToHistory('━━━━━━━━━━━━━━━━━━━━━');
      addToHistory('reset          - Reset your progress');
      addToHistory(`pcx [id]       - Give pickaxe (1-${PICKAXES.length})`);
      addToHistory('allpcx         - Unlock all pickaxes');
      addToHistory(`allrocks       - Unlock all rocks (${ROCKS.length})`);
      addToHistory('money [amt]    - Add Yates Dollars');
      addToHistory('miners [amt]   - Add miners');
      addToHistory('trinket [id]   - Give trinket');
      addToHistory('trinkets       - List all trinkets');
      addToHistory('tokens [amt]   - Add prestige tokens');
      addToHistory('prestige       - Force prestige');
      addToHistory('autoprestige   - Toggle auto-prestige');
      addToHistory('cm             - Toggle auto-clicker (no autoprestige)');
      addToHistory('unblock        - Clear anti-cheat block');
      addToHistory('ability        - Get pcx with ability + $50M');
      addToHistory('clear          - Clear terminal');
      if (isBanAdmin) {
        addToHistory('');
        addToHistory('🔨 ADMIN COMMANDS (Bernardo/Logan only):');
        addToHistory('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        addToHistory('users                  - List all clients');
        addToHistory('give [user] [type] [amt]');
        addToHistory('                       - Give items to player');
        addToHistory('                       - Types: money, tokens, miners');
        addToHistory('ban [id/email/name] [reason]');
        addToHistory('                       - Ban by ID, email, or username');
        addToHistory('unban [id]             - Unban a user');
        addToHistory('banned                 - List all banned');
      }
      addToHistory('');
    } 
    else if (trimmed === 'reset') {
      resetGame();
      addToHistory('🎮 Progress reset! Refresh the page.');
    }
    else if (trimmed.startsWith('pcx ')) {
      const idStr = trimmed.slice(4).trim();
      const id = parseInt(idStr, 10);
      if (isNaN(id) || id < 1 || id > PICKAXES.length) {
        addToHistory(`❌ Invalid pickaxe ID. Use 1-${PICKAXES.length}`);
      } else {
        givePickaxe(id);
        equipPickaxe(id);
        const pcx = PICKAXES.find(p => p.id === id);
        addToHistory(`⛏️ Gave pickaxe: ${pcx?.name} (ID: ${id})`);
      }
    }
    else if (trimmed === 'allpcx') {
      PICKAXES.forEach(p => {
        givePickaxe(p.id);
      });
      equipPickaxe(PICKAXES[PICKAXES.length - 1].id);
      addToHistory(`⛏️ Unlocked ALL pickaxes! (${PICKAXES.length} total)`);
    }
    // All rocks command
    else if (trimmed === 'allrocks') {
      const maxUnlock = ROCKS[ROCKS.length - 1].unlockAtClicks;
      setTotalClicks(maxUnlock + 1000);
      addToHistory(`🪨 Unlocked ALL rocks! (${ROCKS.length} total)`);
    }
    // Auto-prestige toggle (separate from CM)
    else if (trimmed === 'autoprestige') {
      toggleAutoPrestige();
      addToHistory(`🤖 Auto-prestige ${gameState.autoPrestigeEnabled ? 'DISABLED' : 'ENABLED'}`);
    }
    else if (trimmed.startsWith('money ')) {
      const amtStr = trimmed.slice(6).trim();
      const amt = parseInt(amtStr, 10);
      if (isNaN(amt)) {
        addToHistory('❌ Invalid amount');
      } else {
        addMoney(amt);
        addToHistory(`💰 Added $${amt.toLocaleString()} Yates Dollars!`);
      }
    }
    // CM toggle
    else if (trimmed === 'cm') {
      setCmActive(prev => !prev);
      // Clear block and click history when toggling CM
      clearClickHistory();
      if (gameState.isBlocked) {
        dismissWarning();
      }
      addToHistory(cmActive ? '🛑 CM mode DEACTIVATED' : '🤫 CM mode ACTIVATED');
    }
    // Unblock command
    else if (trimmed === 'unblock') {
      clearClickHistory();
      if (gameState.isBlocked) {
        dismissWarning();
        addToHistory('✅ Block cleared - you can click again');
      } else {
        addToHistory('✅ Click history cleared');
      }
    }
    // Ability test command - gives Heavens pickaxe (ID 17) + money
    else if (trimmed === 'ability') {
      // Give pickaxes 1-17 (Heavens has first ability)
      for (let i = 1; i <= 17; i++) {
        buyPickaxe(i);
      }
      equipPickaxe(17);
      addMoney(50000000); // $50M to use abilities
      addToHistory('✨ ABILITY TEST MODE:');
      addToHistory('   Got Heavens pickaxe (ID 17)');
      addToHistory('   +$50M for ability costs');
      addToHistory('');
      addToHistory('📋 Pickaxes with abilities:');
      addToHistory('   17: Heavens - Divine Speed (+50% miners)');
      addToHistory('   18: Demon - Demon Rage (3x damage)');
      addToHistory('   19: Nuclear - Instant break');
      addToHistory('   21: Nightmare - +15% everything');
      addToHistory('');
      addToHistory('Use "pcx 18/19/21" to switch pickaxes');
    }
    // Ban commands
    else if (trimmed.startsWith('ban ')) {
      const args = trimmed.slice(4).trim();
      const spaceIndex = args.indexOf(' ');
      const targetId = spaceIndex > 0 ? args.slice(0, spaceIndex) : args;
      const reason = spaceIndex > 0 ? args.slice(spaceIndex + 1) : undefined;
      banUser(targetId, reason);
    }
    else if (trimmed.startsWith('unban ')) {
      const targetId = trimmed.slice(6).trim();
      unbanUser(targetId);
    }
    else if (trimmed === 'banned') {
      listBanned();
    }
    else if (trimmed === 'users') {
      listUsers();
    }
    // Give command - give items to other players
    else if (trimmed.startsWith('give ')) {
      const parts = trimmed.slice(5).trim().split(' ');
      if (parts.length < 3) {
        addToHistory('❌ Usage: give [username] [type] [amount]');
        addToHistory('   Types: money, tokens, miners');
        addToHistory('   Example: give Logan money 1000000');
      } else {
        const [username, type, amtStr] = parts;
        const amount = parseInt(amtStr, 10);
        if (isNaN(amount) || amount <= 0) {
          addToHistory('❌ Invalid amount. Must be a positive number.');
        } else {
          giveToPlayer(username, type, amount);
        }
      }
    }
    else if (trimmed === 'clear' || trimmed === 'clear()') {
      setHistory(['🔒 ADMIN TERMINAL', 'Type help for commands', '']);
    }
    // Miners command
    else if (trimmed.startsWith('miners ')) {
      const amtStr = trimmed.slice(7).trim();
      const amt = parseInt(amtStr, 10);
      if (isNaN(amt) || amt <= 0) {
        addToHistory('❌ Invalid amount. Usage: miners 10');
      } else {
        addMiners(amt);
        addToHistory(`👷 Added ${amt} miners!`);
      }
    }
    // Trinket list command
    else if (trimmed === 'trinkets') {
      addToHistory('');
      addToHistory('💍 AVAILABLE TRINKETS:');
      addToHistory('━━━━━━━━━━━━━━━━━━━━━━━');
      TRINKETS.forEach(t => {
        addToHistory(`${t.id} - ${t.name} (${t.rarity})`);
      });
      addToHistory('');
      addToHistory('Use: trinket [id]');
    }
    // Trinket give command
    else if (trimmed.startsWith('trinket ')) {
      const trinketId = trimmed.slice(8).trim();
      const trinket = TRINKETS.find(t => t.id === trinketId);
      if (!trinket) {
        addToHistory(`❌ Unknown trinket: ${trinketId}`);
        addToHistory('Use "trinkets" to see available IDs');
      } else {
        giveTrinket(trinketId);
        addToHistory(`💍 Gave trinket: ${trinket.name}`);
      }
    }
    // Prestige tokens command
    else if (trimmed.startsWith('tokens ')) {
      const amtStr = trimmed.slice(7).trim();
      const amt = parseInt(amtStr, 10);
      if (isNaN(amt) || amt <= 0) {
        addToHistory('❌ Invalid amount. Usage: tokens 10');
      } else {
        addPrestigeTokens(amt);
        addToHistory(`✨ Added ${amt} prestige tokens!`);
      }
    }
    // Force prestige command - bypasses requirements for employees
    else if (trimmed === 'prestige') {
      const result = prestige(true); // Force=true bypasses requirements
      if (result) {
        addToHistory(`⚡ Force prestige activated!`);
        addToHistory(`✨ New multiplier: ${result.newMultiplier.toFixed(1)}x`);
      } else {
        addToHistory(`❌ Prestige failed (unknown error)`);
      }
    }
    else {
      addToHistory(`❌ Unknown command: ${trimmed}`);
      addToHistory('Type help for available commands');
    }
  }, [addToHistory, resetGame, buyPickaxe, equipPickaxe, isEmployee, isBanAdmin, cmActive, banUser, unbanUser, listBanned, listUsers, giveToPlayer, addMoney, addMiners, addPrestigeTokens, giveTrinket, setTotalClicks, prestige, toggleAutoPrestige, gameState.autoPrestigeEnabled, gameState.isBlocked, dismissWarning, clearClickHistory, givePickaxe]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Add to command history
      setCommandHistory(prev => [...prev, input.trim()]);
      setHistoryIndex(-1);
      executeCommand(input);
      setInput('');
    }
  };

  // Handle arrow key navigation through command history
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      
      const newIndex = historyIndex === -1 
        ? commandHistory.length - 1 
        : Math.max(0, historyIndex - 1);
      
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
    } 
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      
      const newIndex = historyIndex + 1;
      
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    }
  };

  // Don't render for non-employees
  if (!isOpen || !isEmployee) return null;

  return (
    <div
      ref={terminalRef}
      className="fixed bottom-4 right-4 w-80 sm:w-96 bg-black/95 border border-red-500/50 rounded-lg shadow-2xl shadow-red-500/20 z-[200] font-mono text-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-red-500/30 bg-red-900/20">
        <div className="flex items-center gap-2">
          <span className="text-red-400">🔒</span>
          <span className="text-red-300 text-xs">ADMIN TERMINAL</span>
          {cmActive && (
            <span className="text-yellow-400 text-xs animate-pulse">[CM]</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-red-500 hover:text-red-300 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* History */}
      <div
        ref={historyRef}
        className="h-48 overflow-y-auto p-3 text-red-400 text-xs space-y-0.5"
      >
        {history.map((line, i) => (
          <div key={i} className={line.startsWith('>') ? 'text-red-200' : ''}>
            {line || '\u00A0'}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-red-500/30">
        <div className="flex items-center px-3 py-2">
          <span className="text-red-500 mr-2">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-red-300 outline-none placeholder-red-700"
            placeholder="admin command..."
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </form>
    </div>
  );
}
