'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Search, Filter, MoreVertical, Eye, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayoutNew';
import AdminDataTable from '@/components/admin/AdminDataTable';
import { formatIndianDate, formatIndianTime, formatIndianDateTime, formatIndianCurrency } from '@/lib/dateUtils';

interface Payment {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  domainNames: string[];
  orderId?: string;
  invoiceNumber?: string;
  createdAt: string;
  processedAt?: string;
  refunded: boolean;
  refundAmount: number;
  refundStatus?: string;
  fee: number;
  tax: number;
  errorCode?: string;
  errorDescription?: string;
  notes: Record<string, any>;
}

export default function AdminPayments() {
  const [user, setUser] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const pageSize = 5; // Show 5 items per page

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
    loadPayments();
  }, [router]);

  const loadPayments = async (page: number = currentPage, search: string = searchTerm) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const skip = (page - 1) * pageSize;

      const response = await fetch(`/api/admin/payments?limit=${pageSize}&skip=${skip}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setTotalItems(data.total || 0);
        // Payments loaded successfully
      } else {
        console.error('Failed to load payments:', response.statusText);
        setPayments([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
      setPayments([]);
      setTotalItems(0);
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

  const handleViewPayment = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      setSelectedPayment(payment);
      setIsModalOpen(true);
    }
  };

  const handleProcessPayment = (paymentId: string) => {
    // Process the payment
  };

  const handleRefundPayment = (paymentId: string) => {
    // Process refund
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadPayments(page, searchTerm);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1); // Reset to first page when searching
    // Note: For now, we'll implement client-side search since the API doesn't support search
    // In a real implementation, you'd want to add search parameters to the API
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'refunded':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const columns = [
    {
      key: 'transactionId',
      label: 'Transaction ID',
      sortable: true,
      render: (value: string, row: Payment) => (
        <div className="flex items-center">
          {getStatusIcon(row.status)}
          <span className="ml-2 font-mono text-sm text-gray-900">{value}</span>
        </div>
      )
    },
    {
      key: 'customerName',
      label: 'Customer',
      sortable: true,
      render: (value: string, row: Payment) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.customerEmail}</div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: number, row: Payment) => (
        <div className="text-sm font-medium text-gray-900">
          {formatIndianCurrency(value)}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'failed' ? 'bg-red-100 text-red-800' :
            value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
          }`}>
          {value}
        </span>
      )
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      sortable: true
    },
    {
      key: 'domainNames',
      label: 'Domains',
      sortable: false,
      render: (value: string[], row: Payment) => (
        <div className="space-y-1">
          {value && value.length > 0 ? (
            value.map((domain, index) => (
              <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                {domain}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No domains</span>
          )}
          {row.orderId && (
            <div className="text-xs text-gray-500 mt-1">
              Order: {row.orderId}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (value: string) => (
        <div>
          <div className="text-sm text-gray-900">{formatIndianDate(value)}</div>
          <div className="text-xs text-gray-500">{formatIndianTime(value)}</div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Payment) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewPayment(row.id)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <AdminLayout user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-600">Domain purchase payments from Razorpay - {totalItems} transactions</p>
          </div>
          <button
            onClick={() => loadPayments(currentPage, searchTerm)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Refresh Payments
          </button>
        </div>


        {/* Payments Table */}
        <AdminDataTable
          title="All Payments"
          columns={columns}
          data={payments}
          searchable={true}
          pagination={true}
          pageSize={pageSize}
          totalItems={totalItems}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          isLoading={isLoading}
        />

        {/* Payment Details Modal */}
        {isModalOpen && selectedPayment && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Payment Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                    <p className="text-lg font-mono">{selectedPayment.transactionId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedPayment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : selectedPayment.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : selectedPayment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                      {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Amount</label>
                    <p className="text-lg font-semibold">₹{selectedPayment.amount.toFixed(2)} {selectedPayment.currency}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-lg">{selectedPayment.customerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-lg">{selectedPayment.customerEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Method</label>
                      <p className="text-lg">{selectedPayment.paymentMethod}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created At</label>
                      <p className="text-lg">{formatIndianDateTime(selectedPayment.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Processed At</label>
                      <p className="text-lg">{selectedPayment.processedAt ? formatIndianDateTime(selectedPayment.processedAt) : 'Not processed'}</p>
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                {(selectedPayment.orderId || selectedPayment.invoiceNumber) && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedPayment.orderId && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Order ID</label>
                          <p className="text-lg font-mono">{selectedPayment.orderId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Domains */}
                {selectedPayment.domainNames && selectedPayment.domainNames.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Domains in this Payment</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPayment.domainNames.map((domain, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Refund Information */}
                {selectedPayment.refunded && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Refund Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Refund Amount</label>
                        <p className="text-lg font-semibold text-red-600">₹{selectedPayment.refundAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Refund Status</label>
                        <p className="text-lg">{selectedPayment.refundStatus || 'Processed'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Information */}
                {selectedPayment.errorCode && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Information</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-red-700">Error Code</label>
                          <p className="text-lg font-mono text-red-800">{selectedPayment.errorCode}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-red-700">Error Description</label>
                          <p className="text-lg text-red-800">{selectedPayment.errorDescription}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Fee</label>
                      <p className="text-lg">₹{selectedPayment.fee.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tax</label>
                      <p className="text-lg">₹{selectedPayment.tax.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Net Amount</label>
                      <p className="text-lg font-semibold">₹{(selectedPayment.amount - selectedPayment.fee - selectedPayment.tax).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedPayment.notes && Object.keys(selectedPayment.notes).length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Notes</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedPayment.notes, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
