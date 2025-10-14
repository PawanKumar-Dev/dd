'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Globe, Plus, Edit3, Trash2, Save, X, RefreshCw, Server,
  AlertCircle, CheckCircle, Clock, Settings, ExternalLink,
  Database
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
  name: string;
  status: string;
  registrationDate?: string;
  expiryDate?: string;
  resellerClubOrderId?: string;
  dnsActivated?: boolean;
  dnsActivatedAt?: string;
}

export default function DNSManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [nameservers, setNameservers] = useState<string[]>([]);
  const [nameserverMethod, setNameserverMethod] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDNSLoading, setIsDNSLoading] = useState(false);
  const [isNameserverLoading, setIsNameserverLoading] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [dnsPropagationStatus, setDnsPropagationStatus] = useState<'checking' | 'propagating' | 'ready' | 'error'>('checking');
  const [propagationRetryCount, setPropagationRetryCount] = useState(0);
  const [newRecord, setNewRecord] = useState<DNSRecord>({
    type: 'A',
    name: '',
    value: '',
    ttl: 3600,
    priority: undefined,
  });
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editRecord, setEditRecord] = useState<DNSRecord>({
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

  // Load DNS records when domains are loaded and a domain is selected
  useEffect(() => {
    if (selectedDomain && domains.length > 0) {
      const domain = domains.find(d => d.id === selectedDomain);
      if (domain) {
        loadDNSRecords(selectedDomain);
      }
    }
  }, [domains, selectedDomain]);

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

  const loadDNSRecords = async (domainId: string, isRetry: boolean = false) => {
    if (!domainId || domains.length === 0) return;
    setIsDNSLoading(true);

    if (!isRetry) {
      setDnsPropagationStatus('checking');
    }

    try {
      const token = localStorage.getItem('token');
      const domain = domains.find(d => d.id === domainId);
      if (!domain) {
        console.error('Domain not found for ID:', domainId);
        setDnsRecords([]);
        return;
      }


      const response = await fetch(`/api/domains/dns?domainName=${encodeURIComponent(domain.name)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDnsRecords(data.records || []);
        setIsUsingMockData(false);
        setDnsPropagationStatus('ready');
        setPropagationRetryCount(0);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load DNS records:', errorData);

        // Check if it's a 404 error (domain not found in ResellerClub)
        if (response.status === 404) {
          setDnsRecords([]);

          // Check if this is a propagation issue
          if (propagationRetryCount < 3) {
            setDnsPropagationStatus('propagating');
            setPropagationRetryCount(prev => prev + 1);

            // Wait and retry after 30 seconds
            setTimeout(() => {
              loadDNSRecords(domainId, true);
            }, 30000);

            toast(`DNS zone is still propagating. Retrying in 30 seconds... (Attempt ${propagationRetryCount + 1}/3)`);
          } else {
            setDnsPropagationStatus('error');
            toast.error('DNS management API is currently unavailable. The domain is registered and DNS management is activated, but the API endpoints are not responding. Please contact support for assistance.');
          }
        } else {
          setDnsRecords([]);
          setDnsPropagationStatus('error');
          toast.error('Failed to load DNS records');
        }
      }
    } catch (error) {
      console.error('Error loading DNS records:', error);
      setDnsPropagationStatus('error');
      toast.error('Failed to load DNS records');
    } finally {
      setIsDNSLoading(false);
    }
  };

  const loadNameservers = async (domainId: string) => {
    if (!domainId || domains.length === 0) return;
    setIsNameserverLoading(true);
    try {
      const token = localStorage.getItem('token');
      const domain = domains.find(d => d.id === domainId);
      if (!domain) {
        console.error('Domain not found for ID:', domainId);
        setNameservers([]);
        return;
      }


      const response = await fetch(`/api/domains/nameservers?domainName=${encodeURIComponent(domain.name)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNameservers(data.nameservers || []);
          setNameserverMethod(data.method || '');
        } else {
          // Handle API success but lookup failure
          setNameservers([]);
          setNameserverMethod('');
          console.error('Nameserver lookup failed:', data.message);
          toast.error(data.message || 'Failed to retrieve nameserver information');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load nameservers:', errorData);
        setNameservers([]);
        setNameserverMethod('');

        // Show specific error message based on status
        if (response.status === 404) {
          toast.error(errorData.message || 'Nameserver information not available for this domain');
        } else if (response.status === 500) {
          toast.error('Server error occurred while fetching nameserver information');
        } else {
          toast.error(errorData.message || 'Failed to load nameserver information');
        }
      }
    } catch (error) {
      console.error('Error loading nameservers:', error);
      setNameservers([]);
      toast.error('Failed to load nameserver information');
    } finally {
      setIsNameserverLoading(false);
    }
  };

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomain(domainId);
    if (domainId && domains.length > 0) {
      loadDNSRecords(domainId);
      loadNameservers(domainId);
    }
  };

  const handleAddRecord = async () => {
    if (!selectedDomain || !newRecord.name || !newRecord.value) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate priority for MX and SRV records
    if ((newRecord.type === 'MX' || newRecord.type === 'SRV') && (!newRecord.priority || newRecord.priority < 0)) {
      toast.error('Priority is required for MX and SRV records');
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
          domainName: domain.name,
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

    // Find the record to get its data
    const record = dnsRecords.find(r => r.id === recordId) || dnsRecords[parseInt(recordId)];
    if (!record) {
      toast.error('Record not found');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const domain = domains.find(d => d.id === selectedDomain);
      if (!domain) return;

      const response = await fetch(`/api/domains/dns?domainName=${encodeURIComponent(domain.name)}&recordId=${encodeURIComponent(recordId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordData: record,
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

  const handleEditRecord = (record: DNSRecord, index: number) => {
    const uniqueId = `${record.type}-${record.id || index}-${record.name}-${record.value}`;
    setEditingRecord(uniqueId);
    setEditRecord({
      type: record.type,
      name: record.name,
      value: record.value,
      ttl: record.ttl,
      priority: record.priority,
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedDomain || !editingRecord) return;

    // Validate priority for MX and SRV records
    if ((editRecord.type === 'MX' || editRecord.type === 'SRV') && (!editRecord.priority || editRecord.priority < 0)) {
      toast.error('Priority is required for MX and SRV records');
      return;
    }

    const domain = domains.find(d => d.id === selectedDomain);
    if (!domain) return;

    try {
      const token = localStorage.getItem('token');

      // Get the original record to delete - find by unique identifier
      const originalRecord = dnsRecords.find(r => {
        const uniqueId = `${r.type}-${r.id || dnsRecords.indexOf(r)}-${r.name}-${r.value}`;
        return uniqueId === editingRecord;
      });

      if (!originalRecord) {
        toast.error('Record not found');
        return;
      }

      const recordId = originalRecord.id || dnsRecords.indexOf(originalRecord).toString();

      // First delete the original record
      const deleteResponse = await fetch(`/api/domains/dns?domainName=${encodeURIComponent(domain.name)}&recordId=${encodeURIComponent(recordId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordData: originalRecord,
        }),
      });

      if (!deleteResponse.ok) {
        const error = await deleteResponse.json();
        toast.error(error.error || 'Failed to delete original record');
        return;
      }

      // Then add the updated record
      const addResponse = await fetch('/api/domains/dns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainName: domain.name,
          recordData: editRecord,
        }),
      });

      if (addResponse.ok) {
        toast.success('DNS record updated successfully');
        setEditingRecord(null);
        loadDNSRecords(selectedDomain);
      } else {
        const error = await addResponse.json();
        toast.error(error.error || 'Failed to add updated record');
        // Try to restore the original record
        await fetch('/api/domains/dns', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domainName: domain.name,
            recordData: originalRecord,
          }),
        });
      }
    } catch (error) {
      console.error('Error updating DNS record:', error);
      toast.error('Failed to update DNS record');
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditRecord({
      type: 'A',
      name: '',
      value: '',
      ttl: 3600,
      priority: undefined,
    });
  };

  const handleActivateDNS = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const domain = domains.find(d => d.id === selectedDomain);
    if (!domain) return;

    setIsActivating(true);
    try {
      const response = await fetch('/api/domains/activate-dns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainName: domain.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('DNS management activated successfully!');

        // Update the domain in the local state
        setDomains(prevDomains =>
          prevDomains.map(d =>
            d.id === selectedDomain
              ? { ...d, dnsActivated: true, dnsActivatedAt: data.dnsActivatedAt }
              : d
          )
        );

        // Reload domains to get updated data
        loadDomains();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to activate DNS management');
      }
    } catch (error) {
      console.error('Error activating DNS:', error);
      toast.error('Failed to activate DNS management');
    } finally {
      setIsActivating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
    toast.success('Logged out successfully');
  };

  if (!user) {
    return <PageLoading page="dns-management" />;
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header - Simple Dashboard Style */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">DNS Management</h1>
                  <p className="text-gray-600 mt-1">Manage DNS records for your domains</p>
                </div>
                <button
                  onClick={() => loadDomains()}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

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
                        {domain.name} ({domain.status})
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

            {/* Nameserver Information - Matching Dashboard Style */}
            {selectedDomain && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Nameservers</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Current nameservers for {domains.find(d => d.id === selectedDomain)?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => selectedDomain && loadNameservers(selectedDomain)}
                    disabled={isNameserverLoading}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isNameserverLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </>
                    )}
                  </button>
                </div>

                {isNameserverLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Loading nameserver information...</p>
                  </div>
                ) : nameservers.length > 0 ? (
                  <div className="space-y-1.5">
                    {nameservers.map((ns, index) => (
                      <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2.5"></div>
                          <span className="font-mono text-sm text-gray-900">{ns}</span>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">#{index + 1}</span>
                      </div>
                    ))}
                    <div className="mt-2 p-2 bg-blue-50 rounded-md">
                      <div className="flex items-start">
                        <svg className="h-4 w-4 text-blue-400 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-blue-800 leading-relaxed">
                          <strong>Note:</strong> These nameservers are retrieved from RDAP data and may not reflect real-time changes.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Nameserver Information Unavailable</h4>
                    <p className="text-gray-500 mb-4">Unable to retrieve nameserver information for this domain</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">
                        <strong>Possible reasons:</strong>
                      </p>
                      <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                        <li>Domain is not registered or expired</li>
                        <li>WHOIS servers are temporarily unavailable</li>
                        <li>Domain uses private registration</li>
                        <li>Network connectivity issues</li>
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

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
                      Managing DNS for {domains.find(d => d.id === selectedDomain)?.name}
                    </p>

                    {/* Help text for Name field */}
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-800">
                            <strong>💡 Name Field Help:</strong> Use <code className="bg-blue-100 px-1 rounded text-blue-900">@</code> for the root domain ({domains.find(d => d.id === selectedDomain)?.name}), or enter subdomain names like <code className="bg-blue-100 px-1 rounded text-blue-900">www</code>, <code className="bg-blue-100 px-1 rounded text-blue-900">mail</code>, etc.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* DNS Propagation Status */}
                    {dnsPropagationStatus === 'checking' && (
                      <div className="mt-2 flex items-center text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Checking DNS zone status...
                      </div>
                    )}

                    {dnsPropagationStatus === 'propagating' && (
                      <div className="mt-2 flex items-center text-sm text-orange-600">
                        <div className="animate-pulse rounded-full h-4 w-4 bg-orange-600 mr-2"></div>
                        DNS zone is propagating... Retrying in 30 seconds (Attempt {propagationRetryCount}/3)
                      </div>
                    )}

                    {dnsPropagationStatus === 'ready' && (
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        <div className="rounded-full h-4 w-4 bg-green-600 mr-2"></div>
                        DNS zone is ready and accessible
                      </div>
                    )}

                    {dnsPropagationStatus === 'error' && (
                      <div className="mt-2 flex items-center justify-between text-sm text-red-600">
                        <div className="flex items-center">
                          <div className="rounded-full h-4 w-4 bg-red-600 mr-2"></div>
                          DNS zone is not accessible - please contact support
                        </div>
                        <button
                          onClick={() => {
                            setPropagationRetryCount(0);
                            setDnsPropagationStatus('checking');
                            loadDNSRecords(selectedDomain);
                          }}
                          className="ml-4 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    {selectedDomain && domains.find(d => d.id === selectedDomain) && (
                      (() => {
                        const domain = domains.find(d => d.id === selectedDomain);
                        if (!domain?.resellerClubOrderId) {
                          return (
                            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm text-yellow-800">
                                    <strong>DNS Management Not Available:</strong> This domain was not registered through ResellerClub. DNS management is only available for domains registered through our platform.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        } else if (!domain?.dnsActivated) {
                          return (
                            <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm text-blue-800">
                                      <strong>Activate DNS Management:</strong> DNS management is available for this domain. Click the button to activate it and start managing your DNS records.
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={handleActivateDNS}
                                  disabled={isActivating}
                                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${isActivating
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                  {isActivating ? 'Activating...' : 'ACTIVATE DNS MANAGEMENT'}
                                </button>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm text-green-800">
                                    <strong>DNS Management Active:</strong> DNS management is activated for this domain. You can now manage your DNS records.
                                    {domain.dnsActivatedAt && (
                                      <span className="block text-xs text-green-600 mt-1">
                                        Activated on {new Date(domain.dnsActivatedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      })()
                    )}
                  </div>
                  <button
                    onClick={() => setShowAddRecord(!showAddRecord)}
                    disabled={!!(selectedDomain && domains.find(d => d.id === selectedDomain) && (!domains.find(d => d.id === selectedDomain)?.resellerClubOrderId || !domains.find(d => d.id === selectedDomain)?.dnsActivated))}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${selectedDomain && domains.find(d => d.id === selectedDomain) && (!domains.find(d => d.id === selectedDomain)?.resellerClubOrderId || !domains.find(d => d.id === selectedDomain)?.dnsActivated)
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Record
                  </button>
                </div>

                {/* Add Record Form */}
                {showAddRecord && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Add New DNS Record</h4>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={newRecord.type}
                          onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value, priority: undefined })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="A">A</option>
                          <option value="AAAA">AAAA</option>
                          <option value="CNAME">CNAME</option>
                          <option value="MX">MX</option>
                          <option value="TXT">TXT</option>
                          <option value="NS">NS</option>
                          <option value="SRV">SRV</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Name
                          <span className="text-gray-500 ml-1" title="Use '@' for root domain, or subdomain name (e.g., 'www', 'mail')">
                            (?)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={newRecord.name}
                          onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                          placeholder="e.g., www, mail, @"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Use <code className="bg-gray-100 px-1 rounded">@</code> for root domain ({selectedDomain}), or enter subdomain name
                        </p>
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
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">TTL</label>
                        <input
                          type="number"
                          value={newRecord.ttl}
                          onChange={(e) => setNewRecord({ ...newRecord, ttl: parseInt(e.target.value) || 3600 })}
                          min="300"
                          max="86400"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Priority
                          {(newRecord.type === 'MX' || newRecord.type === 'SRV') && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        <input
                          type="number"
                          value={newRecord.priority || ''}
                          onChange={(e) => setNewRecord({ ...newRecord, priority: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder={(newRecord.type === 'MX' || newRecord.type === 'SRV') ? "Required" : "Optional"}
                          min="0"
                          max="65535"
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                            <span className="text-gray-400 ml-1" title="'@' represents the root domain, subdomains show as entered">
                              (?)
                            </span>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TTL / Priority</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dnsRecords.map((record, index) => (
                          <tr key={`${record.type}-${record.id || index}-${record.name}-${record.value}`} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              {editingRecord === `${record.type}-${record.id || index}-${record.name}-${record.value}` ? (
                                <select
                                  value={editRecord.type}
                                  onChange={(e) => setEditRecord({ ...editRecord, type: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="A">A</option>
                                  <option value="AAAA">AAAA</option>
                                  <option value="CNAME">CNAME</option>
                                  <option value="MX">MX</option>
                                  <option value="NS">NS</option>
                                  <option value="TXT">TXT</option>
                                  <option value="SRV">SRV</option>
                                </select>
                              ) : (
                                record.type
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {editingRecord === `${record.type}-${record.id || index}-${record.name}-${record.value}` ? (
                                <input
                                  type="text"
                                  value={editRecord.name}
                                  onChange={(e) => setEditRecord({ ...editRecord, name: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                record.name
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {editingRecord === `${record.type}-${record.id || index}-${record.name}-${record.value}` ? (
                                <input
                                  type="text"
                                  value={editRecord.value}
                                  onChange={(e) => setEditRecord({ ...editRecord, value: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                record.value
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {editingRecord === `${record.type}-${record.id || index}-${record.name}-${record.value}` ? (
                                <div className="flex space-x-2">
                                  <input
                                    type="number"
                                    value={editRecord.ttl}
                                    onChange={(e) => setEditRecord({ ...editRecord, ttl: parseInt(e.target.value) || 3600 })}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                    min="300"
                                    placeholder="TTL"
                                  />
                                  {(editRecord.type === 'MX' || editRecord.type === 'SRV') && (
                                    <input
                                      type="number"
                                      value={editRecord.priority || 10}
                                      onChange={(e) => setEditRecord({ ...editRecord, priority: parseInt(e.target.value) || 10 })}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                      min="0"
                                      max="65535"
                                      placeholder="Priority"
                                    />
                                  )}
                                </div>
                              ) : (
                                <div>
                                  {record.ttl}
                                  {(record.type === 'MX' || record.type === 'SRV') && record.priority && (
                                    <span className="text-gray-500 ml-2">(Priority: {record.priority})</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              <div className="flex items-center space-x-2">
                                {editingRecord === `${record.type}-${record.id || index}-${record.name}-${record.value}` ? (
                                  <>
                                    <button
                                      onClick={handleSaveEdit}
                                      className="text-green-600 hover:text-green-900 transition-colors"
                                      title="Save Changes"
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="text-gray-600 hover:text-gray-900 transition-colors"
                                      title="Cancel"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditRecord(record, index)}
                                      className="text-blue-600 hover:text-blue-900 transition-colors"
                                      title="Edit Record"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRecord(record.id || index.toString())}
                                      className="text-red-600 hover:text-red-900 transition-colors"
                                      title="Delete Record"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
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
                    <p className="text-gray-500 mb-4">No DNS records found for this domain</p>

                    {dnsPropagationStatus === 'propagating' && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="animate-pulse rounded-full h-5 w-5 bg-orange-400"></div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-orange-700">
                              <strong>DNS Zone Propagating:</strong> The DNS zone is still propagating through OrderBox's system. This usually takes 10-30 minutes after activation.
                            </p>
                            <div className="mt-2 text-xs text-orange-600">
                              <p>• Automatic retry in progress...</p>
                              <p>• Attempt {propagationRetryCount}/3</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {dnsPropagationStatus === 'error' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">
                              <strong>DNS Management Unavailable:</strong> The DNS zone is not accessible via API. This may be due to API configuration or domain setup issues.
                            </p>
                            <div className="mt-2 text-xs text-red-600">
                              <p>• Domain: anutechpvtltd.co.in</p>
                              <p>• Order ID: 122709027</p>
                              <p>• Customer ID: 32262841</p>
                              <p>• DNS Zone: Activated but not accessible</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {dnsPropagationStatus === 'checking' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              <strong>Checking DNS Zone:</strong> Verifying DNS zone status and accessibility...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
