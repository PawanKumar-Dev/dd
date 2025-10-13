'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Server,
  Database,
  Settings,
  Edit3,
  Trash2,
  Save,
  X,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Users,
  Globe,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import AdminLayoutNew from '@/components/admin/AdminLayoutNew';

interface Domain {
  id: string;
  name: string;
  price: number;
  currency: string;
  registrationPeriod: number;
  status: string;
  expiresAt: string;
  resellerClubOrderId?: string;
  resellerClubCustomerId?: string;
  resellerClubContactId?: string;
  dnsActivated?: boolean;
  dnsActivatedAt?: string;
  customerName?: string;
  customerEmail?: string;
  orderId?: string;
}

interface DNSRecord {
  id: string;
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

interface NameserverInfo {
  nameservers: string[];
  method: string;
  whoisData?: {
    registrar: string;
    creationDate: string;
    expirationDate: string;
    lastUpdated: string;
    status: string;
  };
}

export default function AdminDNSManagementPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [nameservers, setNameservers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDNSLoading, setIsDNSLoading] = useState(false);
  const [isNameserverLoading, setIsNameserverLoading] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [dnsPropagationStatus, setDnsPropagationStatus] = useState<'checking' | 'propagating' | 'ready' | 'error'>('checking');
  const [propagationRetryCount, setPropagationRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newRecord, setNewRecord] = useState<Omit<DNSRecord, 'id'>>({
    type: 'A',
    name: '',
    value: '',
    ttl: 3600,
    priority: undefined,
  });
  const [user, setUser] = useState<{ firstName: string; lastName: string; role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        window.location.href = '/dashboard';
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      window.location.href = '/login';
      return;
    }

    loadAllDomains();
  }, []);

  useEffect(() => {
    if (selectedDomain && domains.length > 0) {
      const domain = domains.find(d => d.id === selectedDomain);
      if (domain) {
        loadDNSRecords(selectedDomain);
        loadNameservers(selectedDomain);
      }
    }
  }, [domains, selectedDomain]);

  const loadAllDomains = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/domains', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains || []);
      } else {
        toast.error('Failed to load domains');
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


      const response = await fetch(`/api/admin/domains/dns?domainName=${encodeURIComponent(domain.name)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDnsRecords(data.records || []);
        setDnsPropagationStatus('ready');
        setPropagationRetryCount(0);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load DNS records:', errorData);

        if (response.status === 404) {
          setDnsRecords([]);

          if (propagationRetryCount < 3) {
            setDnsPropagationStatus('propagating');
            setPropagationRetryCount(prev => prev + 1);

            setTimeout(() => {
              loadDNSRecords(domainId, true);
            }, 30000);

            toast(`DNS zone is still propagating. Retrying in 30 seconds... (Attempt ${propagationRetryCount + 1}/3)`);
          } else {
            setDnsPropagationStatus('error');
            toast.error('DNS management API is currently unavailable. Please contact support for assistance.');
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
      if (!domain) return;

      const response = await fetch(`/api/domains/nameservers?domainName=${encodeURIComponent(domain.name)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNameservers(data.nameservers || []);
      } else {
        console.error('Failed to load nameservers');
        setNameservers([]);
      }
    } catch (error) {
      console.error('Error loading nameservers:', error);
      setNameservers([]);
    } finally {
      setIsNameserverLoading(false);
    }
  };

  const handleDomainClick = (domainId: string) => {
    setSelectedDomain(domainId);
    if (domainId && domains.length > 0) {
      loadDNSRecords(domainId);
      loadNameservers(domainId);
    }
  };

  const handleActivateDNS = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    setIsActivating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/domains/activate-dns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ domainName: domain.name }),
      });

      if (response.ok) {
        toast.success('DNS management activated successfully');
        loadAllDomains(); // Refresh domains list
        if (selectedDomain === domainId) {
          loadDNSRecords(domainId);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to activate DNS management');
      }
    } catch (error) {
      console.error('Error activating DNS:', error);
      toast.error('Failed to activate DNS management');
    } finally {
      setIsActivating(false);
    }
  };

  const handleAddRecord = async () => {
    if (!selectedDomain) {
      toast.error('Please select a domain first');
      return;
    }

    if (!newRecord.name || !newRecord.value) {
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

      const response = await fetch('/api/admin/domains/dns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          domainName: domain.name,
          recordData: newRecord,
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

      const response = await fetch(`/api/admin/domains/dns?domainName=${encodeURIComponent(domain.name)}&recordId=${encodeURIComponent(recordId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recordData: dnsRecords.find(r => r.id === recordId),
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
    window.location.href = '/login';
  };

  const filteredDomains = domains.filter(domain => {
    const matchesSearch = domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'dns_activated' && domain.dnsActivated) ||
      (statusFilter === 'not_activated' && !domain.dnsActivated) ||
      (statusFilter === 'registered' && domain.status === 'registered');

    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalDomains: domains.length,
    dnsActivated: domains.filter(d => d.dnsActivated).length,
    notActivated: domains.filter(d => !d.dnsActivated).length,
    registered: domains.filter(d => d.status === 'registered').length,
  };

  if (isLoading) {
    return (
      <AdminLayoutNew user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading domains...</p>
          </div>
        </div>
      </AdminLayoutNew>
    );
  }

  return (
    <AdminLayoutNew user={user} onLogout={handleLogout}>
      <div className="p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">DNS Management</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage DNS records for all customer domains</p>
            </div>
            <button
              onClick={loadAllDomains}
              className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6">
          {/* Domains List */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">All Domains</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search domains..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="dns_activated">DNS Activated</option>
                    <option value="not_activated">Not Activated</option>
                    <option value="registered">Registered</option>
                  </select>
                </div>
              </div>


              <div className="space-y-1 sm:space-y-2 max-h-60 sm:max-h-80 overflow-y-auto">

                {filteredDomains.map((domain) => (
                  <div
                    key={domain.id}
                    className={`p-2 sm:p-3 rounded-lg border transition-all duration-200 cursor-pointer ${selectedDomain === domain.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                      }`}
                    onClick={() => handleDomainClick(domain.id)}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {domain.name}
                          {selectedDomain === domain.id && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Selected
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {domain.customerName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {domain.customerEmail}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-none">
                            {domain.orderId}
                          </p>
                          {domain.dnsActivated ? (
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>

                    {!domain.dnsActivated && domain.resellerClubOrderId && (
                      <div className="mt-2 ml-6 sm:ml-7">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivateDNS(domain.id);
                          }}
                          disabled={isActivating}
                          className="w-full px-2 sm:px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isActivating ? 'Activating...' : 'Activate DNS'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DNS Management */}
          <div className="xl:col-span-3">
            {selectedDomain ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Nameservers */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Nameservers</h3>
                    <button
                      onClick={() => loadNameservers(selectedDomain)}
                      disabled={isNameserverLoading}
                      className="flex items-center justify-center px-3 py-1 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 w-full sm:w-auto"
                    >
                      <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isNameserverLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>

                  {isNameserverLoading ? (
                    <div className="flex items-center justify-center py-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  ) : nameservers.length > 0 ? (
                    <div className="space-y-1.5">
                      {nameservers.map((ns, index) => (
                        <div key={index} className="flex items-center text-sm px-2 py-1.5 bg-gray-50 rounded-md">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2.5"></div>
                          <span className="text-gray-900 font-mono">{ns}</span>
                          <span className="ml-auto text-xs text-gray-500 font-medium">#{index + 1}</span>
                        </div>
                      ))}
                      <p className="text-xs text-blue-600 mt-1.5 px-2">
                        <strong>Note:</strong> These nameservers are retrieved from RDAP data and may not reflect real-time changes.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nameserver Information Unavailable</p>
                    </div>
                  )}
                </div>

                {/* DNS Records */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">DNS Records</h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                        Managing DNS for {domains.find(d => d.id === selectedDomain)?.name}
                      </p>

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
                    </div>
                    <button
                      onClick={() => setShowAddRecord(true)}
                      disabled={dnsPropagationStatus !== 'ready'}
                      className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Add Record
                    </button>
                  </div>

                  {isDNSLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : dnsRecords.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                            <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TTL</th>
                            <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                            <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dnsRecords.map((record) => (
                            <tr key={record.id}>
                              <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                {record.type}
                              </td>
                              <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                {record.name}
                              </td>
                              <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 max-w-[100px] sm:max-w-none truncate">
                                {record.value}
                              </td>
                              <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                {record.ttl}
                              </td>
                              <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                {record.priority || '-'}
                              </td>
                              <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                                <button
                                  onClick={() => handleDeleteRecord(record.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Globe className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Domain</h3>
                  <p className="text-sm text-gray-600 mb-4">Choose a domain from the list to view and manage its DNS records</p>
                </div>


                {domains.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-yellow-800 text-xs font-bold">!</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          No domains found. Make sure domains are registered and active.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                          <span className="text-blue-800 text-xs font-bold">i</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">
                          {domains.length} domain{domains.length !== 1 ? 's' : ''} available for DNS management
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Record Modal */}
        {showAddRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add DNS Record</h3>
                <button
                  onClick={() => setShowAddRecord(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newRecord.type}
                    onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value, priority: undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newRecord.name}
                    onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                    placeholder="e.g., www, mail, @"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input
                    type="text"
                    value={newRecord.value}
                    onChange={(e) => setNewRecord({ ...newRecord, value: e.target.value })}
                    placeholder="e.g., 192.168.1.1, example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TTL</label>
                  <input
                    type="number"
                    value={newRecord.ttl}
                    onChange={(e) => setNewRecord({ ...newRecord, ttl: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {(newRecord.type === 'MX' || newRecord.type === 'SRV') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={newRecord.priority || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, priority: parseInt(e.target.value) })}
                      placeholder="Required for MX/SRV records"
                      min="0"
                      max="65535"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddRecord(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRecord}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutNew>
  );
}
