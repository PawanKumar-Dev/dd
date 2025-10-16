'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, ArrowLeft, CreditCard, Globe, Shield, Star, CheckCircle, Clock, Users, Award, Zap, TrendingUp } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ClientOnly from '@/components/ClientOnly';
import Link from 'next/link';

interface User {
  firstName: string;
  lastName: string;
  role: string;
}

export default function CartPage() {
  const { items: cartItems, removeItem, updateItem, getTotalPrice, getSubtotalPrice, getItemCount, clearCart, syncWithServer, mergeWithServerCart, isLoading } = useCartStore();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

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

        // Redirect admin users to admin dashboard
        if (userObj.role === 'admin') {
          router.push('/admin/dashboard');
          return;
        }

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
              setUser(updatedUser);
            } else {
              setUser(userObj);
            }
          } catch (error) {
            console.error('Error refreshing user data:', error);
            setUser(userObj);
          }
        };

        refreshUserData();

        // Merge local cart with server cart for logged-in users
        mergeWithServerCart();
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    // Note: No redirect to login - allow guest access to cart
  }, [router, mergeWithServerCart]);

  const handleRegistrationPeriodChange = (domainName: string, newPeriod: number) => {
    if (newPeriod <= 0) {
      removeItem(domainName);
    } else {
      updateItem(domainName, { registrationPeriod: newPeriod });
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }

    // Check if user is logged in
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?returnUrl=${encodeURIComponent('/checkout')}`);
      return;
    }

    // Redirect to checkout page
    router.push('/checkout');
  };

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation user={user} />

      <div className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8 pt-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600">{getItemCount()} items in your cart</p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Secure Payment</p>
              <p className="text-xs text-gray-600">SSL Protected</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Instant Setup</p>
              <p className="text-xs text-gray-600">24/7 Support</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">10,000+ Customers</p>
              <p className="text-xs text-gray-600">Trusted Worldwide</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center space-x-3">
            <div className="bg-yellow-100 p-2 rounded-full">
              <Award className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Premium Service</p>
              <p className="text-xs text-gray-600">99.9% Uptime</p>
            </div>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16 min-h-[60vh] flex flex-col justify-center">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Your cart is empty</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              No domains in your cart yet. Start by searching for domains you'd like to purchase.
            </p>
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Globe className="h-5 w-5 mr-2" />
                Search Domains
              </Link>
              <p className="text-sm text-gray-500">
                Or visit the <Link href="/" className="text-green-600 hover:text-green-700 underline">homepage</Link> to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-8 min-h-[50vh]">
            {/* Cart Items */}
            <div className="lg:col-span-4 xl:col-span-5 2xl:col-span-5">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>All items verified</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.domainName} className="group relative p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Globe className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">{item.domainName}</h3>
                                <p className="text-sm text-gray-600">
                                  {item.registrationPeriod} year(s) registration
                                </p>
                              </div>
                            </div>

                            {/* Domain Features */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Available
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <Zap className="h-3 w-3 mr-1" />
                                Instant Setup
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            {/* Registration Period Selector */}
                            <div className="flex flex-col space-y-2">
                              <label className="text-sm font-medium text-gray-700">Registration Period:</label>
                              <select
                                value={item.registrationPeriod}
                                onChange={(e) => handleRegistrationPeriodChange(item.domainName, parseInt(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                              >
                                <option value={1}>1 Year</option>
                                <option value={2}>2 Years</option>
                                <option value={3}>3 Years</option>
                                <option value={4}>4 Years</option>
                                <option value={5}>5 Years</option>
                                <option value={10}>10 Years</option>
                              </select>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">
                                ₹{(item.price * item.registrationPeriod).toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-600">
                                ₹{item.price} per year
                              </p>
                              {item.registrationPeriod > 1 && (
                                <p className="text-xs text-green-600 font-medium">
                                  Save ₹{((item.price * item.registrationPeriod) - (item.price * item.registrationPeriod * 0.95)).toFixed(2)}
                                </p>
                              )}
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeItem(item.domainName)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Services */}
              <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Add-ons</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Globe className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Simple Dashboard</h4>
                          <p className="text-sm text-gray-600">Easy domain management interface</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Award className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Email Forwarding</h4>
                          <p className="text-sm text-gray-600">Forward emails to your existing inbox</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-24">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({getItemCount()} items)</span>
                      <span className="text-gray-900">₹{getSubtotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST (18%)</span>
                      <span className="text-gray-900">Included</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="text-green-600">-₹0.00</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary-600">₹{getTotalPrice().toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">All prices include 18% GST</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 mb-4 flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>{user ? 'Proceed to Checkout' : 'Login to Checkout'}</span>
                  </button>

                  {/* Cart Preservation Notice */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-green-800 font-medium">Your cart is automatically saved</p>
                        <p className="text-xs text-green-700 mt-1">
                          If you cancel payment or encounter any issues, your selected domains will be preserved and you can try again anytime.
                        </p>
                      </div>
                    </div>
                  </div>

                  {!user && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-blue-800">Login Required for Checkout</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            You need to be logged in to complete your purchase. Your cart will be saved.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {user && user.profileCompleted === false && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-red-800">Profile Completion Required</h3>
                          <p className="text-sm text-red-700 mt-1">
                            <strong>You must complete your profile before you can proceed to checkout.</strong>
                            This is required to process your domain registration and ensure we have all necessary information for your order.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={clearCart}
                    className="w-full border border-red-300 text-red-600 hover:text-red-700 hover:border-red-400 hover:bg-red-50 font-medium py-2 px-4 rounded-lg transition-all duration-200"
                  >
                    Clear Cart
                  </button>

                  {/* Security Badge */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Secure 256-bit SSL encryption</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
