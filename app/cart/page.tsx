'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, ArrowLeft, CreditCard, Globe, Shield } from 'lucide-react';
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

        setUser(userObj);

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
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">

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

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
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
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Cart Items</h2>
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.domainName} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{item.domainName}</h3>
                          <p className="text-sm text-gray-600">
                            {item.registrationPeriod} year(s) registration
                          </p>
                        </div>

                        <div className="flex items-center space-x-4">
                          {/* Registration Period Selector */}
                          <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600">Registration Period:</label>
                            <select
                              value={item.registrationPeriod}
                              onChange={(e) => handleRegistrationPeriodChange(item.domainName, parseInt(e.target.value))}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                            <p className="text-lg font-semibold text-gray-900">
                              ₹{(item.price * item.registrationPeriod).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                              ₹{item.price} per year
                            </p>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item.domainName)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-24">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                  <div className="space-y-3 mb-6">
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span className="text-primary-600">₹{getTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full btn btn-primary mb-4 flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>{user ? 'Proceed to Checkout' : 'Login to Checkout'}</span>
                  </button>

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

                  <button
                    onClick={clearCart}
                    className="w-full btn btn-outline text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    Clear Cart
                  </button>
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
