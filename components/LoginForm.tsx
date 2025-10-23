'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User, CheckCircle } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import Logo from './Logo';
import SocialLoginButtons from './SocialLoginButtons';
import toast from 'react-hot-toast';
import { showSuccessToast, showErrorToast, showAccountDeactivated } from '@/lib/toast';

interface LoginFormProps {
  className?: string;
}

export default function LoginForm({ className = '' }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activationMessage, setActivationMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load form data from localStorage on component mount (excluding password)
  useEffect(() => {
    const savedData = localStorage.getItem('loginFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(prev => ({
          ...prev,
          email: parsedData.email || '',
          rememberMe: parsedData.rememberMe || false,
          // Don't restore password for security
          password: '',
        }));
      } catch (error) {
        // Error parsing saved form data
      }
    }

    // Check for activation message
    const message = searchParams.get('message');
    if (message) {
      setActivationMessage(decodeURIComponent(message));
    }
  }, [searchParams]);

  // Save form data to localStorage whenever it changes (excluding password)
  useEffect(() => {
    const dataToSave = {
      email: formData.email,
      rememberMe: formData.rememberMe,
      // Don't save password for security
    };
    localStorage.setItem('loginFormData', JSON.stringify(dataToSave));
  }, [formData.email, formData.rememberMe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Store token in cookie for server-side access
        document.cookie = `token=${data.token}; path=/; max-age=${formData.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60}`;

        // Store remember me preference
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('savedEmail');
        }

        // Clear saved form data on successful login
        localStorage.removeItem('loginFormData');

        showSuccessToast('Login successful!');

        // Small delay to ensure cookie is set
        setTimeout(() => {
          // Check for return URL parameter
          const urlParams = new URLSearchParams(window.location.search);
          const returnUrl = urlParams.get('returnUrl');

          if (data.user.role === 'admin') {
            router.push('/admin');
          } else if (returnUrl) {
            router.push(returnUrl);
          } else {
            router.push('/dashboard');
          }
        }, 100);
      } else {
        if (data.requiresActivation) {
          showErrorToast(data.message || 'Account not activated');
          // Redirect to activation page with user email
          setTimeout(() => {
            router.push(`/activate?email=${encodeURIComponent(formData.email)}&message=${encodeURIComponent(data.message || 'Account not activated')}`);
          }, 1000);
        } else if (data.isDeactivated) {
          // Show a more detailed error for deactivated accounts
          showAccountDeactivated(data.supportEmail);
        } else {
          showErrorToast(data.error || 'Login failed');
        }
      }
    } catch (error) {
      showErrorToast('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${className}`} style={{
      backgroundImage: `
        linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
      backgroundPosition: '0 0, 0 0'
    }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <a href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </a>
          </p>
        </div>

        <Card>
          {activationMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-green-800 text-sm font-medium">{activationMessage}</p>
              </div>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
              icon={<Mail className="h-4 w-4 text-gray-400" />}
            />

            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
                icon={<Lock className="h-4 w-4 text-gray-400" />}
                rightIcon={
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="/reset-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              icon={<User className="h-4 w-4" />}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>

            <SocialLoginButtons
              onSuccess={() => {
                // Redirect to dashboard after successful social login
                setTimeout(() => {
                  const urlParams = new URLSearchParams(window.location.search);
                  const returnUrl = urlParams.get('returnUrl');
                  router.push(returnUrl || '/dashboard');
                }, 100);
              }}
              onError={(error) => {
                // Social login error
              }}
            />
          </form>
        </Card>
      </div>
    </div>
  );
}
