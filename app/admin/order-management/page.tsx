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
  MoreVertical,
  Trash2,
  AlertTriangle,
  Archive,
  RotateCcw
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
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [orderToUnarchive, setOrderToUnarchive] = useState<Order | null>(null);
  const [isUnarchiveModalOpen, setIsUnarchiveModalOpen] = useState(false);
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

      // Load active orders
      const activeResponse = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Load archived orders
      const archivedResponse = await fetch('/api/admin/orders?archived=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        setOrders(activeData.orders || []);
      }

      if (archivedResponse.ok) {
        const archivedData = await archivedResponse.json();
        setArchivedOrders(archivedData.orders || []);
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

  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/orders/${orderToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Order ${data.deletedOrderId} archived successfully!`);

        // Remove the order from the local state
        setOrders(orders.filter(order => order._id !== orderToDelete._id));

        // Close the modal
        setIsDeleteModalOpen(false);
        setOrderToDelete(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to archive order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to archive order');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteOrder = () => {
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  const handleUnarchiveOrder = (order: Order) => {
    setOrderToUnarchive(order);
    setIsUnarchiveModalOpen(true);
  };

  const confirmUnarchiveOrder = async () => {
    if (!orderToUnarchive) return;

    try {
      setIsUnarchiving(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/orders/${orderToUnarchive._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Order ${data.orderId} un-archived successfully!`);

        // Remove the order from archived orders and add to active orders
        setArchivedOrders(archivedOrders.filter(order => order._id !== orderToUnarchive._id));
        setOrders([orderToUnarchive, ...orders]);

        // Close the modal
        setIsUnarchiveModalOpen(false);
        setOrderToUnarchive(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to un-archive order');
      }
    } catch (error) {
      console.error('Error un-archiving order:', error);
      toast.error('Failed to un-archive order');
    } finally {
      setIsUnarchiving(false);
    }
  };

  const cancelUnarchiveOrder = () => {
    setIsUnarchiveModalOpen(false);
    setOrderToUnarchive(null);
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
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleViewOrder(row)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
            title="View order details, domains, and payment information"
          >
            <Eye className="h-5 w-5" />
            <span className="sr-only">View Order Details</span>
          </button>
          <button
            onClick={() => handleViewInvoice(row)}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 group"
            title="View invoice details and billing information"
          >
            <FileText className="h-5 w-5" />
            <span className="sr-only">View Invoice</span>
          </button>
          <button
            onClick={() => handleDownloadInvoice(row._id)}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 group"
            title="Download invoice as PDF file"
          >
            <Download className="h-5 w-5" />
            <span className="sr-only">Download Invoice PDF</span>
          </button>
          <button
            onClick={() => handleDeleteOrder(row)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
            title="Archive order (hides from list but preserves all data)"
          >
            <Trash2 className="h-5 w-5" />
            <span className="sr-only">Archive Order</span>
          </button>
        </div>
      )
    }
  ];

  const archivedOrderColumns = [
    {
      key: 'orderId',
      label: 'Order ID',
      sortable: true,
      render: (value: string, row: Order) => (
        <div className="flex items-center space-x-2">
          <Archive className="h-4 w-4 text-gray-400" />
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
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleViewOrder(row)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
            title="View order details, domains, and payment information"
          >
            <Eye className="h-5 w-5" />
            <span className="sr-only">View Order Details</span>
          </button>
          <button
            onClick={() => handleViewInvoice(row)}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 group"
            title="View invoice details and billing information"
          >
            <FileText className="h-5 w-5" />
            <span className="sr-only">View Invoice</span>
          </button>
          <button
            onClick={() => handleDownloadInvoice(row._id)}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 group"
            title="Download invoice as PDF file"
          >
            <Download className="h-5 w-5" />
            <span className="sr-only">Download Invoice PDF</span>
          </button>
          <button
            onClick={() => handleUnarchiveOrder(row)}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 group"
            title="Un-archive order (restore to active orders)"
          >
            <RotateCcw className="h-5 w-5" />
            <span className="sr-only">Un-archive Order</span>
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

        {/* Orders Tabs */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'active'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Receipt className="h-5 w-5 mr-2" />
                Active Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'archived'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Archive className="h-5 w-5 mr-2" />
                Archived Orders ({archivedOrders.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'active' ? (
              <AdminDataTable
                title=""
                columns={orderColumns}
                data={orders}
                searchable={true}
                pagination={true}
                pageSize={10}
              />
            ) : (
              <AdminDataTable
                title=""
                columns={archivedOrderColumns}
                data={archivedOrders}
                searchable={true}
                pagination={true}
                pageSize={10}
              />
            )}
          </div>
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

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && orderToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Archive Order
                    </h3>
                    <p className="text-sm text-gray-500">
                      This will hide the order from the list but preserve all data
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 mb-2">
                    Are you sure you want to delete this order?
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        Order ID: {orderToDelete.orderId}
                      </div>
                      <div className="text-gray-600">
                        Customer: {orderToDelete.userId ? `${orderToDelete.userId.firstName} ${orderToDelete.userId.lastName}` : 'Unknown'}
                      </div>
                      <div className="text-gray-600">
                        Amount: ₹{orderToDelete.amount.toFixed(2)} {orderToDelete.currency}
                      </div>
                      <div className="text-gray-600">
                        Status: {orderToDelete.status}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDeleteOrder}
                    disabled={isDeleting}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteOrder}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Archive Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Un-archive Confirmation Modal */}
        {isUnarchiveModalOpen && orderToUnarchive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <RotateCcw className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      Un-archive Order
                    </h3>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 mb-2">
                    Are you sure you want to un-archive this order? It will be restored to the active orders list.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        Order ID: {orderToUnarchive.orderId}
                      </div>
                      <div className="text-gray-600">
                        Customer: {orderToUnarchive.userId ? `${orderToUnarchive.userId.firstName} ${orderToUnarchive.userId.lastName}` : 'Unknown'}
                      </div>
                      <div className="text-gray-600">
                        Amount: ₹{orderToUnarchive.amount.toFixed(2)} {orderToUnarchive.currency}
                      </div>
                      <div className="text-gray-600">
                        Status: {orderToUnarchive.status}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelUnarchiveOrder}
                    disabled={isUnarchiving}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmUnarchiveOrder}
                    disabled={isUnarchiving}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isUnarchiving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Un-archiving...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Un-archive Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
