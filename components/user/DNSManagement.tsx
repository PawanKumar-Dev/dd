'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Plus, Edit3, Trash2, Save, X, RefreshCw, Server,
  AlertCircle, CheckCircle, Clock, Settings, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTestingStore } from '@/store/testingStore';

interface DNSRecord {
  id?: string;
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

interface DNSManagementProps {
  domainName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DNSManagement({ domainName, isOpen, onClose }: DNSManagementProps) {
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);
  const [newRecord, setNewRecord] = useState<DNSRecord>({
    type: 'A',
    name: '',
    value: '',
    ttl: 3600,
    priority: undefined,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [nameservers, setNameservers] = useState<string[]>([]);
  const [customNameservers, setCustomNameservers] = useState<string[]>(['', '', '', '']);
  const [showNameserverForm, setShowNameserverForm] = useState(false);
  const { isTestingMode } = useTestingStore();

  const recordTypes = [
    { value: 'A', label: 'A (IPv4 Address)', description: 'Points to an IPv4 address' },
    { value: 'AAAA', label: 'AAAA (IPv6 Address)', description: 'Points to an IPv6 address' },
    { value: 'CNAME', label: 'CNAME (Canonical Name)', description: 'Points to another domain name' },
    { value: 'MX', label: 'MX (Mail Exchange)', description: 'Mail server for the domain', priority: true },
    { value: 'TXT', label: 'TXT (Text Record)', description: 'Arbitrary text data' },
    { value: 'NS', label: 'NS (Name Server)', description: 'Authoritative name server' },
    { value: 'SRV', label: 'SRV (Service Record)', description: 'Service location record', priority: true },
  ];

  useEffect(() => {
    if (isOpen) {
      loadDNSData();
    }
  }, [isOpen, domainName]);

  const loadDNSData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Load DNS records
      const recordsResponse = await fetch(`/api/domains/dns?domainName=${encodeURIComponent(domainName)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-testing-mode': isTestingMode.toString(),
        },
      });

      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json();
        setRecords(recordsData.records || []);
      } else {
        const error = await recordsResponse.json();
        toast.error(error.error || 'Failed to load DNS records');
      }

      // Load nameservers (mock for now - would need separate API)
      setNameservers([
        'ns1.example.com',
        'ns2.example.com',
        'ns3.example.com',
        'ns4.example.com'
      ]);

    } catch (error) {
      console.error('Error loading DNS data:', error);
      toast.error('Failed to load DNS data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!newRecord.name || !newRecord.value) {
      toast.error('Name and value are required');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/domains/dns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-testing-mode': isTestingMode.toString(),
        },
        body: JSON.stringify({
          domainName,
          recordData: newRecord,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('DNS record added successfully');
        setNewRecord({ type: 'A', name: '', value: '', ttl: 3600 });
        setShowAddForm(false);
        loadDNSData(); // Reload records
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add DNS record');
      }
    } catch (error) {
      console.error('Error adding DNS record:', error);
      toast.error('Failed to add DNS record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRecord = async (record: DNSRecord) => {
    if (!record.id) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/domains/dns', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-testing-mode': isTestingMode.toString(),
        },
        body: JSON.stringify({
          domainName,
          recordId: record.id,
          recordData: record,
        }),
      });

      if (response.ok) {
        toast.success('DNS record updated successfully');
        setEditingRecord(null);
        loadDNSData(); // Reload records
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update DNS record');
      }
    } catch (error) {
      console.error('Error updating DNS record:', error);
      toast.error('Failed to update DNS record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this DNS record?')) {
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/domains/dns?domainName=${encodeURIComponent(domainName)}&recordId=${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-testing-mode': isTestingMode.toString(),
        },
      });

      if (response.ok) {
        toast.success('DNS record deleted successfully');
        loadDNSData(); // Reload records
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete DNS record');
      }
    } catch (error) {
      console.error('Error deleting DNS record:', error);
      toast.error('Failed to delete DNS record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefaultNameservers = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/domains/nameservers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-testing-mode': isTestingMode.toString(),
        },
        body: JSON.stringify({
          domainName,
          action: 'set-default',
        }),
      });

      if (response.ok) {
        toast.success('Nameservers set to default successfully');
        setShowNameserverForm(false);
        loadDNSData(); // Reload data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to set default nameservers');
      }
    } catch (error) {
      console.error('Error setting default nameservers:', error);
      toast.error('Failed to set default nameservers');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetCustomNameservers = async () => {
    const validNameservers = customNameservers.filter(ns => ns.trim() !== '');

    if (validNameservers.length === 0) {
      toast.error('At least one nameserver is required');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/domains/nameservers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-testing-mode': isTestingMode.toString(),
        },
        body: JSON.stringify({
          domainName,
          action: 'set-custom',
          nameservers: validNameservers,
        }),
      });

      if (response.ok) {
        toast.success('Custom nameservers set successfully');
        setShowNameserverForm(false);
        setCustomNameservers(['', '', '', '']);
        loadDNSData(); // Reload data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to set custom nameservers');
      }
    } catch (error) {
      console.error('Error setting custom nameservers:', error);
      toast.error('Failed to set custom nameservers');
    } finally {
      setIsSaving(false);
    }
  };

  const getRecordTypeInfo = (type: string) => {
    return recordTypes.find(rt => rt.value === type);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Globe className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                DNS Management - {domainName}
              </h3>
              <p className="text-sm text-gray-500">
                Manage DNS records and nameservers for your domain
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadDNSData}
              disabled={isLoading}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - DNS Records */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-gray-900">DNS Records</h4>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </button>
            </div>

            {/* Add Record Form */}
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <h5 className="text-sm font-medium text-gray-900 mb-4">Add New DNS Record</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={newRecord.type}
                      onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {recordTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newRecord.name}
                      onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                      placeholder="e.g., www, mail, @"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={newRecord.value}
                      onChange={(e) => setNewRecord({ ...newRecord, value: e.target.value })}
                      placeholder="e.g., 192.168.1.1, example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TTL
                    </label>
                    <input
                      type="number"
                      value={newRecord.ttl}
                      onChange={(e) => setNewRecord({ ...newRecord, ttl: parseInt(e.target.value) || 3600 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {getRecordTypeInfo(newRecord.type)?.priority && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <input
                        type="number"
                        value={newRecord.priority || ''}
                        onChange={(e) => setNewRecord({ ...newRecord, priority: parseInt(e.target.value) || undefined })}
                        placeholder="e.g., 10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRecord}
                    disabled={isSaving}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Add Record
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* DNS Records Table */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading DNS records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No DNS Records</h3>
                <p className="text-gray-500 mb-4">Add your first DNS record to get started</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Record
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TTL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.map((record, index) => (
                      <motion.tr
                        key={record.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {record.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.name || '@'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={record.value}>
                            {record.value}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.ttl}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.priority || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingRecord(record)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Record"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => record.id && handleDeleteRecord(record.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Panel - Nameservers */}
          <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Nameservers</h4>
              <button
                onClick={() => setShowNameserverForm(!showNameserverForm)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </button>
            </div>

            {/* Current Nameservers */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Current Nameservers</h5>
              <div className="space-y-2">
                {nameservers.map((ns, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Server className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{ns}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nameserver Management Form */}
            {showNameserverForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <h5 className="text-sm font-medium text-gray-900 mb-4">Nameserver Options</h5>

                <div className="space-y-4">
                  <button
                    onClick={handleSetDefaultNameservers}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Setting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Use Default Nameservers
                      </>
                    )}
                  </button>

                  <div className="border-t pt-4">
                    <h6 className="text-sm font-medium text-gray-700 mb-3">Custom Nameservers</h6>
                    <div className="space-y-2">
                      {customNameservers.map((ns, index) => (
                        <input
                          key={index}
                          type="text"
                          value={ns}
                          onChange={(e) => {
                            const newNS = [...customNameservers];
                            newNS[index] = e.target.value;
                            setCustomNameservers(newNS);
                          }}
                          placeholder={`Nameserver ${index + 1}`}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleSetCustomNameservers}
                      disabled={isSaving}
                      className="w-full mt-3 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Setting...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Set Custom Nameservers
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Help Section */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Need Help?</h5>
              <p className="text-xs text-blue-700 mb-3">
                DNS changes can take up to 48 hours to propagate worldwide.
              </p>
              <div className="space-y-1 text-xs text-blue-700">
                <p>• A records point to IP addresses</p>
                <p>• CNAME records point to domain names</p>
                <p>• MX records are for email servers</p>
                <p>• TXT records store text data</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
