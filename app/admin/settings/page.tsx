'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings,
  Server,
  Wifi,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import AdminLayoutNew from '@/components/admin/AdminLayoutNew';
import { formatIndianTime } from '@/lib/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface IPData {
  success: boolean;
  message: string;
  data?: {
    primaryIP: string;
    allIPs: string[];
    timestamp: string;
    services: Record<string, any>;
    serverInfo?: {
      userAgent?: string;
      host?: string;
      forwarded?: string;
      realIP?: string;
    };
  };
  error?: string;
  lastChecked?: string;
  checkedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function AdminSettings() {
  const router = useRouter();
  const [ipData, setIpData] = useState<IPData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [user, setUser] = useState<{ firstName: string; lastName: string; role: string } | null>(null);

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
    loadSavedIPData();
  }, [router]);

  const loadSavedIPData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/ip-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIpData(data);
        if (data.lastChecked) {
          setLastChecked(new Date(data.lastChecked));
        }
      }
    } catch (error) {
      console.error('Error loading saved IP data:', error);
    }
  };

  const fetchOutboundIP = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/check-ip', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setIpData(data);
      setLastChecked(new Date());

      if (data.success) {
        toast.success('Outbound IP checked and saved successfully');
      } else {
        toast.error('Failed to check outbound IP');
      }
    } catch (error) {
      console.error('Error fetching IP:', error);
      toast.error('Network error while checking IP');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('IP address copied to clipboard');
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Redirect to login page
    router.push('/');
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-yellow-500';
    if (!ipData?.success) return 'bg-red-500';
    if (ipData?.data?.allIPs && ipData.data.allIPs.length > 1) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (!ipData?.success) return <AlertTriangle className="h-4 w-4" />;
    if (ipData?.data?.allIPs && ipData.data.allIPs.length > 1) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  // Don't render anything until user is loaded
  if (!user) {
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
    <AdminLayoutNew user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="h-8 w-8 text-blue-600" />
                Admin Settings
              </h1>
              <p className="text-gray-600 mt-2">
                Manage system settings and server information
              </p>
            </div>
          </div>
        </div>


        {/* Server Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              Server Information
            </CardTitle>
            <CardDescription>
              Check your server's outbound IP address and network status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* IP Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge className={`${getStatusColor()} text-white`}>
                  {getStatusIcon()}
                  <span className="ml-1">
                    {isLoading ? 'Checking...' :
                      !ipData?.success ? 'Error' :
                        ipData?.data?.allIPs && ipData.data.allIPs.length > 1 ? 'Multiple IPs' :
                          'Connected'}
                  </span>
                </Badge>
                <div>
                  <p className="font-medium text-gray-900">
                    {ipData?.data?.primaryIP || 'No IP detected'}
                  </p>
                  {lastChecked && (
                    <p className="text-sm text-gray-500">
                      Last checked: {formatIndianTime(lastChecked)}
                    </p>
                  )}
                  {ipData?.checkedBy && (
                    <p className="text-sm text-gray-500">
                      Checked by: {ipData.checkedBy.firstName} {ipData.checkedBy.lastName}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={fetchOutboundIP}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Checking...' : 'Check IP'}
              </Button>
            </div>

            {/* IP Details */}
            {ipData?.success && ipData.data && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Primary IP */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">Primary Outbound IP</h4>
                      <p className="text-2xl font-mono text-blue-800 mt-1">
                        {ipData.data?.primaryIP || 'N/A'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(ipData.data?.primaryIP || '')}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>

                {/* All IPs */}
                {ipData.data.allIPs.length > 1 && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">All Detected IPs</h4>
                    <div className="flex flex-wrap gap-2">
                      {ipData.data.allIPs.map((ip, index) => (
                        <Badge key={index} variant="outline" className="font-mono">
                          {ip}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Results */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Service Results</h4>
                  <div className="space-y-2">
                    {Object.entries(ipData.data.services).map(([service, result]: [string, any]) => (
                      <div key={service} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-gray-600 truncate flex-1">
                          {service.replace('https://', '').replace('?format=json', '')}
                        </span>
                        <div className="flex items-center gap-2">
                          {result.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`font-mono ${result.status === 'success' ? 'text-green-700' : 'text-red-700'
                            }`}>
                            {result.status === 'success' ? result.ip : 'Failed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Server Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Server Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">User Agent:</span>
                      <p className="font-mono text-gray-800 break-all">
                        {ipData.data.serverInfo?.userAgent || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Host:</span>
                      <p className="font-mono text-gray-800">
                        {ipData.data.serverInfo?.host || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Forwarded For:</span>
                      <p className="font-mono text-gray-800">
                        {ipData.data.serverInfo?.forwarded || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Real IP:</span>
                      <p className="font-mono text-gray-800">
                        {ipData.data.serverInfo?.realIP || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {ipData && !ipData.success && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 bg-red-50 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h4 className="font-semibold text-red-900">Error</h4>
                </div>
                <p className="text-red-700 mb-2">{ipData.message || ipData.error || 'Failed to fetch outbound IP'}</p>
                {ipData.checkedBy && (
                  <p className="text-sm text-red-600">
                    Last checked by: {ipData.checkedBy.firstName} {ipData.checkedBy.lastName}
                  </p>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayoutNew>
  );
}
