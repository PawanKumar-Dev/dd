'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import Logo from './Logo';

interface NavigationProps {
  variant?: 'default' | 'dashboard' | 'admin';
  user?: {
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  onLogout?: () => void;
}

export default function Navigation({
  variant = 'default',
  user = null,
  onLogout
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ firstName: string; lastName: string; role: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { getItemCount } = useCartStore();
  const [cartCount, setCartCount] = useState(0);

  // Check if user is logged in and get user data
  useEffect(() => {
    setIsMounted(true);

    const getCookieValue = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const token = getCookieValue('token') || localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setIsLoggedIn(true);
      try {
        const userObj = JSON.parse(userData);
        setCurrentUser(userObj);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    } else {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  }, []);

  // Update cart count only on client side
  useEffect(() => {
    if (isMounted) {
      setCartCount(getItemCount());
    }
  }, [isMounted, getItemCount]);

  // Subscribe to cart changes
  useEffect(() => {
    if (isMounted) {
      const unsubscribe = useCartStore.subscribe((state) => {
        setCartCount(state.getItemCount());
      });
      return unsubscribe;
    }
  }, [isMounted]);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (variant === 'dashboard' || variant === 'admin') {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Logo size="md" href={variant === 'admin' ? '/admin' : '/dashboard'} />

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6">
                {isMounted && user && (
                  <>
                    <span className="text-sm text-gray-600">
                      Welcome, {user.firstName} {user.lastName}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}>
                      {user.role?.toUpperCase()}
                    </span>
                  </>
                )}
              </div>

              {/* Cart Icon - always visible */}
              <Link
                href="/cart"
                className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
                title="Shopping Cart"
              >
                <ShoppingCart className="h-6 w-6" />
                {isMounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </Link>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="btn btn-secondary hover:bg-gray-100 transition-colors duration-200"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Logo size="md" href="/" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`font-medium transition-colors duration-200 relative group ${isActive('/')
                ? 'text-primary-600'
                : 'text-gray-700 hover:text-primary-600'
                }`}
            >
              Home
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary-600 transition-all duration-200 ${isActive('/') ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
            </Link>
            <Link
              href="/about"
              className={`font-medium transition-colors duration-200 relative group ${isActive('/about')
                ? 'text-primary-600'
                : 'text-gray-700 hover:text-primary-600'
                }`}
            >
              About Us
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary-600 transition-all duration-200 ${isActive('/about') ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
            </Link>
            <Link
              href="/contact"
              className={`font-medium transition-colors duration-200 relative group ${isActive('/contact')
                ? 'text-primary-600'
                : 'text-gray-700 hover:text-primary-600'
                }`}
            >
              Contact Us
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary-600 transition-all duration-200 ${isActive('/contact') ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
              title="Shopping Cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {isMounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Link>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200 group"
                title="Go to Dashboard"
              >
                <User className="h-6 w-6" />
                <span className="hidden lg:block font-medium text-sm group-hover:text-primary-600 transition-colors duration-200">
                  {isMounted && currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="btn btn-primary hover:bg-primary-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Login
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen
          ? 'max-h-96 opacity-100 pb-4'
          : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
          <nav className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${isActive('/')
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              onClick={closeMobileMenu}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${isActive('/about')
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              onClick={closeMobileMenu}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${isActive('/contact')
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
            >
              Contact Us
            </Link>
            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
              <Link
                href="/cart"
                onClick={closeMobileMenu}
                className="flex items-center justify-center px-4 py-2 rounded-lg font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart {isMounted && cartCount > 0 && `(${cartCount})`}
              </Link>
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center px-4 py-2 rounded-lg font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200"
                >
                  <User className="h-5 w-5 mr-2" />
                  <div className="flex flex-col items-start">
                    <span>Dashboard</span>
                    <span className="text-xs text-gray-500">
                      {isMounted && currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}
                    </span>
                  </div>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="btn btn-primary text-center"
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
