'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  const [isReady, setIsReady] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    // If already authenticated, let LoginForm or middleware handle redirect
    // Just make form ready to show
    if (status === 'authenticated' && session) {
      window.location.href = '/dashboard';
      return;
    }

    // Show form when ready
    if (status === 'unauthenticated') {
      setIsReady(true);
      return;
    }

    // Fallback: show form after brief delay
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [session, status]);

  // Show brief loading
  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    );
  }

  return <LoginForm />;
}