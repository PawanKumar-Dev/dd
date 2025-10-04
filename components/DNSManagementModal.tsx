'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DNSRecord {
  id?: string;
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

interface DNSManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainName: string;
  isTestingMode: boolean;
}

export default function DNSManagementModal({
  isOpen,
  onClose,
  domainName,
  isTestingMode
}: DNSManagementModalProps) {
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);
  const [newRecord, setNewRecord] = useState<DNSRecord>({
    type: 'A',
    name: '',
    value: '',
    ttl: 3600,
    priority: undefined,
  });

  const recordTypes = [
    { value: 'A', label: 'A (IPv4 Address)' },
    { value: 'AAAA', label: 'AAAA (IPv6 Address)' },
    { value: 'CNAME', label: 'CNAME (Canonical Name)' },
    { value: 'MX', label: 'MX (Mail Exchange)' },
    { value: 'TXT', label: 'TXT (Text Record)' },
    { value: 'NS', label: 'NS (Name Server)' },
    { value: 'SRV', label: 'SRV (Service Record)' },
  ];

  useEffect(() => {
    if (isOpen) {
      loadDNSRecords();
    }
  }, [isOpen, domainName]);

  const loadDNSRecords = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/domains/dns?domainName=${encodeURIComponent(domainName)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-testing-mode': isTestingMode.toString(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to load DNS records');
      }
    } catch (error) {
      console.error('Error loading DNS records:', error);
      toast.error('Failed to load DNS records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!newRecord.name || !newRecord.value) {
      toast.error('Name and value are required');
      return;
    }

    setIsAdding(true);
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
        loadDNSRecords();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add DNS record');
      }
    } catch (error) {
      console.error('Error adding DNS record:', error);
      toast.error('Failed to add DNS record');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateRecord = async (record: DNSRecord) => {
    if (!record.id) return;

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
        loadDNSRecords();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update DNS record');
      }
    } catch (error) {
      console.error('Error updating DNS record:', error);
      toast.error('Failed to update DNS record');
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this DNS record?')) {
      return;
    }

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
        loadDNSRecords();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete DNS record');
      }
    } catch (error) {
      console.error('Error deleting DNS record:', error);
      toast.error('Failed to delete DNS record');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">DNS Management</h2>
            <p className="text-gray-600 mt-1">{domainName}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadDNSRecords}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh DNS Records"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Add New Record */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New DNS Record</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newRecord.type}
                  onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {recordTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newRecord.name}
                  onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                  placeholder="@ or subdomain"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input
                  type="text"
                  value={newRecord.value}
                  onChange={(e) => setNewRecord({ ...newRecord, value: e.target.value })}
                  placeholder="IP address or hostname"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TTL</label>
                <input
                  type="number"
                  value={newRecord.ttl}
                  onChange={(e) => setNewRecord({ ...newRecord, ttl: parseInt(e.target.value) || 3600 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddRecord}
                  disabled={isAdding}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAdding ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span className="ml-2">Add</span>
                </button>
              </div>
            </div>
            {newRecord.type === 'MX' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <input
                  type="number"
                  value={newRecord.priority || ''}
                  onChange={(e) => setNewRecord({ ...newRecord, priority: parseInt(e.target.value) || undefined })}
                  placeholder="10"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* DNS Records List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current DNS Records</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading DNS records...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No DNS records found for this domain.</p>
                <p className="text-sm">Add your first DNS record above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TTL</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.map((record, index) => (
                      <tr key={index}>
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
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingRecord(record)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Edit Record"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.id || index.toString())}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
