'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function FloatingCart() {
  const [isMounted, setIsMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { getItemCount } = useCartStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update cart count
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

  // Don't render on server or if no items
  if (!isMounted) {
    return null;
  }

  return (
    <Link
      href="/cart"
      className="md:hidden fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95"
      style={{
        boxShadow: '0 10px 40px rgba(37, 99, 235, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      }}
      title="View Cart"
    >
      <ShoppingCart className="h-6 w-6" />
      {cartCount > 0 && (
        <span
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white animate-pulse"
          style={{
            fontFamily: 'Google Sans, system-ui, sans-serif',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
          }}
        >
          {cartCount > 9 ? '9+' : cartCount}
        </span>
      )}
    </Link>
  );
}

