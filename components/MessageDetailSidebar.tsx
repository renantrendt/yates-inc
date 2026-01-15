'use client';

import { useEffect, useState } from 'react';
import { useMail } from '@/contexts/MailContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { Conversation } from '@/types';

interface MessageDetailSidebarProps {
  conversation: Conversation;
  onClose: () => void;
}

export default function MessageDetailSidebar({ conversation, onClose }: MessageDetailSidebarProps) {
  const { messages, fetchMessages, sendMessage, deleteConversation } = useMail();
  const { employee } = useAuth();
  const { client } = useClient();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get current user (employee or client)
  const currentUserId = employee?.id || client?.id || '';
  const currentUserName = employee?.name || client?.username || '';

  // Check if current user is the creator (first participant = creator)
  const canDelete = currentUserId === conversation.participants[0];

  useEffect(() => {
    fetchMessages(conversation.id);
  }, [conversation.id]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId || isSending) return;

    setIsSending(true);
    await sendMessage(conversation.id, newMessage, currentUserId);
    setNewMessage('');
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;
    
    if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    const success = await deleteConversation(conversation.id, currentUserId);
    setIsDeleting(false);
    
    if (success) {
      onClose();
    } else {
      alert('Failed to delete conversation. Only the creator can delete it.');
    }
  };

  return (
    <>
      {/* Backdrop for message detail */}
      <div
        className="fixed inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30 z-50"
        onClick={onClose}
      />

      {/* Message Detail Sidebar - positioned to cover right half of inbox */}
      <div className="fixed right-0 top-16 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-[60] flex flex-col border-l-2 border-gray-300 dark:border-gray-600">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {conversation.subject}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  title="Delete conversation"
                >
                  {isDeleting ? '...' : '🗑️'}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p className="truncate">
              <strong>To:</strong> {conversation.participant_names.filter(name => name !== currentUserName).join(', ')}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages
            .filter((msg) => msg.conversation_id === conversation.id)
            .map((msg) => {
              const isSentByMe = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`${isSentByMe ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block max-w-[85%] p-3 rounded-lg ${
                      isSentByMe
                        ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg'
                        : 'bg-gradient-to-br from-gray-700 to-gray-800 dark:from-gray-700 dark:to-gray-900 text-white shadow-md'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1 opacity-90">
                      {isSentByMe ? 'You' : msg.sender_name}
                      {!isSentByMe && (
                        <span className="ml-1 opacity-75">
                          ({msg.sender_mail})
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className="text-xs mt-1 opacity-70 flex items-center justify-end gap-1">
                      <span>{new Date(msg.created_at).toLocaleString()}</span>
                      {isSentByMe && (
                        <span className={`ml-1 ${msg.is_read ? 'text-blue-300' : 'text-gray-300'}`}>
                          {msg.is_read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Reply Input */}
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 border dark:border-gray-600 rounded px-3 py-2 text-sm resize-none dark:bg-gray-700 dark:text-white"
              rows={3}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

