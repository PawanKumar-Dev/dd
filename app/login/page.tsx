'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Check if user is already logged in (either custom auth or NextAuth)
    const getCookieValue = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const token = getCookieValue('token') || localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    // Check for custom token auth
    if (token && userData) {
      // User is already logged in, redirect to return URL or dashboard
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl');
      router.push(returnUrl || '/dashboard');
      return;
    }

    // Check for NextAuth session (social login)
    if (status === 'authenticated' && session) {
      // User is logged in via social auth, redirect to dashboard
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl');
      router.push(returnUrl || '/dashboard');
      return;
    }

    // Only stop loading when we're sure the user is not authenticated
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [router, session, status]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <LoginForm />;
}