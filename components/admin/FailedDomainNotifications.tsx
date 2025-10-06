'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle, Clock, User, Mail, CreditCard, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FailedDomain {
  domainName: string;
  error: string;
  failedAt: string;
}

interface FailedDomainData {
  orderId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  failedDomains: FailedDomain[];
  successfulDomains: string[];
  createdAt: string;
  updatedAt: string;
  paymentVerification?: {
    verifiedAt: string;
    paymentStatus: string;
    paymentAmount: number;
    paymentCurrency: string;
    razorpayOrderId: string;
  };
}

interface FailedDomainSummary {
  totalFailedOrders: number;
  totalFailedDomains: number;
  totalSuccessfulDomains: number;
  lastUpdated: string;
}

export default function FailedDomainNotifications() {
  const [failedDomains, setFailedDomains] = useState<FailedDomainData[]>([]);
  const [summary, setSummary] = useState<FailedDomainSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedOrders, setDismissedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFailedDomains();
  }, []);

  const fetchFailedDomains = async () => {
    try {
      const response = await fetch('/api/admin/failed-domains');
      const data = await response.json();

      if (data.success) {
        setFailedDomains(data.data);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch failed domains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissOrder = (orderId: string) => {
    setDismissedOrders(prev => new Set(Array.from(prev).concat(orderId)));
  };

  const handleDismissAll = () => {
    const allOrderIds = failedDomains.map(order => order.orderId);
    setDismissedOrders(new Set(allOrderIds));
  };

  const visibleOrders = failedDomains.filter(order => !dismissedOrders.has(order.orderId));

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!summary || summary.totalFailedOrders === 0) {
    return null; // Don't show anything if no failed domains
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-red-200 mb-6">
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                Domain Registration Failures
              </h3>
              <p className="text-sm text-red-600">
                {summary.totalFailedOrders} orders with {summary.totalFailedDomains} failed domains
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {visibleOrders.length} Active
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismissAll();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200"
          >
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {visibleOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="bg-red-50 border border-red-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">Order {order.orderId}</h4>
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                          {order.failedDomains.length} Failed
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{order.customerName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{order.customerEmail}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <span>{order.currency} {order.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismissOrder(order.orderId)}
                      className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Failed Domains */}
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-red-800 mb-2">Failed Domains:</h5>
                    <div className="space-y-1">
                      {order.failedDomains.map((domain, index) => (
                        <div key={index} className="flex items-center justify-between bg-white rounded p-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm">{domain.domainName}</span>
                            <span className="text-xs text-red-600">({domain.error})</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(domain.failedAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Successful Domains */}
                  {order.successfulDomains.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-green-800 mb-2">Successfully Registered:</h5>
                      <div className="flex flex-wrap gap-1">
                        {order.successfulDomains.map((domain, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-red-200">
                    <button
                      onClick={() => window.open(`/admin/order-management`, '_blank')}
                      className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Order
                    </button>
                    <button
                      onClick={() => {
                        // Copy order ID to clipboard
                        navigator.clipboard.writeText(order.orderId);
                        // You could add a toast notification here
                      }}
                      className="inline-flex items-center px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                    >
                      Copy Order ID
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
