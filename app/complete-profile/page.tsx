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
    </ClientOnly>
  );
}
