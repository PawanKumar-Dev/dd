'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Calendar,
  MoreVertical,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayoutNew';
import AdminDataTable from '@/components/admin/AdminDataTable';
import FailedDomainNotifications from '@/components/admin/FailedDomainNotifications';
import { formatIndianDate } from '@/lib/dateUtils';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}


interface Order {
  _id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  domains: {
    domainName: string;
    price: number;
    currency: string;
    registrationPeriod: number;
    quantity: number;
    status: 'registered' | 'failed';
    error?: string;
    orderId?: string;
    expiresAt?: Date;
  }[];
  successfulDomains: string[];
  failedDomains: string[];
  createdAt: string;
  updatedAt: string;
  invoiceNumber?: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for admin authentication
    const getCookieValue = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const token = getCookieValue('token') || localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const userObj = JSON.parse(userData);
    if (userObj.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setUser(userObj);
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch real users from API
      const usersResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
        setRecentUsers(usersData.users?.slice(0, 5) || []); // Get recent 5 users
      } else {
        console.error('Failed to fetch users');
        setUsers([]);
        setRecentUsers([]);
      }

      // Load recent orders
      const ordersResponse = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData.orders || []);
        setRecentOrders(ordersData.orders?.slice(0, 5) || []); // Show only recent 5 orders
      } else {
        console.error('Failed to fetch orders');
        setOrders([]);
        setRecentOrders([]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setUsers([]);
      setRecentUsers([]);
      setOrders([]);
      setRecentOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedEmail');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };

  const quickActions = [];

  const userColumns = [
    { key: 'name', label: 'Name', sortable: true, render: (value: any, row: User) => `${row.firstName} ${row.lastName}` },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role', label: 'Role', sortable: true, render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${value === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
          }`}>
          {value}
        </span>
      )
    },
    {
      key: 'isActive', label: 'Status', sortable: true, render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    { key: 'createdAt', label: 'Joined', sortable: true, render: (value: string) => formatIndianDate(value) }
  ];


  const orderColumns = [
    {
      key: 'orderId',
      label: 'Order ID',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Receipt className="h-4 w-4 text-gray-400" />
          <span className="font-mono text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'userId',
      label: 'Customer',
      sortable: true,
      render: (value: any) => (
        <div>
          <div className="font-medium text-gray-900">
            {value ? `${value.firstName} ${value.lastName}` : 'Unknown User'}
          </div>
          <div className="text-sm text-gray-500">
            {value?.email || 'No email available'}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: number, row: Order) => (
        <div className="text-right">
          <div className="font-semibold text-gray-900">₹{value.toFixed(2)}</div>
          <div className="text-sm text-gray-500">{row.currency}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value === 'completed'
          ? 'bg-green-100 text-green-800'
          : value === 'failed'
            ? 'bg-red-100 text-red-800'
            : value === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
          {value === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
          {value === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
          {value === 'pending' && <Clock className="h-3 w-3 mr-1" />}
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (value: string) => formatIndianDate(value)
    }
  ];

  // Don't render anything until user is loaded
  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
              <p className="text-gray-600 mt-2">Welcome back, {user?.firstName}. Here's what's happening with your system.</p>
            </div>
          </div>
        </div>

        {/* Failed Domain Registration Notifications */}
        <FailedDomainNotifications />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(order => order.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">TLD Pricing</p>
                <p className="text-2xl font-bold text-gray-900">Live</p>
                <p className="text-xs text-gray-500">From ResellerClub</p>
              </div>
            </div>
          </div>
        </div>



        {/* Recent Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <AdminDataTable
            title="Recent Users"
            columns={userColumns}
            data={recentUsers}
            searchable={true}
            pagination={true}
            pageSize={5}
          />
          <AdminDataTable
            title="Recent Orders"
            columns={orderColumns}
            data={recentOrders}
            searchable={true}
            pagination={true}
            pageSize={5}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
