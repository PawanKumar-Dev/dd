/**
 * Enhanced User Dashboard
 * 
 * This dashboard provides users with comprehensive domain management capabilities,
 * including domain overview, DNS management, renewal tracking, and account management.
 * 
 * Features:
 * - Real-time domain status and statistics
 * - Integrated DNS management with ResellerClub API
 * - Domain renewal tracking and management
 * - Order history and invoice management
 * - Account settings and profile management
 * 
 * @author Excel Technologies
 * @version 2.0.0
 * @since 2024
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatIndianDate } from '@/lib/dateUtils';
import {
  ShoppingCart, Globe, LogOut, User, Settings, Star, Award, Shield, Clock,
  Lock, Smartphone, Headphones, Mail, Phone, MapPin, TrendingUp, Database,
  Server, Wifi, CheckCircle, ArrowRight, Zap, Receipt, FileText, Calendar,
  CreditCard, Download, Eye, X, Plus, RefreshCw, AlertTriangle, Info,
  ExternalLink, Edit3, Trash2, Search, Filter, Download as DownloadIcon,
  Activity, BarChart3, PieChart, TrendingDown, AlertCircle, CheckCircle2,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { useTestingStore } from '@/store/testingStore';
import Navigation from '@/components/Navigation';
import ClientOnly from '@/components/ClientOnly';
import Invoice from '@/components/Invoice';
import DNSManagementModal from '@/components/DNSManagementModal';
import DomainRenewalModal from '@/components/DomainRenewalModal';
import NameServerManagement from '@/components/NameServerManagement';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface DomainSearchResult {
  domainName: string;
  available: boolean;
  price: number;
  currency: string;
  registrationPeriod: number;
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
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [domains, setDomains] = useState<DomainSearchResult[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('domains');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainSearchResult | null>(null);
  const [isDNSModalOpen, setIsDNSModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const router = useRouter();
  const { isTestingMode } = useTestingStore();
  const { items: cartItems, addItem, removeItem, getTotalPrice, getItemCount } = useCartStore();

  const loadOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);

        // Extract successfully registered domains from orders
        const registeredDomains: DomainSearchResult[] = [];
        data.orders?.forEach((order: Order) => {
          if (order.status === 'completed') {
            order.domains.forEach(domain => {
              if (domain.status === 'registered') {
                registeredDomains.push({
                  domainName: domain.domainName,
                  available: true,
                  price: domain.price,
                  currency: domain.currency,
                  registrationPeriod: domain.registrationPeriod,
                });
              }
            });
          }
        });
        setDomains(registeredDomains);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleViewInvoice = (order: Order) => {
    setSelectedOrder(order);
    setIsInvoiceOpen(true);
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/orders/${orderId}/invoice`, {
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

  const handleManageDNS = (domain: DomainSearchResult) => {
    setSelectedDomain(domain);
    setIsDNSModalOpen(true);
  };

  const handleRenewDomain = (domain: DomainSearchResult) => {
    setSelectedDomain(domain);
    setIsRenewalModalOpen(true);
  };

  useEffect(() => {
    // Check for token in both cookie and localStorage
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

    // Check if user account is activated
    if (!userObj.isActivated) {
      router.push('/activate?message=Account not activated');
      return;
    }

    // Redirect admin users to admin dashboard
    if (userObj.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    setUser(userObj);

    // Load user's domains (empty for now - will be populated from API later)
    // Domains will be populated from orders

    // Load user's orders
    loadOrders();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedEmail');
    // Clear the token cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };


  const handleAddToCart = (domain: DomainSearchResult) => {
    if (domain.available) {
      addItem({
        domainName: domain.domainName,
        price: domain.price,
        currency: domain.currency,
        registrationPeriod: domain.registrationPeriod,
      });
      toast.success(`${domain.domainName} added to cart`);

      // Redirect to cart page after adding to cart
      setTimeout(() => {
        router.push('/cart');
      }, 1000); // Small delay to show the success toast
    }
  };

  const handleRemoveFromCart = (domainName: string) => {
    removeItem(domainName);
    toast.success(`${domainName} removed from cart`);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    // Navigate to checkout page
    router.push('/checkout');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="dashboard" user={user} onLogout={handleLogout} />

      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back, {user?.firstName}. Manage your domains and orders.</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/"
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200 group"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-2 mr-3">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Search Domains</h3>
                <p className="text-gray-600 text-sm">Find and register new domains</p>
              </div>
            </div>
          </Link>

          <Link
            href="/domain-management"
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200 group"
          >
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-2 mr-3">
                <Server className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">DNS Management</h3>
                <p className="text-gray-600 text-sm">Manage your domain DNS settings</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('cart')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'cart'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <ShoppingCart className="h-4 w-4 inline mr-2" />
              Cart ({getItemCount()})
            </button>
            <button
              onClick={() => setActiveTab('domains')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'domains'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Globe className="h-4 w-4 inline mr-2" />
              My Domains ({domains.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Receipt className="h-4 w-4 inline mr-2" />
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('nameservers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'nameservers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Server className="h-4 w-4 inline mr-2" />
              Nameservers
            </button>
          </nav>
        </div>


        {/* Cart Tab */}
        {activeTab === 'cart' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <ShoppingCart className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Your cart is empty</h3>
                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                  No domains in your cart yet. Start by searching for domains you'd like to purchase.
                </p>
                <div className="space-y-4">
                  <Link
                    href="/"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                  >
                    <Globe className="h-5 w-5 mr-2" />
                    Search Domains
                  </Link>
                  <p className="text-sm text-gray-500">
                    Or visit the <Link href="/" className="text-blue-600 hover:text-blue-700 underline">homepage</Link> to get started
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Cart ({getItemCount()} items)
                  </h3>
                  <button
                    onClick={handleCheckout}
                    className="btn btn-primary"
                  >
                    Proceed to Checkout
                  </button>
                </div>

                {cartItems.map((item, index) => (
                  <div key={index} className="card">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {item.domainName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {item.registrationPeriod} year(s) registration
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ₹{(item.price * item.registrationPeriod).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            ₹{item.price} per year
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.domainName)}
                          className="btn btn-danger"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="card">
                  <div className="card-body">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-primary-600">
                        ₹{getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Domains Tab */}
        {activeTab === 'domains' && (
          <div>
            {domains.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Globe className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No domains yet</h3>
                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                  You haven't purchased any domains yet. Start by searching for your perfect domain name.
                </p>
                <div className="space-y-4">
                  <Link
                    href="/"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Globe className="h-5 w-5 mr-2" />
                    Search Domains
                  </Link>
                  <p className="text-sm text-gray-500">
                    Or visit the <Link href="/" className="text-blue-600 hover:text-blue-700 underline">homepage</Link> to get started
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Domains</h3>
                {domains.map((domain, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {domain.domainName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Registered • {domain.registrationPeriod} year(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ₹{domain.price}
                        </p>
                        <p className="text-sm text-gray-600">
                          per year
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleManageDNS(domain)}
                          className="btn btn-outline btn-sm hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                        >
                          Manage DNS
                        </button>
                        <button
                          onClick={() => handleRenewDomain(domain)}
                          className="btn btn-outline btn-sm hover:bg-green-50 hover:border-green-300 transition-colors duration-200"
                        >
                          Renew
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {isLoadingOrders ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Receipt className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No orders yet</h3>
                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                  You haven't placed any orders yet. Start by adding domains to your cart and completing a purchase.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Globe className="h-5 w-5 mr-2" />
                  Search Domains
                </Link>
                <p className="text-sm text-gray-500 mt-4">
                  Or <Link href="/" className="text-green-600 hover:text-green-700 font-medium">visit homepage</Link> to get started
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Receipt className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-500">Order #{order.orderId}</span>
                          </div>
                          {order.invoiceNumber && (
                            <div className="flex items-center space-x-2">
                              <FileText className="h-5 w-5 text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">Invoice #{order.invoiceNumber}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatIndianDate(order.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Payment ID: {order.paymentId}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {order.domains.length} domain{order.domains.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold text-gray-900">
                            ₹{order.amount.toFixed(2)} {order.currency}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Domains in this order:</h4>
                        <div className="space-y-2">
                          {order.domains.map((domain, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`w-2 h-2 rounded-full ${domain.status === 'registered' ? 'bg-green-500' : 'bg-red-500'
                                  }`}></div>
                                <span className="font-medium text-gray-900">{domain.domainName}</span>
                                <span className="text-sm text-gray-500">
                                  {domain.registrationPeriod} year{domain.registrationPeriod !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-gray-900">
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

                      {order.successfulDomains.length > 0 && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              Successfully registered: {order.successfulDomains.join(', ')}
                            </span>
                          </div>
                        </div>
                      )}

                      {order.failedDomains.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-red-800">
                              Failed to register: {order.failedDomains.join(', ')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Invoice Actions */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button
                          onClick={() => handleViewInvoice(order)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Invoice</span>
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(order._id)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nameservers Tab */}
        {activeTab === 'nameservers' && (
          <div>
            <NameServerManagement />
          </div>
        )}
      </motion.div>

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

      {/* DNS Management Modal */}
      <DNSManagementModal
        isOpen={isDNSModalOpen}
        onClose={() => {
          setIsDNSModalOpen(false);
          setSelectedDomain(null);
        }}
        domainName={selectedDomain?.domainName || ''}
        isTestingMode={isTestingMode}
      />

      {/* Domain Renewal Modal */}
      <DomainRenewalModal
        isOpen={isRenewalModalOpen}
        onClose={() => {
          setIsRenewalModalOpen(false);
          setSelectedDomain(null);
        }}
        domainName={selectedDomain?.domainName || ''}
        isTestingMode={isTestingMode}
      />
    </div>
  );
}
