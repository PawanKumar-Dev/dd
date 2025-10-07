'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const checkUserStatus = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      const response = await fetch('/api/debug/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setDebugInfo({
        localStorage: {
          token: token ? 'Present' : 'Missing',
          user: userData ? JSON.parse(userData) : 'Missing',
        },
        apiResponse: data,
      });
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearStorage = () => {
    localStorage.clear();
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setDebugInfo(null);
    alert('Storage cleared! You can now try logging in again.');
  };

  const goToLogin = () => {
    router.push('/login');
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug Page</h1>

        <div className="space-y-4 mb-6">
          <button
            onClick={checkUserStatus}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : 'Check User Status'}
          </button>

          <button
            onClick={clearStorage}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-4"
          >
            Clear Storage & Cookies
          </button>

          <button
            onClick={goToLogin}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-4"
          >
            Go to Login
          </button>

          <button
            onClick={goToDashboard}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 ml-4"
          >
            Go to Dashboard
          </button>
        </div>

        {debugInfo && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
