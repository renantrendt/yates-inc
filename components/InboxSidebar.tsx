'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMail } from '@/contexts/MailContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { Conversation } from '@/types';
import MessageDetailSidebar from './MessageDetailSidebar';
import ComposeMessageModal from './ComposeMessageModal';

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
  
  // Get current user (employee or client)
  const currentUserId = employee?.id || client?.id || '';
  const currentUserName = employee?.name || client?.username || '';
  const isEmployee = !!employee;

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
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder('latest')}
              className={`px-3 py-1 rounded text-sm ${
                sortOrder === 'latest'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => setSortOrder('priority')}
              className={`px-3 py-1 rounded text-sm ${
                sortOrder === 'priority'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Priority
            </button>
            <button
              onClick={() => setSortOrder('sent')}
              className={`px-3 py-1 rounded text-sm ${
                sortOrder === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Sent
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {sortedConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {!employee && !client ? (
                <div>
                  <p className="mb-2">Click "✉️ New" to create your mail handle and start messaging!</p>
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
    </>
  );
}

