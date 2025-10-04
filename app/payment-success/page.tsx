'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, ArrowRight, Home, CreditCard, AlertCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface PaymentResult {
  status: 'success' | 'failed';
  orderId?: string;
  invoiceNumber?: string;
  successfulDomains?: string[];
  failedDomains?: string[];
  errorMessage?: string;
  amount?: number;
  currency?: string;
}

export default function PaymentResultPage() {
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user is logged in
    const getCookieValue = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const token = getCookieValue('token') || localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const userObj = JSON.parse(userData);
        setUser(userObj);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Get payment result from session storage (cleaner than URL parameters)
    const paymentResultData = sessionStorage.getItem('paymentResult');

    if (paymentResultData) {
      try {
        const parsedResult = JSON.parse(paymentResultData);
        setResult(parsedResult);

        // Clear the session storage after reading
        sessionStorage.removeItem('paymentResult');
      } catch (error) {
        console.error('Error parsing payment result:', error);
        setResult(null);
      }
    } else {
      // Fallback to URL parameters for backward compatibility
      const status = searchParams.get('status');
      const orderId = searchParams.get('orderId');
      const invoiceNumber = searchParams.get('invoiceNumber');
      const successfulDomains = searchParams.get('successfulDomains')?.split(',') || [];
      const failedDomains = searchParams.get('failedDomains')?.split(',') || [];
      const errorMessage = searchParams.get('errorMessage');
      const amount = searchParams.get('amount');
      const currency = searchParams.get('currency');

      if (status) {
        setResult({
          status: status as 'success' | 'failed',
          orderId: orderId || undefined,
          invoiceNumber: invoiceNumber || undefined,
          successfulDomains: successfulDomains.length > 0 ? successfulDomains : undefined,
          failedDomains: failedDomains.length > 0 ? failedDomains : undefined,
          errorMessage: errorMessage || undefined,
          amount: amount ? parseFloat(amount) : undefined,
          currency: currency || 'INR',
        });
      }
    }

    setIsLoading(false);
  }, [searchParams]);

  const handleRetryPayment = () => {
    router.push('/checkout');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleGoToHomepage = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Result Not Found</h1>
            <p className="text-gray-600 mb-8">We couldn't find the payment result. Please check your order history.</p>
            <div className="space-x-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Go to Dashboard
              </Link>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                <Home className="h-5 w-5 mr-2" />
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {result.status === 'success' ? (
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            ) : (
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            )}
          </div>

          {/* Status Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {result.status === 'success' ? 'Payment Successful!' : 'Payment Failed'}
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            {result.status === 'success'
              ? 'Your payment has been processed successfully.'
              : 'We encountered an issue processing your payment.'
            }
          </p>

          {/* Order Details */}
          {result.status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Order Details</h3>
              <div className="space-y-2 text-sm">
                {result.orderId && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Order ID:</span>
                    <span className="font-mono text-green-800">{result.orderId}</span>
                  </div>
                )}
                {result.invoiceNumber && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Invoice Number:</span>
                    <span className="font-mono text-green-800">{result.invoiceNumber}</span>
                  </div>
                )}
                {result.amount && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Amount:</span>
                    <span className="font-semibold text-green-800">₹{result.amount.toFixed(2)} {result.currency}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Domain Results */}
          {result.successfulDomains && Array.isArray(result.successfulDomains) && result.successfulDomains.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-left">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Successfully Registered Domains</h3>
              <div className="space-y-2">
                {result.successfulDomains.map((domain, index) => (
                  <div key={index} className="flex items-center text-green-700">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    <span className="font-mono">{domain}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.failedDomains && Array.isArray(result.failedDomains) && result.failedDomains.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 text-left">
              <h3 className="text-lg font-semibold text-red-800 mb-3">Failed Domain Registrations</h3>
              <div className="space-y-2">
                {result.failedDomains.map((domain, index) => (
                  <div key={index} className="flex items-center text-red-700">
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    <span className="font-mono">{domain}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-red-600 mt-3">
                Please contact support for assistance with failed registrations.
              </p>
            </div>
          )}

          {/* Error Message */}
          {result.status === 'failed' && result.errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Details</h3>
              <p className="text-red-700">{result.errorMessage}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {result.status === 'success' ? (
              <div className="space-y-3">
                <button
                  onClick={handleGoToDashboard}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
                <button
                  onClick={handleGoToHomepage}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Go to Homepage
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleRetryPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Retry Payment
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
                <button
                  onClick={handleGoToDashboard}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Go to Dashboard
                </button>
                <button
                  onClick={handleGoToHomepage}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Go to Homepage
                </button>
              </div>
            )}
          </div>

          {/* Support Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@exceltechnologies.com" className="text-blue-600 hover:text-blue-700">
                support@exceltechnologies.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
