'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Globe, ShoppingCart, TrendingUp, Clock, CheckCircle,
  AlertTriangle, Calendar, ArrowRight, Plus, RefreshCw,
  Server, Database, Settings, Edit3, Trash2, Save, X
} from 'lucide-react';
import RupeeIcon from '@/components/icons/RupeeIcon';
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

interface DNSRecord {
  id?: string;
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

interface Domain {
  id: string;
  domainName: string;
  status: string;
  creationDate?: string;
  lastUpdated?: string;
}

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDomainManagement, setShowDomainManagement] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [isDNSLoading, setIsDNSLoading] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newRecord, setNewRecord] = useState<DNSRecord>({
    type: 'A',
    name: '',
    value: '',
    ttl: 3600,
    priority: undefined,
  });
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

  // Handle hash navigation to domain management section
  useEffect(() => {
    if (window.location.hash === '#domain-management') {
      setShowDomainManagement(true);
      loadDomains();
    }
  }, []);

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

  // Domain Management Functions
  const loadDomains = async () => {
    setIsDNSLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/domains', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains || []);
      } else {
        console.error('Failed to load domains');
        setDomains([]);
      }
    } catch (error) {
      console.error('Error loading domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setIsDNSLoading(false);
    }
  };

  const loadDNSRecords = async (domainId: string) => {
    if (!domainId) return;
    setIsDNSLoading(true);
    try {
      const token = localStorage.getItem('token');
      const domain = domains.find(d => d.id === domainId);
      if (!domain) return;

      const response = await fetch(`/api/domains/dns?domainName=${encodeURIComponent(domain.domainName)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDnsRecords(data.records || []);
      } else {
        console.error('Failed to load DNS records');
        setDnsRecords([]);
      }
    } catch (error) {
      console.error('Error loading DNS records:', error);
      toast.error('Failed to load DNS records');
    } finally {
      setIsDNSLoading(false);
    }
  };

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomain(domainId);
    loadDNSRecords(domainId);
  };

  const handleAddRecord = async () => {
    if (!selectedDomain || !newRecord.name || !newRecord.value) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const domain = domains.find(d => d.id === selectedDomain);
      if (!domain) return;

      const response = await fetch('/api/domains/dns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainName: domain.domainName,
          record: newRecord,
        }),
      });

      if (response.ok) {
        toast.success('DNS record added successfully');
        setNewRecord({ type: 'A', name: '', value: '', ttl: 3600, priority: undefined });
        setShowAddRecord(false);
        loadDNSRecords(selectedDomain);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add DNS record');
      }
    } catch (error) {
      console.error('Error adding DNS record:', error);
      toast.error('Failed to add DNS record');
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!selectedDomain) return;

    try {
      const token = localStorage.getItem('token');
      const domain = domains.find(d => d.id === selectedDomain);
      if (!domain) return;

      const response = await fetch('/api/domains/dns', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainName: domain.domainName,
          recordId,
        }),
      });

      if (response.ok) {
        toast.success('DNS record deleted successfully');
        loadDNSRecords(selectedDomain);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete DNS record');
      }
    } catch (error) {
      console.error('Error deleting DNS record:', error);
      toast.error('Failed to delete DNS record');
    }
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
      icon: RupeeIcon,
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
                {stats?.upcomingRenewals && stats.upcomingRenewals.length > 0 ? (
                  stats.upcomingRenewals.map((renewal, index) => (
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
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Renewals</h4>
                    <p className="text-gray-500 text-sm">
                      {stats?.activeDomains > 0
                        ? "No domains are expiring in the next 30 days"
                        : "You don't have any registered domains yet"
                      }
                    </p>
                    {stats?.activeDomains > 0 && (
                      <p className="text-gray-400 text-xs mt-2">
                        We'll notify you when your domains are approaching expiration
                      </p>
                    )}
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

          {/* Domain Management Section */}
          <motion.div
            id="domain-management"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Server className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">DNS Management</h3>
                  <p className="text-sm text-gray-500">Manage DNS records for your domains</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDomainManagement(!showDomainManagement);
                  if (!showDomainManagement) {
                    loadDomains();
                  }
                }}
                className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                {showDomainManagement ? 'Hide' : 'Manage DNS'}
              </button>
            </div>

            {showDomainManagement && (
              <div className="space-y-6">
                {/* Domain Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Domain
                    </label>
                    <select
                      value={selectedDomain}
                      onChange={(e) => handleDomainSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isDNSLoading}
                    >
                      <option value="">Choose a domain...</option>
                      {domains.map((domain) => (
                        <option key={domain.id} value={domain.id}>
                          {domain.domainName} ({domain.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Domains
                      </label>
                      <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
                        <Database className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-lg font-semibold text-gray-900">
                          {domains.length} domain{domains.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DNS Records */}
                {selectedDomain && (
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-gray-900">DNS Records</h4>
                      <button
                        onClick={() => setShowAddRecord(!showAddRecord)}
                        className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Record
                      </button>
                    </div>

                    {/* Add Record Form */}
                    {showAddRecord && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Add New DNS Record</h5>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                            <select
                              value={newRecord.type}
                              onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="A">A</option>
                              <option value="AAAA">AAAA</option>
                              <option value="CNAME">CNAME</option>
                              <option value="MX">MX</option>
                              <option value="TXT">TXT</option>
                              <option value="NS">NS</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                            <input
                              type="text"
                              value={newRecord.name}
                              onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                              placeholder="e.g., www"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                            <input
                              type="text"
                              value={newRecord.value}
                              onChange={(e) => setNewRecord({ ...newRecord, value: e.target.value })}
                              placeholder="e.g., 192.168.1.1"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex items-end space-x-2">
                            <button
                              onClick={handleAddRecord}
                              className="flex items-center px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Add
                            </button>
                            <button
                              onClick={() => setShowAddRecord(false)}
                              className="flex items-center px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Records List */}
                    {isDNSLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-500">Loading DNS records...</p>
                      </div>
                    ) : dnsRecords.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">TTL</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {dnsRecords.map((record, index) => (
                              <tr key={record.id || index}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{record.type}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{record.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{record.value}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{record.ttl}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  <button
                                    onClick={() => handleDeleteRecord(record.id || index.toString())}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete Record"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No DNS Records</h4>
                        <p className="text-gray-500">No DNS records found for this domain</p>
                      </div>
                    )}
                  </div>
                )}

                {!selectedDomain && domains.length > 0 && (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Select a Domain</h4>
                    <p className="text-gray-500">Choose a domain from the dropdown to manage its DNS records</p>
                  </div>
                )}

                {domains.length === 0 && (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Domains Found</h4>
                    <p className="text-gray-500 mb-4">You don't have any domains registered yet</p>
                    <button
                      onClick={() => router.push('/')}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Search Domains
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </UserLayout>
    </ClientOnly>
  );
}