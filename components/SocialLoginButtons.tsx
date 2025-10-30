'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface SocialLoginButtonsProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function SocialLoginButtons({
  className = '',
  onSuccess,
  onError
}: SocialLoginButtonsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(provider);

      // Set a timeout for the entire OAuth process
      const loginTimeout = setTimeout(() => {
        // Timeout warning
      }, 10000);

      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: '/dashboard',
      });

      clearTimeout(loginTimeout);

      if (result?.error) {
        const errorMessage = result.error === 'OAuthSignin'
          ? 'Failed to sign in. Please try again.'
          : result.error === 'OAuthCallback'
            ? 'Authentication failed. Please try again.'
            : result.error === 'OAuthCreateAccount'
              ? 'Could not create account. Please try again.'
              : result.error === 'EmailCreateAccount'
                ? 'Could not create account with this email.'
                : result.error === 'Callback'
                  ? 'Authentication callback failed.'
                  : result.error === 'OAuthAccountNotLinked'
                    ? 'This email is already associated with a different account.'
                    : result.error === 'EmailSignin'
                      ? 'Check your email for a sign-in link.'
                      : result.error === 'CredentialsSignin'
                        ? 'Invalid credentials.'
                        : result.error === 'SessionRequired'
                          ? 'Please sign in to access this page.'
                          : 'An error occurred during sign in.';

        toast.error(errorMessage);
        onError?.(errorMessage);
      } else if (result?.ok) {
        toast.success('Successfully signed in!');

        // Small delay to ensure session is set
        setTimeout(() => {
          onSuccess?.();
        }, 100);
      }
    } catch (error) {
      // Social login error
      const errorMessage = 'An unexpected error occurred. Please try again.';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading === 'google'}
          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading === 'google' ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
          ) : (
            <FcGoogle className="h-5 w-5" />
          )}
          <span className="ml-2">Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleSocialLogin('facebook')}
          disabled={isLoading === 'facebook'}
          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading === 'facebook' ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
          ) : (
            <FaFacebook className="h-5 w-5 text-blue-600" />
          )}
          <span className="ml-2">Facebook</span>
        </button>
      </div>
    </div>
  );
}
