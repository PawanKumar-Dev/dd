'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Globe, Plus, Edit3, Trash2, Save, X, RefreshCw, Server,
  AlertCircle, CheckCircle, Clock, Settings, ExternalLink,
  Database, ArrowLeft, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
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

export default function DomainManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadDomains();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [router]);

  const loadDomains = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
    toast.success('Logged out successfully');
  };

  if (!user) {
    return <PageLoading page="domain-management" />;
  }

  if (isLoading) {
    return (
      <ClientOnly>
        <UserLayout user={user} onLogout={handleLogout}>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <DataLoading />
          </div>
        </UserLayout>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <UserLayout user={user} onLogout={handleLogout}>
        <div className="min-h-screen bg-gray-50">
          {/* Header - Matching Dashboard Style */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-6">
                <div className="flex items-center">
                  <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-colors duration-200"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">DNS Management</h1>
                    <p className="text-gray-600 mt-1">Manage DNS records for your domains</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => loadDomains()}
                    disabled={isLoading}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Stats Cards - Matching Dashboard Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-lg bg-blue-100">
                      <Globe className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Domains</p>
                    <p className="text-2xl font-bold text-gray-900">{domains.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Available for management</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-lg bg-green-100">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Domains</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {domains.filter(d => d.status === 'active').length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Ready for DNS management</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-lg bg-purple-100">
                      <Server className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">DNS Records</p>
                    <p className="text-2xl font-bold text-gray-900">{dnsRecords.length}</p>
                    <p className="text-xs text-gray-500 mt-1">For selected domain</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Domain Selection - Matching Dashboard Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Domain</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Database className="h-4 w-4 mr-2" />
                  {domains.length} domain{domains.length !== 1 ? 's' : ''} available
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain Name
                  </label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => handleDomainSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
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
                      Domain Status
                    </label>
                    <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mr-2 ${selectedDomain
                          ? domains.find(d => d.id === selectedDomain)?.status === 'active'
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                          : 'bg-gray-400'
                        }`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedDomain
                          ? domains.find(d => d.id === selectedDomain)?.status || 'Unknown'
                          : 'No domain selected'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* DNS Records Management - Matching Dashboard Style */}
            {selectedDomain && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">DNS Records</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Managing DNS for {domains.find(d => d.id === selectedDomain)?.domainName}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddRecord(!showAddRecord)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Record
                  </button>
                </div>

                {/* Add Record Form */}
                {showAddRecord && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Add New DNS Record</h4>
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
                          className="flex items-center px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddRecord(false)}
                          className="flex items-center px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TTL</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dnsRecords.map((record, index) => (
                          <tr key={record.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">{record.type}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">{record.name}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">{record.value}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">{record.ttl}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              <button
                                onClick={() => handleDeleteRecord(record.id || index.toString())}
                                className="text-red-600 hover:text-red-900 transition-colors"
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
              </motion.div>
            )}

            {/* Empty States - Matching Dashboard Style */}
            {!selectedDomain && domains.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center"
              >
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Domain</h3>
                <p className="text-gray-500">Choose a domain from the dropdown above to manage its DNS records</p>
              </motion.div>
            )}

            {domains.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center"
              >
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Domains Found</h3>
                <p className="text-gray-500 mb-6">You don't have any domains registered yet</p>
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Search Domains
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </UserLayout>
    </ClientOnly>
  );
}
