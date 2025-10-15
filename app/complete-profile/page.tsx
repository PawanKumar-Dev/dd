'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ProfileCompletionForm from '@/components/ProfileCompletionForm';
import ClientOnly from '@/components/ClientOnly';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileCompleted?: boolean;
}

export default function CompleteProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user) {
      // Check if user has already completed profile
      if ((session.user as any).profileCompleted) {
        const returnUrl = searchParams.get('returnUrl') || '/dashboard';
        router.push(returnUrl);
        return;
      }
    }

    setIsLoading(false);
  }, [session, status, router, searchParams]);

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <ClientOnly>
      {/* Profile Completion Required Message */}
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Important Notice */}
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Profile Completion Required
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    <strong>You must complete your profile before you can proceed to checkout.</strong>
                    This is required to process your domain registration and ensure we have all necessary information for your order.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <ProfileCompletionForm
            user={{
              id: (session.user as any).id,
              email: session.user.email || '',
              firstName: session.user.name?.split(' ')[0] || '',
              lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
            }}
            onComplete={() => {
              // Profile completion handled in the form component
            }}
          />
        </div>
      </div>
    </ClientOnly>
  );
}
