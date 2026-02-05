'use client';

import { useState, useEffect } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Emergency logout - run window.emergencyLogout() in browser console
if (typeof window !== 'undefined') {
  (window as any).emergencyLogout = () => {
    localStorage.removeItem('yates-client');
    localStorage.removeItem('yates-employee');
    console.log('🚪 Logged out! Refreshing...');
    window.location.reload();
  };
  console.log('💡 Stuck? Run: window.emergencyLogout()');
}

export default function PasswordSetupPopup() {
  const { client, setClient } = useClient();
  const { employee } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(true);

  // Check if client needs to set a password
  useEffect(() => {
    async function checkPassword() {
      // Only show for clients, not employees
      if (employee || !client) {
        setCheckingPassword(false);
        return;
      }

      try {
        // Check if client has a password set
        // Select all fields since 'password' column might not exist yet
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', client.id)
          .single();

        if (error) {
          // Column might not exist yet - that's ok, show the popup
          console.log('Password column may not exist yet, showing setup popup');
          setNeedsPassword(true);
          setCheckingPassword(false);
          return;
        }

        // If no password or password is null/empty, show popup
        // Check if password property exists and has a value
        if (!data?.password) {
          setNeedsPassword(true);
        }
      } catch (err) {
        console.error('Error:', err);
        // On error, show the popup anyway
        setNeedsPassword(true);
      } finally {
        setCheckingPassword(false);
      }
    }

    checkPassword();
  }, [client, employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setLoading(true);

    try {
      // Save password to database
      const { error: updateError } = await supabase
        .from('clients')
        .update({ password: password })
        .eq('id', client!.id);

      if (updateError) {
        throw updateError;
      }

      // Success - close popup
      setNeedsPassword(false);
      alert('Password set successfully! Remember it for next time.');
    } catch (err) {
      console.error('Error setting password:', err);
      setError('Failed to save password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Don't show if checking, no client, is employee, or doesn't need password
  if (checkingPassword || !client || employee || !needsPassword) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9998] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border-2 border-yellow-500 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-yellow-400 mb-2">
            Security Update!
          </h1>
          <p className="text-gray-300">
            Halo! Logan has been complaining about security, so I have added passwords!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Your email/username: <span className="text-white font-medium">{client.username}</span>
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Write ur password here :)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
              minLength={4}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type it again to confirm"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
              minLength={4}
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-bold py-3 rounded-lg transition-colors text-lg"
          >
            {loading ? 'Saving...' : '✓ Set Password'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          This password will be required when you log in next time.
        </p>
      </div>
    </div>
  );
}
