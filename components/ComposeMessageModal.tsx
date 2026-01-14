'use client';

import { useState, useEffect } from 'react';
import { useMail } from '@/contexts/MailContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/lib/supabase';

interface ComposeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ClientRecord {
  id: string;
  full_name: string;
  email: string;
}

const EMPLOYEES = [
  { id: '000001', name: 'Logan Wall Fencer', mail: 'ceorequest.mail' },
  { id: '39187', name: 'Mr. Michael Mackenzy McKale Mackelayne', mail: 'micelCPS.mail' },
  { id: '123456', name: 'Bernardo', mail: 'partnershiprqs.mail' },
  { id: '007411', name: 'Dylan Mad Hawk', mail: 'custumerspp.mail' },
  { id: '674121', name: 'Harris', mail: 'supplychainH.mail' },
  { id: '390738', name: 'Dilshaan', mail: 'advertising.mail' },
];

type RecipientType = 'employees' | 'clients';

export default function ComposeMessageModal({ isOpen, onClose }: ComposeMessageModalProps) {
  const { createConversation } = useMail();
  const { employee } = useAuth();
  const { client, setClient } = useClient();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [recipientType, setRecipientType] = useState<RecipientType>('employees');
  const [clientsList, setClientsList] = useState<ClientRecord[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Force refresh client from localStorage when modal opens
  useEffect(() => {
    if (isOpen && !employee) {
      const savedClient = localStorage.getItem('yates-client');
      if (savedClient && !client) {
        setClient(JSON.parse(savedClient));
      }
    }
  }, [isOpen, employee, client, setClient]);

  // Load clients list for employees
  useEffect(() => {
    async function loadClients() {
      if (!employee || !isOpen) return;
      
      setLoadingClients(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, full_name, email')
          .order('full_name');
        
        if (error) throw error;
        setClientsList(data || []);
      } catch (err) {
        console.error('Error loading clients:', err);
      } finally {
        setLoadingClients(false);
      }
    }
    
    if (recipientType === 'clients') {
      loadClients();
    }
  }, [employee, isOpen, recipientType]);

  // Reset recipients when switching type
  useEffect(() => {
    setSelectedRecipients([]);
  }, [recipientType]);

  const currentUser = employee || client;
  if (!isOpen || !currentUser) return null;

  // If client, show all employees. If employee, show other employees OR clients
  const currentUserId = employee?.id || client?.id;
  const availableEmployees = EMPLOYEES.filter((e) => e.id !== currentUserId);
  const isEmployeeUser = !!employee;

  const toggleRecipient = (employeeId: string) => {
    if (selectedRecipients.includes(employeeId)) {
      setSelectedRecipients(selectedRecipients.filter((id) => id !== employeeId));
    } else {
      setSelectedRecipients([...selectedRecipients, employeeId]);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim() || selectedRecipients.length === 0) {
      alert('Please fill in all fields and select at least one recipient');
      return;
    }

    setIsSending(true);
    
    try {
      // Include sender in participants
      const userId = employee?.id || client?.id || '';
      const participants = [userId, ...selectedRecipients];
      
      console.log('Sending message:', { subject, participants, message });
      const convId = await createConversation(subject, participants, message, userId, 'normal');
      console.log('Message sent! Conversation ID:', convId);
      
      if (convId) {
        // Reset form
        setSubject('');
        setMessage('');
        setSelectedRecipients([]);
        onClose();
        alert('Message sent successfully!');
      } else {
        alert('Failed to send message. Make sure you ran the SQL setup in Supabase!');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Check console for details.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30 z-[70]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-[80] max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compose New Message</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Recipients */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              To:
            </label>
            
            {/* Recipient Type Toggle (only for employees) */}
            {isEmployeeUser && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setRecipientType('employees')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    recipientType === 'employees'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  👔 Employees
                </button>
                <button
                  onClick={() => setRecipientType('clients')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    recipientType === 'clients'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  👤 Clients
                </button>
              </div>
            )}
            
            {/* Selected Recipients as Pills */}
            {selectedRecipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedRecipients.map((id) => {
                  const emp = EMPLOYEES.find((e) => e.id === id);
                  const clientRec = clientsList.find((c) => c.id === id);
                  const name = emp?.name || clientRec?.full_name || 'Unknown';
                  const isClient = !emp && !!clientRec;
                  
                  return (
                    <div
                      key={id}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                        isClient 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}
                    >
                      <span className="text-sm font-medium">{isClient ? '👤' : '👔'} {name}</span>
                      <button
                        onClick={() => toggleRecipient(id)}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Available Recipients as Cards */}
            {recipientType === 'employees' && (
              <div className="grid grid-cols-2 gap-2">
                {availableEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => toggleRecipient(emp.id)}
                    className={`p-3 border-2 rounded-lg text-left transition ${
                      selectedRecipients.includes(emp.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {emp.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{emp.mail}</div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Clients List (only for employees) */}
            {recipientType === 'clients' && isEmployeeUser && (
              <div className="max-h-48 overflow-y-auto">
                {loadingClients ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Loading clients...
                  </div>
                ) : clientsList.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No clients found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {clientsList.map((clientRec) => (
                      <button
                        key={clientRec.id}
                        onClick={() => toggleRecipient(clientRec.id)}
                        className={`p-3 border-2 rounded-lg text-left transition ${
                          selectedRecipients.includes(clientRec.id)
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          👤 {clientRec.full_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{clientRec.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Subject:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
              className="w-full border dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Message:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={8}
              className="w-full border dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

