'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogout } from '@/lib/logout';
import { ArrowLeft, CreditCard, Shield, ShoppingCart, Globe, Info, Check, Smartphone, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import ClientOnly from '@/components/ClientOnly';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';

// Helper function to get minimum registration period for TLD
const getMinRegistrationPeriod = (domainName: string): number => {
  const tld = domainName.split('.').pop()?.toLowerCase();

  // TLD-specific minimum registration periods
  const minPeriods: { [key: string]: number } = {
    'ai': 2,    // .ai domains require minimum 2 years
    'co': 2,    // .co domains require minimum 2 years
    'io': 1,    // .io domains allow 1 year
    'com': 1,   // .com domains allow 1 year
    'net': 1,   // .net domains allow 1 year
    'org': 1,   // .org domains allow 1 year
    // Add more TLDs as needed
  };

  return minPeriods[tld || ''] || 1; // Default to 1 year if TLD not specified
};

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
  const handleLogout = useLogout();
  const [isPaymentInProgress, setIsPaymentInProgress] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
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

    // Refresh user data from server to get latest profileCompleted status
    const refreshUserData = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const updatedUser = {
            ...userObj,
            ...data.user
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));

          // Redirect admin users to admin dashboard
          if (updatedUser.role === 'admin') {
            router.push('/admin/dashboard');
            return;
          }

          // Check if user has completed profile (required for checkout)
          if (!updatedUser.profileCompleted) {
            router.push(`/dashboard/settings?returnUrl=${encodeURIComponent('/checkout')}`);
            return;
          }

          setUser(updatedUser);
          syncWithServer();
        } else {
          // Fallback to original logic if refresh fails
          if (userObj.role === 'admin') {
            router.push('/admin/dashboard');
            return;
          }

          if (!userObj.profileCompleted) {
            router.push(`/dashboard/settings?returnUrl=${encodeURIComponent('/checkout')}`);
            return;
          }

          setUser(userObj);
          syncWithServer();
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
        // Fallback to original logic
        if (userObj.role === 'admin') {
          router.push('/admin/dashboard');
          return;
        }

        if (!userObj.profileCompleted) {
          router.push(`/dashboard/settings?returnUrl=${encodeURIComponent('/checkout')}`);
          return;
        }

        setUser(userObj);
        syncWithServer();
      }
    };

    refreshUserData();

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [router, syncWithServer]);

  // Navigation prevention removed - users can freely navigate during payment

  // Redirect to dashboard if cart is empty (after cart has been loaded)
  // But not if payment is in progress or just completed
  useEffect(() => {
    if (!isLoading && cartItems.length === 0 && user && !isPaymentInProgress && !paymentCompleted) {
      // Immediate redirect without showing intermediate state
      router.replace('/dashboard');
    }
  }, [cartItems.length, isLoading, user, router, isPaymentInProgress, paymentCompleted]);

  const handlePayment = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Validate registration periods for all domains
    const invalidDomains = cartItems.filter(item => {
      const minPeriod = getMinRegistrationPeriod(item.domainName);
      return item.registrationPeriod < minPeriod;
    });

    if (invalidDomains.length > 0) {
      const domainNames = invalidDomains.map(d => d.domainName).join(', ');
      toast.error(`Invalid registration period for ${domainNames}. Please check the minimum requirements.`);
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
          try {
            // Verify payment
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

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
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

              sessionStorage.setItem('paymentResult', JSON.stringify(paymentResult));

              // Mark payment as completed to prevent dashboard redirect
              setPaymentCompleted(true);

              // Clear cart immediately before redirect
              clearCart();

              // Reset payment in progress flag immediately
              setIsPaymentInProgress(false);

              // Redirect immediately to success page
              router.push('/payment-success');
            } else {
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
                setPaymentCompleted(true);
                setIsPaymentInProgress(false);
                router.push('/payment-success');
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

              sessionStorage.setItem('paymentResult', JSON.stringify(paymentResult));

              // Clear cart immediately before redirect
              clearCart();

              // Mark payment as completed to prevent dashboard redirect
              setPaymentCompleted(true);

              // Reset payment in progress flag immediately
              setIsPaymentInProgress(false);

              // Redirect immediately to success page
              router.push('/payment-success');
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

            sessionStorage.setItem('paymentResult', JSON.stringify(paymentResult));

            // Clear cart immediately before redirect
            clearCart();

            // Mark payment as completed to prevent dashboard redirect
            setPaymentCompleted(true);

            // Reset payment in progress flag immediately
            setIsPaymentInProgress(false);

            // Redirect immediately to success page
            router.push('/payment-success');
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

            // Payment was cancelled by user - preserve cart for better UX
            console.log('🔄 [CHECKOUT] Payment cancelled by user - preserving cart');

            // Save cart to server to ensure it's preserved
            const saveCartToServer = async () => {
              try {
                await syncWithServer();
                console.log('✅ [CHECKOUT] Cart saved to server after payment cancellation');
              } catch (error) {
                console.error('❌ [CHECKOUT] Failed to save cart after cancellation:', error);
              }
            };

            saveCartToServer();

            // Show user-friendly cancellation message
            toast.error('Payment was cancelled. Your cart has been saved and you can try again anytime.');

            // Don't redirect to payment success page - stay on checkout
            // User can retry payment or continue shopping
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        setIsProcessing(false);
        setIsPaymentInProgress(false);

        // Determine error type and message based on Razorpay error
        let errorMessage = response.error.description || 'Payment failed';
        let errorType = 'payment_failed';

        if (response.error) {
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

        // Save cart to server to preserve it for retry
        const saveCartToServer = async () => {
          try {
            await syncWithServer();
            console.log('✅ [CHECKOUT] Cart saved to server after payment failure');
          } catch (error) {
            console.error('❌ [CHECKOUT] Failed to save cart after payment failure:', error);
          }
        };

        saveCartToServer();

        // Show user-friendly error message
        toast.error(`${errorMessage} Your cart has been saved and you can try again.`);

        // Don't redirect - stay on checkout page for retry
        // User can retry payment or continue shopping
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

      // Save cart to server to preserve it for retry
      const saveCartToServer = async () => {
        try {
          await syncWithServer();
          console.log('✅ [CHECKOUT] Cart saved to server after payment initialization error');
        } catch (error) {
          console.error('❌ [CHECKOUT] Failed to save cart after initialization error:', error);
        }
      };

      saveCartToServer();

      // Show user-friendly error message
      toast.error(`${errorMessage} Your cart has been saved and you can try again.`);

      // Don't redirect - stay on checkout page for retry
      // User can retry payment or continue shopping
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

  // If cart is empty, show loading while redirect happens
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation user={user} onLogout={user ? handleLogout : undefined} />

      {/* Profile Completion Warning */}
      <ProfileCompletionWarning />

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

      <div className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8">
        <div className="grid lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-8 min-h-[50vh]">
          {/* Order Summary */}
          <div className="lg:col-span-4 xl:col-span-5 2xl:col-span-5">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Ready for payment</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div key={index} className="group relative p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Globe className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{item.domainName}</h3>
                              <p className="text-sm text-gray-600">
                                {item.registrationPeriod || 1} year(s) registration
                                {getMinRegistrationPeriod(item.domainName) > 1 && (
                                  <span className="ml-2 text-xs text-amber-600">
                                    (Min: {getMinRegistrationPeriod(item.domainName)} year{getMinRegistrationPeriod(item.domainName) > 1 ? 's' : ''})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Domain Features */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Available
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <Zap className="h-3 w-3 mr-1" />
                              Instant Setup
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            ₹{(item.price * (item.registrationPeriod || 1)).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            ₹{item.price} per year
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What's Included */}
              <div className="px-6 pb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    What's Included
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center text-blue-800">
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Domain Registration
                    </div>
                    <div className="flex items-center text-blue-800">
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      DNS Management
                    </div>
                    <div className="flex items-center text-blue-800">
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Easy User Dashboard
                    </div>
                    <div className="flex items-center text-blue-800">
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      24/7 Support
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-24">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Secure Payment</h2>

                {/* Payment Amount */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                    <p className="text-3xl font-bold text-gray-900">₹{getTotalPrice().toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Including 18% GST</p>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Accepted Payment Methods</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <CreditCard className="h-3 w-3 mr-1" />
                      Credit Cards
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-3 w-3 mr-1" />
                      Debit Cards
                    </div>
                    <div className="flex items-center">
                      <Smartphone className="h-3 w-3 mr-1" />
                      UPI
                    </div>
                    <div className="flex items-center">
                      <Smartphone className="h-3 w-3 mr-1" />
                      Net Banking
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={isProcessing || isPaymentInProgress || cartItems.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 mb-4 flex items-center justify-center space-x-2"
                >
                  {isProcessing || isPaymentInProgress ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{isPaymentInProgress ? 'Payment in Progress...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      <span>Pay ₹{getTotalPrice().toFixed(2)}</span>
                    </>
                  )}
                </button>

                {/* Payment Progress Indicator */}
                {isPaymentInProgress && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-3 flex-shrink-0"></div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-yellow-800">Payment in Progress</p>
                        <p className="text-xs text-yellow-700">
                          Please do not close this page or navigate away.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Support Info */}
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-600 text-center">
                    Need help? Contact our support team at{' '}
                    <a href="mailto:support@exceltechnologies.com" className="text-blue-600 hover:underline">
                      support@exceltechnologies.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
