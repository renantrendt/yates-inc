'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ClientSignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [needsPassword, setNeedsPassword] = useState(false); // For existing users who need to enter password

  const validateUsername = (name: string): boolean => {
    // Only letters, numbers, and # allowed
    const validPattern = /^[a-zA-Z0-9#]+$/;
    return validPattern.test(name) && name.length >= 3 && name.length <= 20;
  };

  const handleRegister = async () => {
    setError('');
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!validateUsername(username)) {
      setError('Username must be 3-20 characters and only contain letters, numbers, or #');
      return;
    }

    // Password validation for new signups
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setIsChecking(true);

    try {
      const mailHandle = username.toLowerCase() + '.mail';

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('clients')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (existingUser) {
        setError('Username already taken! Try another one.');
        setIsChecking(false);
        return;
      }

      // Create new client with password
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert([
          {
            username: username.toLowerCase(),
            mail_handle: mailHandle,
            password: password, // Save password
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating client:', createError);
        setError('Error creating account. Make sure you ran the SQL setup!');
        setIsChecking(false);
        return;
      }

      if (newClient) {
        // Store in localStorage
        localStorage.setItem('yates-client', JSON.stringify({
          id: newClient.id,
          username: newClient.username,
          mail_handle: newClient.mail_handle,
        }));

        // Keep button disabled and show success message briefly before redirect
        // This gives contexts time to pick up the new client
        setTimeout(() => {
          router.push('/');
        }, 800);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Something went wrong. Check console for details.');
      setIsChecking(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    setIsChecking(true);

    try {
      // Find existing client
      const { data: existingClient, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

      if (fetchError || !existingClient) {
        setError('Account not found. Check your username or create a new one!');
        setIsChecking(false);
        return;
      }

      // Check if user has a password set
      if (existingClient.password) {
        // User has a password - verify it
        if (!password) {
          setNeedsPassword(true);
          setError('This account has a password. Please enter it.');
          setIsChecking(false);
          return;
        }
        
        if (existingClient.password !== password) {
          setError('Wrong password! Try again.');
          setIsChecking(false);
          return;
        }
      }
      // If no password set, let them in (they'll be prompted to create one via PasswordSetupPopup)

      // Store in localStorage
      localStorage.setItem('yates-client', JSON.stringify({
        id: existingClient.id,
        username: existingClient.username,
        mail_handle: existingClient.mail_handle,
      }));

      // Redirect to home
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Check console for details.');
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl">
          {/* Tab Toggle */}
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => { setMode('signup'); setError(''); setPassword(''); setConfirmPassword(''); setNeedsPassword(false); }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                mode === 'signup'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setMode('login'); setError(''); setPassword(''); setConfirmPassword(''); setNeedsPassword(false); }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Log In
            </button>
          </div>

          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            {mode === 'signup' ? 'Create Your Mail Handle' : 'Welcome Back!'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {mode === 'signup' 
              ? 'Choose a unique username to create your mail handle and start messaging employees.'
              : 'Enter your username to log back into your account.'}
          </p>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Username:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (mode === 'signup' ? handleRegister() : handleLogin())}
                placeholder={mode === 'signup' ? 'yourname' : 'your existing username'}
                className="flex-1 border dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg"
                maxLength={20}
                autoFocus
              />
              {mode === 'signup' && (
                <span className="text-gray-500 dark:text-gray-400 text-lg">.mail</span>
              )}
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                3-20 characters. Letters, numbers, and # only.
              </p>
            )}
          </div>

          {/* Password field for signup */}
          {mode === 'signup' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Password:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 4 characters)"
                  className="w-full border dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password:
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                  placeholder="Type password again"
                  className="w-full border dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg"
                />
              </div>
            </>
          )}

          {/* Password field for login (shown if user has password or needsPassword is true) */}
          {mode === 'login' && (needsPassword || password) && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter your password"
                className="w-full border dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg"
              />
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {mode === 'signup' && username && validateUsername(username) && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your mail handle will be: <strong>{username.toLowerCase()}.mail</strong>
              </p>
            </div>
          )}

          <button
            onClick={mode === 'signup' ? handleRegister : handleLogin}
            disabled={
              isChecking || 
              (mode === 'signup' && (!validateUsername(username) || password.length < 4 || password !== confirmPassword)) || 
              (mode === 'login' && !username.trim())
            }
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isChecking 
              ? (mode === 'signup' ? 'Creating Account... ✓' : 'Logging In... ✓')
              : (mode === 'signup' ? 'Create Account' : 'Log In')}
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
