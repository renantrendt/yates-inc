'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function EmployeeLoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(employeeId, password);

    if (result.success) {
      router.push('/');
    } else {
      if (result.error === 'id') {
        setError("I'm sorry you typed id wrong, please try again, or check if you are in the wrong space.");
      } else if (result.error === 'password') {
        setError("I'm sorry you typed password wrong, please try again, or check if you are in the wrong space.");
      } else {
        setError("Login failed. Please try again.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Employee Login</h1>
          <p className="text-gray-700 dark:text-gray-300 text-center mb-6 text-lg">Log-in:</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Employee ID"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-base"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

