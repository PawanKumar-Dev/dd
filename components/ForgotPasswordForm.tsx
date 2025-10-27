'use client';

import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import Logo from './Logo';
import toast from 'react-hot-toast';
import { useRecaptcha } from '@/hooks/useRecaptcha';

interface ForgotPasswordFormProps {
  className?: string;
}

export default function ForgotPasswordForm({ className = '' }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { executeRecaptcha } = useRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(''); // Clear previous errors

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha('forgot_password');

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, recaptchaToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('Password reset email sent!');
      } else {
        // Set error state and show toast
        const errorMessage = data.message || data.error || 'Failed to send reset email';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'An error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a password reset link to {email}
            </p>
          </div>

          <Card>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Email Sent Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Please check your email and click the link to reset your password.
                The link will expire in 1 hour.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  fullWidth
                >
                  Send Another Email
                </Button>
                <a
                  href="/login"
                  className="btn btn-secondary w-full inline-flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <Card>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Mail className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              icon={<Mail className="h-4 w-4 text-gray-400" />}
              helperText="We'll send a password reset link to this email"
            />

            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              icon={<Mail className="h-4 w-4" />}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="text-center">
              <a
                href="/login"
                className="text-sm font-medium text-primary-600 hover:text-primary-500 inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </a>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
