'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMail } from '@/contexts/MailContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { Conversation } from '@/types';
import { supabase } from '@/lib/supabase';
import MessageDetailSidebar from './MessageDetailSidebar';
import ComposeMessageModal from './ComposeMessageModal';
import TerminalPasswordDisplay from './TerminalPasswordDisplay';

interface CheatAppeal {
  id: string;
  user_id: string;
  user_type: string;
  username: string;
  appeal_reason: string;
  status: string;
  created_at: string;
}

interface InboxSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortOrder = 'latest' | 'priority' | 'sent';

export default function InboxSidebar({ isOpen, onClose }: InboxSidebarProps) {
  const router = useRouter();
  const { conversations, markAsRead } = useMail();
  const { employee } = useAuth();
  const { client, setClient } = useClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [showCompose, setShowCompose] = useState(false);
  const [showAppeals, setShowAppeals] = useState(false);
  const [showSystemPanel, setShowSystemPanel] = useState(false);
  const [appeals, setAppeals] = useState<CheatAppeal[]>([]);
  const [processingAppeal, setProcessingAppeal] = useState<string | null>(null);
  
  // Get current user (employee or client)
  const currentUserId = employee?.id || client?.id || '';
  const currentUserName = employee?.name || client?.username || '';
  const isEmployee = !!employee;

  // Check if user is an admin who can review appeals (Logan or Bernardo)
  const canReviewAppeals = employee?.id === '000001' || employee?.id === '123456';

  // Fetch pending appeals for admins
  const fetchAppeals = useCallback(async () => {
    if (!canReviewAppeals) return;
    
    const { data, error } = await supabase
      .from('cheat_appeals')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setAppeals(data);
    }
  }, [canReviewAppeals]);

  useEffect(() => {
    if (canReviewAppeals && isOpen) {
      fetchAppeals();
    }
  }, [canReviewAppeals, isOpen, fetchAppeals]);

  // Handle appeal decision
  const handleAppealDecision = async (appealId: string, approved: boolean) => {
    setProcessingAppeal(appealId);
    const appeal = appeals.find(a => a.id === appealId);
    if (!appeal) return;

    try {
      // Update appeal status
      await supabase
        .from('cheat_appeals')
        .update({
          status: approved ? 'approved' : 'denied',
          resolved_by: employee?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', appealId);

      if (approved) {
        // Clear warnings and add to watchlist
        await supabase
          .from('user_game_data')
          .update({
            anti_cheat_warnings: 0,
            is_on_watchlist: true,
            is_blocked: false,
            appeal_pending: false,
          })
          .eq('user_id', appeal.user_id);
        
        console.log(`✅ Appeal approved for ${appeal.username}`);
      } else {
        // Wipe user data
        await supabase
          .from('user_game_data')
          .delete()
          .eq('user_id', appeal.user_id);
        
        await supabase
          .from('user_purchases')
          .delete()
          .eq('user_id', appeal.user_id);
        
        console.log(`❌ Appeal denied for ${appeal.username} - data wiped`);
      }

      // Send result email to user
      const resultMessage = approved
        ? `🎉 Good news! Your appeal has been APPROVED.\n\nYou can continue playing, but you're now on a watchlist. Any further violations will result in immediate ban.\n\nPlay fair!`
        : `😔 Your appeal has been DENIED.\n\nYour game data has been wiped due to cheating violations.\n\nIf you believe this was a mistake, you can try creating a new account and playing fairly.`;

      await supabase.from('employee_messages').insert({
        recipient_id: appeal.user_id,
        sender_name: 'Anti-Cheat System',
        sender_handle: 'anticheat.system',
        subject: approved ? '✅ Appeal Approved' : '❌ Appeal Denied',
        content: resultMessage,
        is_read: false,
      });

      // Refresh appeals list
      await fetchAppeals();
    } catch (err) {
      console.error('Error processing appeal:', err);
    } finally {
      setProcessingAppeal(null);
    }
  };

  if (!isOpen) return null;

  const handleConversationClick = async (conv: Conversation) => {
    setSelectedConversation(conv);
    if (currentUserId) {
      await markAsRead(conv.id, currentUserId);
    }
  };

  const handleNewMessageClick = () => {
    // Check localStorage directly as a fallback (in case context hasn't hydrated yet)
    const savedClient = typeof window !== 'undefined' ? localStorage.getItem('yates-client') : null;
    const hasClient = client || savedClient;
    
    // If not registered as client and not an employee, redirect to signup page
    if (!employee && !hasClient) {
      onClose(); // Close inbox sidebar first
      router.push('/client-signup');
    } else {
      // If client is in localStorage but not in state, refresh it
      if (!client && savedClient) {
        setClient(JSON.parse(savedClient));
      }
      setShowCompose(true);
    }
  };

  const handleCloseMessageDetail = () => {
    setSelectedConversation(null);
  };

  // Filter and sort conversations based on selected order
  const filteredConversations = conversations.filter((conv) => {
    if (sortOrder === 'sent') {
      // For "Sent", only show conversations where the current user sent the last message
      return conv.last_message_at && currentUserId ? true : false; // Show all for now
    }
    return true;
  });

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (sortOrder === 'latest') {
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    } else if (sortOrder === 'priority') {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    } else if (sortOrder === 'sent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  return (
    <>
      {/* Backdrop - only show if no compose modal */}
      {!showCompose && (
        <div
          className="fixed inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-40"
          onClick={onClose}
        />
      )}

      {/* Inbox Sidebar */}
      <div className="fixed right-0 top-16 bottom-0 w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inbox</h2>
            <div className="flex gap-2">
              <button
                onClick={handleNewMessageClick}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                ✉️ New
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setSortOrder('latest'); setShowAppeals(false); }}
              className={`px-3 py-1 rounded text-sm ${
                sortOrder === 'latest' && !showAppeals
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => { setSortOrder('priority'); setShowAppeals(false); }}
              className={`px-3 py-1 rounded text-sm ${
                sortOrder === 'priority' && !showAppeals
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Priority
            </button>
            <button
              onClick={() => { setSortOrder('sent'); setShowAppeals(false); }}
              className={`px-3 py-1 rounded text-sm ${
                sortOrder === 'sent' && !showAppeals
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Sent
            </button>
            {canReviewAppeals && (
              <button
                onClick={() => setShowAppeals(true)}
                className={`px-3 py-1 rounded text-sm ${
                  showAppeals
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}
              >
                ⚠️ Appeals {appeals.length > 0 && `(${appeals.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Conversations List or Appeals List */}
        <div className="flex-1 overflow-y-auto">
          {/* System Panel for Employees - Terminal Password */}
          {isEmployee && !showAppeals && (
            <div
              onClick={() => setShowSystemPanel(true)}
              className="p-4 border-b-2 border-red-500/50 dark:border-red-500/30 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition bg-gradient-to-r from-red-50 to-transparent dark:from-red-900/10 dark:to-transparent"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔐</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    SYSTEM
                  </span>
                </div>
                <span className="text-xs text-red-500/70 dark:text-red-400/70 font-mono">
                  LIVE
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Terminal Access Password
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Click to view current password
              </p>
            </div>
          )}

          {showAppeals && canReviewAppeals ? (
            // Appeals List for Admins
            <div>
              {appeals.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p>🎉 No pending appeals!</p>
                  <p className="text-sm mt-2">All cheaters have been dealt with.</p>
                </div>
              ) : (
                appeals.map((appeal) => (
                  <div
                    key={appeal.id}
                    className="p-4 border-b dark:border-gray-700 bg-red-50 dark:bg-red-900/20"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          ⚠️ {appeal.username}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          ({appeal.user_type})
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(appeal.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      &quot;{appeal.appeal_reason}&quot;
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAppealDecision(appeal.id, true)}
                        disabled={processingAppeal === appeal.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                      >
                        {processingAppeal === appeal.id ? '...' : '✅ Approve'}
                      </button>
                      <button
                        onClick={() => handleAppealDecision(appeal.id, false)}
                        disabled={processingAppeal === appeal.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                      >
                        {processingAppeal === appeal.id ? '...' : '❌ Deny & Wipe'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : sortedConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {!employee && !client ? (
                <div>
                  <p className="mb-2">Click &quot;✉️ New&quot; to create your mail handle and start messaging!</p>
                </div>
              ) : (
                'No messages yet'
              )}
            </div>
          ) : (
            sortedConversations.map((conv) => {
              const unreadForUser = currentUserId ? (conv.unread_for?.[currentUserId] || 0) : 0;
              const isUnread = unreadForUser > 0;

              // Get "To" display - show other participant names
              const otherParticipants = conv.participant_names.filter(
                (name) => name !== currentUserName
              );
              const toDisplay = otherParticipants.join(', ') || conv.participant_names[0];

              return (
                <div
                  key={conv.id}
                  onClick={() => handleConversationClick(conv)}
                  className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                    isUnread ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          To→{toDisplay}
                        </span>
                        {conv.priority === 'high' && (
                          <span className="text-red-500 text-xs">🔴 Priority</span>
                        )}
                      </div>
                      {isUnread && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                          {unreadForUser} unread
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(conv.last_message_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-1">
                    {conv.subject}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {conv.last_message}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message Detail Sidebar - slides over half of inbox */}
      {selectedConversation && (
        <MessageDetailSidebar
          conversation={selectedConversation}
          onClose={handleCloseMessageDetail}
        />
      )}

      {/* Compose Message Modal */}
      <ComposeMessageModal 
        isOpen={showCompose} 
        onClose={() => setShowCompose(false)} 
      />

      {/* System Panel - Terminal Password Display */}
      {showSystemPanel && isEmployee && (
        <TerminalPasswordDisplay onClose={() => setShowSystemPanel(false)} />
      )}
    </>
  );
}
