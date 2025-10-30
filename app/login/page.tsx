'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const router = useRouter();
  const { data: session, status } = useSession();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    console.log('🔍 [LoginPage] Checking authentication status...', { status, hasSession: !!session });
    setDebugInfo(`Session status: ${status}`);

    // Failsafe: Force show login form after 3 seconds if still loading
    timeoutRef.current = setTimeout(() => {
      if (status === 'loading') {
        console.warn('⚠️ [LoginPage] Session check timeout - showing login form');
        setDebugInfo('Timeout - showing login form');
        setIsLoading(false);
      }
    }, 3000);

    const checkAuth = async () => {
      try {
        // Check if user is already logged in (either custom auth or NextAuth)
        const getCookieValue = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };

        const token = getCookieValue('token') || localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        console.log('🔍 [LoginPage] Auth check:', {
          hasToken: !!token,
          hasUserData: !!userData,
          sessionStatus: status,
          hasSession: !!session
        });

        // Check for custom token auth
        if (token && userData) {
          console.log('✅ [LoginPage] Custom token found - redirecting to dashboard');
          const urlParams = new URLSearchParams(window.location.search);
          const returnUrl = urlParams.get('returnUrl');
          router.push(returnUrl || '/dashboard');
          return;
        }

        // Check for NextAuth session (social login)
        if (status === 'authenticated' && session) {
          console.log('✅ [LoginPage] NextAuth session found - redirecting to dashboard');
          const urlParams = new URLSearchParams(window.location.search);
          const returnUrl = urlParams.get('returnUrl');
          router.push(returnUrl || '/dashboard');
          return;
        }

        // If status is unauthenticated, show login form immediately
        if (status === 'unauthenticated') {
          console.log('✅ [LoginPage] No authentication found - showing login form');
          setDebugInfo('Not authenticated - ready');
          setIsLoading(false);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          return;
        }

        // If status is loading, wait a bit more (but timeout will catch it)
        if (status === 'loading') {
          console.log('⏳ [LoginPage] Session still loading...');
          setDebugInfo('Checking session...');
        }
      } catch (error) {
        console.error('❌ [LoginPage] Error checking auth:', error);
        setDebugInfo('Error checking auth');
        // Show login form on error
        setIsLoading(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    };

    checkAuth();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [router, session, status]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600 text-sm">{debugInfo || 'Loading...'}</p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-gray-400 text-xs mt-2">Session: {status}</p>
        )}
      </div>
    );
  }

  return <LoginForm />;
}