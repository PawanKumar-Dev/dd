'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  User,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayoutNew';
import { formatIndianDate, formatIndianDateTime } from '@/lib/dateUtils';
import AdminDataTable from '@/components/admin/AdminDataTable';
import Invoice from '@/components/Invoice';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Order {
  _id: string;
  orderId: string;
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
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
  createdAt: string;
  updatedAt: string;
  invoiceNumber?: string;
  userId: User;
}

export default function AdminOrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
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

    try {
      const userObj = JSON.parse(userData);
      if (userObj.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      setUser(userObj);
      loadOrders();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [router]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
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

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleViewInvoice = (order: Order) => {
    setSelectedOrder(order);
    setIsInvoiceOpen(true);
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Invoice downloaded successfully!');
      } else {
        toast.error('Failed to download invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const orderColumns = [
    {
      key: 'orderId',
      label: 'Order ID',
      sortable: true,
      render: (value: string, row: Order) => (
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
      render: (value: User, row: Order) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">
              {value ? `${value.firstName} ${value.lastName}` : 'Unknown User'}
            </div>
            <div className="text-sm text-gray-500">
              {value?.email || 'No email available'}
            </div>
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
      key: 'domains',
      label: 'Domains',
      sortable: false,
      render: (value: any[], row: Order) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">{value.length}</div>
          <div className="text-sm text-gray-500">
            {row.successfulDomains.length} success
          </div>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{formatIndianDate(value)}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: Order) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewOrder(row)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleViewInvoice(row)}
            className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
            title="View Invoice"
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDownloadInvoice(row._id)}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Download Invoice PDF"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      )
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
              <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 mt-2">Manage and track all customer orders</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadOrders}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <AdminDataTable
            title="All Orders"
            columns={orderColumns}
            data={orders}
            searchable={true}
            pagination={true}
            pageSize={10}
          />
        </div>

        {/* Order Details Modal */}
        {isModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order ID</label>
                    <p className="text-lg font-mono">{selectedOrder.orderId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                    <p className="text-lg font-mono">{selectedOrder.invoiceNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedOrder.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : selectedOrder.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : selectedOrder.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-lg">
                        {selectedOrder.userId
                          ? `${selectedOrder.userId.firstName} ${selectedOrder.userId.lastName}`
                          : 'Unknown User'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-lg">{selectedOrder.userId?.email || 'No email available'}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Amount</label>
                      <p className="text-lg font-semibold">₹{selectedOrder.amount.toFixed(2)} {selectedOrder.currency}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment ID</label>
                      <p className="text-lg font-mono">{selectedOrder.paymentId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date</label>
                      <p className="text-lg">{formatIndianDateTime(selectedOrder.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Domains */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Domains in this Order</h3>
                  <div className="space-y-3">
                    {selectedOrder.domains.map((domain, index) => (
                      <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${domain.status === 'registered' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                          <span className="font-medium text-gray-900">{domain.domainName}</span>
                          <span className="text-sm text-gray-500">
                            {domain.registrationPeriod} year{domain.registrationPeriod !== 1 ? 's' : ''}
                          </span>
                          {domain.registrationPeriod > 1 && (
                            <span className="text-sm text-gray-500">×{domain.registrationPeriod} years</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">
                            ₹{(domain.price * domain.registrationPeriod).toFixed(2)}
                          </span>
                          {domain.status === 'failed' && domain.error && (
                            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                              {domain.error}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                {selectedOrder.successfulDomains.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800">Successfully Registered</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          {selectedOrder.successfulDomains.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {selectedOrder && (
          <Invoice
            order={selectedOrder}
            isOpen={isInvoiceOpen}
            onClose={() => {
              setIsInvoiceOpen(false);
              setSelectedOrder(null);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
