'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Globe, ShoppingCart, TrendingUp, Clock, CheckCircle,
  AlertTriangle, Calendar, ArrowRight, Plus, RefreshCw, Server, Receipt
} from 'lucide-react';
import RupeeIcon from '@/components/icons/RupeeIcon';
import { useCartStore } from '@/store/cartStore';
import UserLayout from '@/components/user/UserLayout';
import { PageLoading, DataLoading } from '@/components/user/LoadingComponents';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface DashboardStats {
  totalDomains: number;
  activeDomains: number;
  totalOrders: number;
  recentOrders: any[];
  recentDomains: any[];
  upcomingRenewals: any[];
}


export default function UserDashboard() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const { items: cartItems } = useCartStore();

  // Track if initialization has run to prevent double execution
  const hasInitialized = useRef(false);

  // Clear any stale logout flags on mount (only once)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('isLoggingOut');
    }
  }, []);

  // Define logout function inline to ensure it's always available
  // Memoized with empty deps to ensure stable reference across re-renders
  const handleLogout = useCallback(async () => {
    // Prevent multiple logout attempts
    if (typeof window !== 'undefined') {
      const alreadyLoggingOut = sessionStorage.getItem('isLoggingOut');
      if (alreadyLoggingOut === 'true') {
        return;
      }
    }

    try {
      sessionStorage.setItem('isLoggingOut', 'true');

      try {
        await signOut({ redirect: false });
      } catch (err) {
        // Silent error handling
      }

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');
      sessionStorage.clear();

      const cookiesToClear = [
        'token',
        'next-auth.session-token',
        'next-auth.callback-url',
        'next-auth.csrf-token',
        '__Secure-next-auth.session-token',
        '__Host-next-auth.csrf-token'
      ];

      cookiesToClear.forEach(name => {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}`;
      });

      toast.success('Logged out successfully');

      // Use replace() for hard redirect (prevents back button issues)
      window.location.replace('/login');
    } catch (error) {
      // Clear the flag even on error
      sessionStorage.removeItem('isLoggingOut');
      // Force redirect even on error
      window.location.replace('/login');
    }
  }, []);

  // Track handleLogout creation and stability
  const handleLogoutRef = useRef(handleLogout);
  useEffect(() => {
    if (handleLogoutRef.current !== handleLogout) {
      handleLogoutRef.current = handleLogout;
    }
  }, [handleLogout]);

  // Single initialization effect that runs once
  useEffect(() => {
    // Prevent double execution
    if (hasInitialized.current) {
      return;
    }

    // Wait for session to be fully loaded
    if (status === 'loading') {
      return;
    }

    hasInitialized.current = true;

    // Check for NextAuth session first
    if (session?.user) {
      const userObj = {
        id: (session.user as any).id,
        email: session.user.email || "",
        firstName: session.user.name?.split(" ")[0] || "",
        lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
        role: (session.user as any).role || "user",
      };

      setUser(userObj);
      setIsAuthLoading(false);
      loadDashboardData(userObj);
      return;
    }

    // Fallback to localStorage (for credential login users)
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      setIsAuthLoading(false);
      routerRef.current.push('/login');
      return;
    }

    const userObj = JSON.parse(userData);

    // Redirect admin users to admin dashboard
    if (userObj.role === 'admin') {
      routerRef.current.push('/admin/dashboard');
      return;
    }

    setUser(userObj);
    setIsAuthLoading(false);
    loadDashboardData(userObj);
  }, [session, status]);

  const loadDashboardData = async (userObj?: User) => {
    try {
      setIsLoading(true);

      // For social login users, wait for token to be created by AuthSync
      let token = localStorage.getItem('token');
      if (!token && session) {
        // Wait up to 3 seconds for AuthSync to create token
        for (let i = 0; i < 30; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          token = localStorage.getItem('token');
          if (token) break;
        }
      }

      if (!token) {
        setIsLoading(false);
        return;
      }

      // Fetch actual dashboard data
      try {
        const response = await fetch('/api/user/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        } else {
          // Fallback to basic stats if API fails
          setStats({
            totalDomains: 0,
            activeDomains: 0,
            totalOrders: 0,
            recentOrders: [],
            recentDomains: [],
            upcomingRenewals: []
          });
        }
      } catch (error) {
        // Fallback to basic stats
        setStats({
          totalDomains: 0,
          activeDomains: 0,
          totalOrders: 0,
          totalSpent: 0,
          recentOrders: [],
          recentDomains: [],
          upcomingRenewals: []
        } as any);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to login if no user after auth completes, but keep UserLayout mounted
  useEffect(() => {
    if (!isAuthLoading && !user) {
      routerRef.current.push('/login');
    }
  }, [isAuthLoading, user]);

  return (
    <UserLayout
      user={user}
      onLogout={handleLogout}
      isLoading={isLoading || isAuthLoading}
    >
      <div className="p-6">
        {/* Show loading state if auth is still loading */}
        {isAuthLoading ? (
          <PageLoading page="dashboard" />
        ) : (
          <>
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.firstName || 'User'}!
              </h1>
              <p className="text-gray-600">
                Here's an overview of your domain management dashboard.
              </p>
            </div>


            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Recent Domains */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Domains</h3>
                  <button
                    onClick={() => routerRef.current.push('/dashboard/domains')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
                <div className="space-y-3">
                  {stats?.recentDomains && stats.recentDomains.length > 0 ? (
                    stats.recentDomains.map((domain, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">{domain.name}</p>
                          <p className="text-sm text-gray-500">
                            {domain.status === 'pending' ? 'Pending' : 'Registered'} {domain.registeredDate}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${domain.status === 'registered' || domain.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : domain.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : domain.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                            {domain.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {domain.status === 'pending' ? 'Processing' : `Expires ${domain.expiryDate}`}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Recent Domains</h4>
                      <p className="text-gray-500 text-sm">
                        You haven't registered any domains yet
                      </p>
                      <button
                        onClick={() => routerRef.current.push('/')}
                        className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Search Domains
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Recent Orders */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                  <button
                    onClick={() => routerRef.current.push('/dashboard/orders')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
                <div className="space-y-3">
                  {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                    stats.recentOrders.map((order, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">Order #{order.orderId}</p>
                          <p className="text-sm text-gray-500">{order.domains} domain{order.domains !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">₹{order.amount}</p>
                          <p className="text-xs text-gray-500">{order.date}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Recent Orders</h4>
                      <p className="text-gray-500 text-sm">
                        You haven't placed any orders yet
                      </p>
                      <button
                        onClick={() => routerRef.current.push('/')}
                        className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Search Domains
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => routerRef.current.push('/')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-5 w-5 text-blue-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Search Domains</p>
                    <p className="text-sm text-gray-500">Find and register new domains</p>
                  </div>
                </button>

                <button
                  onClick={() => routerRef.current.push('/dashboard/dns-management')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Server className="h-5 w-5 text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">DNS Management</p>
                    <p className="text-sm text-gray-500">Manage your domain DNS records</p>
                  </div>
                </button>

                <button
                  onClick={() => routerRef.current.push('/dashboard/settings')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-5 w-5 text-purple-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Account Settings</p>
                    <p className="text-sm text-gray-500">Manage your profile</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}

      </div>
    </UserLayout>
  );
}