'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Shield, ShoppingCart, Globe, Info, Check, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import ClientOnly from '@/components/ClientOnly';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

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
      // Small delay to prevent immediate redirect during page load
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [cartItems.length, isLoading, user, router, isPaymentInProgress, paymentCompleted]);

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
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

      <div className="flex-1 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-10 gap-12 min-h-[60vh]">
          {/* Order Summary */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
              </div>

              <div className="space-y-4 mb-6">
                {cartItems.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="bg-green-100 p-1.5 rounded-md mr-3">
                            <Globe className="h-4 w-4 text-green-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 text-lg">{item.domainName}</h3>
                        </div>
                        <div className="ml-8 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Registration Period:</span> {item.registrationPeriod || 1} year(s)
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Price per year:</span> ₹{item.price}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          ₹{(item.price * item.registrationPeriod).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Total for {item.registrationPeriod || 1} year(s)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Details */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
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

              {/* Price Breakdown */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Price Breakdown</h3>
                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{item.domainName} ({item.registrationPeriod || 1} year)</span>
                      <span className="font-medium">₹{(item.price * item.registrationPeriod).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ₹{getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">All prices include 18% GST</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-center mb-6">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Secure Payment</h2>
              </div>

              {/* Payment Amount */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-gray-900">₹{getTotalPrice().toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">Including 18% GST</p>
                </div>
              </div>


              {/* Payment Methods - Fixed height to prevent layout shift */}
              <div className="mb-6 min-h-[120px]">
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

              {/* Payment Button - Fixed height and width to prevent layout shift */}
              <div className="h-16 flex items-center">
                <button
                  onClick={handlePayment}
                  disabled={isProcessing || isPaymentInProgress || cartItems.length === 0}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-center min-w-0">
                    {isProcessing || isPaymentInProgress ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3 flex-shrink-0"></div>
                        <span className="truncate">
                          {isPaymentInProgress ? 'Payment in Progress...' : 'Processing...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          Pay ₹{getTotalPrice().toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Payment Progress Indicator - Always reserve space */}
              <div className="mt-4 h-[80px] flex items-center transition-all duration-300 ease-in-out">
                {isPaymentInProgress ? (
                  <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-3 flex-shrink-0"></div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-yellow-800">Payment in Progress</p>
                        <p className="text-xs text-yellow-700">
                          Please do not close this page or navigate away. Your payment is being processed.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full"></div>
                )}
              </div>


              {/* Support Info - Fixed height to prevent layout shift */}
              <div className="mt-6 p-3 bg-gray-50 rounded-lg h-[60px] flex items-center justify-center transition-all duration-300 ease-in-out">
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

      <Footer />
    </div>
  );
}
