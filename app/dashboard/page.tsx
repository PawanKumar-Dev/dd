'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Globe, ShoppingCart, Receipt, TrendingUp, Clock, CheckCircle,
  AlertTriangle, Calendar, ArrowRight, Plus, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import UserLayout from '@/components/user/UserLayout';
import { PageLoading, DataLoading } from '@/components/user/LoadingComponents';
import ClientOnly from '@/components/ClientOnly';

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
  upcomingRenewals: any[];
}

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { items: cartItems, getItemCount } = useCartStore();

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
    loadDashboardData(userObj);
  }, [router]);

  const loadDashboardData = async (userObj?: User) => {
    try {
      setIsLoading(true);

      // Simulate API calls for dashboard data
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch actual dashboard data
      try {
        const token = localStorage.getItem('token');
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
            upcomingRenewals: []
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Fallback to basic stats
        setStats({
          totalDomains: 0,
          activeDomains: 0,
          totalOrders: 0,
          totalSpent: 0,
          recentOrders: [],
          upcomingRenewals: []
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
    toast.success('Logged out successfully');
  };

  if (!user) {
    return <PageLoading page="dashboard" />;
  }

  if (isLoading) {
    return (
      <UserLayout user={user} onLogout={handleLogout}>
        <div className="p-6">
          <DataLoading type="card" count={3} />
        </div>
      </UserLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Domains',
      value: stats?.totalDomains || 0,
      icon: Globe,
      color: 'blue',
      change: '+2 this month'
    },
    {
      title: 'Active Domains',
      value: stats?.activeDomains || 0,
      icon: CheckCircle,
      color: 'green',
      change: 'All healthy'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: Receipt,
      color: 'purple',
      change: '+3 this month'
    }
  ];

  return (
    <ClientOnly>
      <UserLayout user={user} onLogout={handleLogout}>
        <div className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-gray-600">
              Here's an overview of your domain management dashboard.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              const colorClasses = {
                blue: 'bg-blue-50 text-blue-600',
                green: 'bg-green-50 text-green-600',
                purple: 'bg-purple-50 text-purple-600',
                orange: 'bg-orange-50 text-orange-600'
              };

              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {card.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {card.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {card.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <button
                  onClick={() => router.push('/dashboard/orders')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              <div className="space-y-3">
                {stats?.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{order.domain}</p>
                      <p className="text-sm text-gray-500">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{order.amount}</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Upcoming Renewals */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Renewals</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                  Manage
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              <div className="space-y-3">
                {stats?.upcomingRenewals.map((renewal, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{renewal.domain}</p>
                      <p className="text-sm text-gray-500">Expires: {renewal.expiryDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">{renewal.daysLeft} days left</p>
                      <button className="text-xs text-blue-600 hover:text-blue-700">
                        Renew
                      </button>
                    </div>
                  </div>
                ))}
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
                onClick={() => router.push('/')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-5 w-5 text-blue-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Search Domains</p>
                  <p className="text-sm text-gray-500">Find and register new domains</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/cart')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-green-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">View Cart</p>
                  <p className="text-sm text-gray-500">{getItemCount()} items</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/settings')}
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
        </div>
      </UserLayout>
    </ClientOnly>
  );
}