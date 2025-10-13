'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import ClientOnly from '@/components/ClientOnly';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { usePreventNavigation } from '@/hooks/usePreventNavigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentInProgress, setIsPaymentInProgress] = useState(false);
  const router = useRouter();
  const { items: cartItems, getTotalPrice, getSubtotalPrice, clearCart, syncWithServer, isLoading } = useCartStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const userObj = JSON.parse(userData);

    // Redirect admin users to admin dashboard
    if (userObj.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    setUser(userObj);

    // Sync cart with server
    syncWithServer();

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [router, syncWithServer]);

  // Prevent user from leaving page during payment processing
  usePreventNavigation(
    isPaymentInProgress,
    'Payment is in progress. Are you sure you want to leave? This may cancel your payment.'
  );

  // Redirect to dashboard if cart is empty (after cart has been loaded)
  // But not if payment is in progress
  useEffect(() => {
    if (!isLoading && cartItems.length === 0 && user && !isPaymentInProgress) {
      // Small delay to prevent immediate redirect during page load
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [cartItems.length, isLoading, user, router, isPaymentInProgress]);

  const handlePayment = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsProcessing(true);
    setIsPaymentInProgress(true);
    try {
      const token = localStorage.getItem('token');

      // Create payment order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartItems: cartItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ [CHECKOUT] Create order failed:', data);

        // Handle specific error cases
        if (data.error?.includes('Invalid payment amount')) {
          toast.error('Payment amount error. Please refresh the page and try again.');
        } else if (data.error?.includes('Amount too small')) {
          toast.error('Payment amount is too small. Minimum amount is ₹1.');
        } else if (data.error?.includes('Amount too large')) {
          toast.error('Payment amount is too large. Maximum amount is ₹10,00,000.');
        } else if (data.error?.includes('temporarily unavailable')) {
          toast.error('Payment gateway is temporarily unavailable. Please try again in a few minutes.');
        } else if (data.error?.includes('Gateway error')) {
          toast.error('Payment gateway error. Please try again or use a different payment method.');
        } else {
          toast.error(data.error || 'Failed to create payment order. Please try again.');
        }

        setIsProcessing(false);
        setIsPaymentInProgress(false);
        return;
      }

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount * 100, // Convert to paise
        currency: data.currency,
        name: 'Domain Management System',
        description: `Payment for ${cartItems.length} domain(s)`,
        order_id: data.razorpayOrderId,
        handler: async function (response: any) {
          console.log('🎉 [CHECKOUT] Payment success callback triggered:', response);
          try {
            // Verify payment
            console.log('🔍 [CHECKOUT] Starting payment verification...');
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                cartItems: cartItems,
              }),
            });

            console.log('🔍 [CHECKOUT] Verification response status:', verifyResponse.status);
            const verifyData = await verifyResponse.json();
            console.log('🔍 [CHECKOUT] Verification response data:', verifyData);

            if (verifyResponse.ok) {
              console.log('✅ [CHECKOUT] Payment verification successful');
              const {
                successfulDomains,
                orderId,
                invoiceNumber,
                registrationResults
              } = verifyData;

              // Store payment result in session storage for cleaner URL
              const paymentResult = {
                status: 'success',
                orderId: orderId || '',
                invoiceNumber: invoiceNumber || '',
                successfulDomains: successfulDomains || [],
                registrationResults: registrationResults || [],
                amount: getTotalPrice(),
                currency: 'INR',
                timestamp: Date.now()
              };

              console.log('✅ [CHECKOUT] Storing success result:', paymentResult);
              sessionStorage.setItem('paymentResult', JSON.stringify(paymentResult));

              // Clear cart immediately before redirect
              clearCart();

              // Redirect immediately to success page
              console.log('✅ [CHECKOUT] Redirecting to payment-success page');
              router.push('/payment-success');

              // Reset payment in progress flag after redirect
              setTimeout(() => setIsPaymentInProgress(false), 100);
            } else {
              console.log('❌ [CHECKOUT] Payment verification failed:', verifyData);
              // Handle restricted domains error
              if (verifyData.restrictedDomains) {
                const restrictedDomainsList = verifyData.restrictedDomains.map((d: any) => d.domainName).join(', ');
                toast.error(`Payment rejected: ${restrictedDomainsList} require additional verification. Please contact support.`);

                // Store error result for display
                const paymentResult = {
                  status: 'error',
                  message: verifyData.message || 'Payment rejected due to domain restrictions',
                  restrictedDomains: verifyData.restrictedDomains,
                  supportContact: verifyData.supportContact,
                  amount: getTotalPrice(),
                  currency: 'INR',
                  timestamp: Date.now()
                };

                sessionStorage.setItem('paymentResult', JSON.stringify(paymentResult));
                router.push('/payment-success');
                setTimeout(() => setIsPaymentInProgress(false), 100);
                return;
              }

              // Store payment result in session storage for cleaner URL
              const paymentResult = {
                status: 'failed',
                errorMessage: verifyData.error || 'Payment verification failed',
                amount: getTotalPrice(),
                currency: 'INR',
                timestamp: Date.now()
              };

              console.log('❌ [CHECKOUT] Storing failure result:', paymentResult);
              sessionStorage.setItem('paymentResult', JSON.stringify(paymentResult));

              // Clear cart immediately before redirect
              clearCart();

              // Redirect immediately to success page
              console.log('❌ [CHECKOUT] Redirecting to payment-success page');
              router.push('/payment-success');

              // Reset payment in progress flag after redirect
              setTimeout(() => setIsPaymentInProgress(false), 100);
            }
          } catch (error) {
            console.error('🚨 [CHECKOUT] Payment verification error:', error);

            // Determine error message based on error type
            let errorMessage = 'Payment verification failed due to a technical error';
            let errorType = 'verification_error';

            if (error instanceof Error) {
              if (error.message.includes('Network')) {
                errorMessage = 'Network error occurred. Please check your payment status in a few minutes.';
                errorType = 'network_error';
              } else if (error.message.includes('timeout')) {
                errorMessage = 'Request timed out. Please check your payment status in a few minutes.';
                errorType = 'timeout_error';
              } else if (error.message.includes('Unauthorized')) {
                errorMessage = 'Session expired. Please login again and try your payment.';
                errorType = 'auth_error';
              } else if (error.message.includes('400')) {
                errorMessage = 'Invalid payment data. Please try again.';
                errorType = 'invalid_data';
              } else if (error.message.includes('500')) {
                errorMessage = 'Server error occurred. Please contact support if the issue persists.';
                errorType = 'server_error';
              }
            }

            // Store payment result in session storage for cleaner URL
            const paymentResult = {
              status: 'failed',
              errorMessage: errorMessage,
              errorType: errorType,
              amount: getTotalPrice(),
              currency: 'INR',
              timestamp: Date.now(),
              supportContact: 'support@exceltechnologies.com'
            };

            console.log('🚨 [CHECKOUT] Storing catch error result:', paymentResult);
            sessionStorage.setItem('paymentResult', JSON.stringify(paymentResult));

            // Clear cart immediately before redirect
            clearCart();

            // Redirect immediately to success page
            console.log('🚨 [CHECKOUT] Redirecting to payment-success page from catch');
            router.push('/payment-success');

            // Reset payment in progress flag after redirect
            setTimeout(() => setIsPaymentInProgress(false), 100);
          }
        },
        prefill: {
          name: user ? `${user.firstName} ${user.lastName}` : '',
          email: user?.email || '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setIsPaymentInProgress(false);
            // Payment was cancelled by user
            const paymentResult = {
              status: 'failed',
              errorMessage: 'Payment was cancelled by user',
              errorType: 'user_cancelled',
              amount: getTotalPrice(),
              currency: 'INR',
              timestamp: Date.now(),
              supportContact: 'support@exceltechnologies.com'
            };

            sessionStorage.setItem('paymentResult', JSON.stringify(paymentResult));

            // Redirect immediately to success page
            router.push('/payment-success');

            // Clear cart in background after redirect (user won't see this)
            setTimeout(() => {
              clearCart();
            }, 100);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        console.log('🚨 [CHECKOUT] Payment failed:', response);
        setIsProcessing(false);
        setIsPaymentInProgress(false);

        // Determine error type and message based on Razorpay error
        let errorMessage = response.error.description || 'Payment failed';
        let errorType = 'payment_failed';

        if (response.error) {
          console.log('🚨 [CHECKOUT] Error details:', response.error);
          if (response.error.code === 'BAD_REQUEST_ERROR') {
            errorMessage = 'Invalid payment request. Please try again.';
            errorType = 'invalid_request';
          } else if (response.error.code === 'GATEWAY_ERROR') {
            errorMessage = 'Payment gateway error. Please try again or use a different payment method.';
            errorType = 'gateway_error';
          } else if (response.error.code === 'NETWORK_ERROR') {
            errorMessage = 'Network error occurred. Please check your connection and try again.';
            errorType = 'network_error';
          } else if (response.error.reason === 'payment_failed') {
            errorMessage = 'Your payment was declined. Please try a different payment method.';
            errorType = 'card_declined';
          } else if (response.error.reason === 'insufficient_funds') {
            errorMessage = 'Insufficient funds. Please try a different payment method.';
            errorType = 'insufficient_funds';
          }
        }

        const paymentResult = {
          status: 'failed',
          errorMessage: errorMessage,
          errorType: errorType,
          amount: getTotalPrice(),
          currency: 'INR',
          timestamp: Date.now(),
          supportContact: 'support@exceltechnologies.com'
        };

        console.log('🚨 [CHECKOUT] Storing payment failure result:', paymentResult);
        sessionStorage.setItem('paymentResult', JSON.stringify(paymentResult));

        // Clear cart immediately before redirect
        clearCart();

        // Redirect immediately to success page
        console.log('🚨 [CHECKOUT] Redirecting to payment-success page');
        router.push('/payment-success');

        // Reset payment in progress flag after redirect
        setTimeout(() => setIsPaymentInProgress(false), 100);
      });

      rzp.open();
    } catch (error: any) {
      console.error('🚨 [CHECKOUT] Payment initialization error:', error);
      setIsProcessing(false);
      setIsPaymentInProgress(false);

      // Determine error message based on error type
      let errorMessage = 'Payment initialization failed. Please try again.';
      let errorType = 'initialization_error';

      if (error.message?.includes('Invalid payment amount')) {
        errorMessage = 'Payment amount error. Please refresh the page and try again.';
        errorType = 'amount_error';
      } else if (error.message?.includes('Amount too small')) {
        errorMessage = 'Payment amount is too small. Minimum amount is ₹1.';
        errorType = 'amount_too_small';
      } else if (error.message?.includes('Amount too large')) {
        errorMessage = 'Payment amount is too large. Maximum amount is ₹10,00,000.';
        errorType = 'amount_too_large';
      } else if (error.message?.includes('temporarily unavailable')) {
        errorMessage = 'Payment gateway is temporarily unavailable. Please try again in a few minutes.';
        errorType = 'gateway_unavailable';
      } else if (error.message?.includes('Gateway error')) {
        errorMessage = 'Payment gateway error. Please try again or use a different payment method.';
        errorType = 'gateway_error';
      } else if (error.message?.includes('Network error')) {
        errorMessage = 'Network error occurred. Please check your connection and try again.';
        errorType = 'network_error';
      }

      // Store payment result in session storage for cleaner URL
      const paymentResult = {
        status: 'failed',
        errorMessage: errorMessage,
        errorType: errorType,
        amount: getTotalPrice(),
        currency: 'INR',
        timestamp: Date.now(),
        supportContact: 'support@exceltechnologies.com'
      };

      console.log('🚨 [CHECKOUT] Storing initialization error result:', paymentResult);
      sessionStorage.setItem('paymentResult', JSON.stringify(paymentResult));

      // Clear cart immediately before redirect
      clearCart();

      // Redirect immediately to success page
      console.log('🚨 [CHECKOUT] Redirecting to payment-success page from initialization error');
      router.push('/payment-success');
    }
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 max-w-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Redirecting...</h2>
            <p className="text-gray-600 mb-6">Your cart is empty. Redirecting you to the dashboard.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4 pt-24">
            <button
              onClick={() => router.back()}
              disabled={isPaymentInProgress}
              className={`flex items-center mr-4 ${isPaymentInProgress
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Cart
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.domainName}</h3>
                      <p className="text-sm text-gray-600">
                        {item.registrationPeriod || 1} year(s) registration
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{(item.price * item.registrationPeriod).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ₹{item.price} per year
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="space-y-2">
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ₹{getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Payment Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment</h2>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="text-center mb-6">
                <CreditCard className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Secure Payment
                </h3>
                <p className="text-gray-600">
                  Powered by Razorpay - Your payment information is secure
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  <span>PCI DSS Compliant</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  <span>256-bit Encryption</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing || isPaymentInProgress || cartItems.length === 0}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
              >
                {isProcessing || isPaymentInProgress ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isPaymentInProgress ? 'Payment in Progress...' : 'Processing...'}
                  </>
                ) : (
                  `Pay ₹${getTotalPrice().toFixed(2)}`
                )}
              </button>

              {/* Payment Progress Indicator */}
              {isPaymentInProgress && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Payment in Progress</p>
                      <p className="text-xs text-yellow-700">
                        Please do not close this page or navigate away. Your payment is being processed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 text-center mt-4">
                By proceeding, you agree to our{' '}
                <a href="/terms-and-conditions" className="text-blue-600 hover:underline">terms and conditions</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
