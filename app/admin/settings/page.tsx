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
  ArrowRight,
  Loader2
} from 'lucide-react';
import AdminLayoutNew from '@/components/admin/AdminLayoutNew';
import { formatIndianTime } from '@/lib/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [user, setUser] = useState<{ firstName: string; lastName: string; role: string } | null>(null);

  // Cache settings state
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [cacheTTL, setCacheTTL] = useState(60);
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [cacheLoading, setCacheLoading] = useState(false);

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
    loadCacheSettings();
  }, [router]);

  const loadSavedIPData = async () => {
    try {
      setIsInitialLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setIsInitialLoading(false);
        return;
      }

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
    } finally {
      setIsInitialLoading(false);
    }
  };

  const loadCacheSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Load cache status
      const statusResponse = await fetch('/api/admin/tld-pricing/cache', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setCacheStatus(statusData.cache);
        setCacheTTL(statusData.ttl || 60);
      }

      // Load cache enabled setting
      const settingsResponse = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        const cacheEnabledSetting = settingsData.settings?.tld_pricing_cache_enabled;
        if (cacheEnabledSetting !== undefined) {
          setCacheEnabled(cacheEnabledSetting.value !== false);
        }
        const cacheTTLSetting = settingsData.settings?.tld_pricing_cache_ttl;
        if (cacheTTLSetting !== undefined) {
          setCacheTTL(parseInt(cacheTTLSetting.value) || 60);
        }
      }
    } catch (error) {
      console.error('Error loading cache settings:', error);
    }
  };

  const updateCacheSettings = async () => {
    setCacheLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/tld-pricing/cache', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: cacheEnabled,
          ttlMinutes: cacheTTL,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccessToast('Cache settings updated successfully');
        await loadCacheSettings();
      } else {
        showErrorToast('Failed to update cache settings');
      }
    } catch (error) {
      console.error('Error updating cache settings:', error);
      showErrorToast('Failed to update cache settings');
    } finally {
      setCacheLoading(false);
    }
  };

  const purgeCache = async () => {
    setCacheLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/tld-pricing/cache', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showSuccessToast('Cache purged successfully');
        await loadCacheSettings();
      } else {
        showErrorToast('Failed to purge cache');
      }
    } catch (error) {
      console.error('Error purging cache:', error);
      showErrorToast('Failed to purge cache');
    } finally {
      setCacheLoading(false);
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
        showSuccessToast('Outbound IP checked and saved successfully');
      } else {
        showErrorToast('Failed to check outbound IP');
      }
    } catch (error) {
      console.error('Error fetching IP:', error);
      showErrorToast('Network error while checking IP');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccessToast('IP address copied to clipboard');
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
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (!ipData?.success) return <AlertTriangle className="h-4 w-4" />;
    if (ipData?.data?.allIPs && ipData.data.allIPs.length > 1) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  // Don't render anything until user is loaded
  if (!user || isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!user ? 'Loading...' : 'Loading IP data from database...'}
          </p>
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
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking IP...
                      </span>
                    ) : (
                      ipData?.data?.primaryIP || 'No IP detected'
                    )}
                  </p>
                  {lastChecked && !isLoading && (
                    <p className="text-sm text-gray-500">
                      Last checked: {formatIndianTime(lastChecked)}
                    </p>
                  )}
                  {ipData?.checkedBy && !isLoading && (
                    <p className="text-sm text-gray-500">
                      Checked by: {ipData.checkedBy.firstName} {ipData.checkedBy.lastName}
                    </p>
                  )}
                  {isLoading && (
                    <p className="text-sm text-blue-600 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Fetching data from database...
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={fetchOutboundIP}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Check IP
                  </>
                )}
              </Button>
            </div>

            {/* Loading Skeleton */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Primary IP Loading */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">Primary Outbound IP</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <div className="h-8 w-32 bg-blue-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-8 w-16 bg-blue-200 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Service Results Loading */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Service Results</h4>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Server Info Loading */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Server Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i}>
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* IP Details */}
            {ipData?.success && ipData.data && !isLoading && (
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
            {ipData && !ipData.success && !isLoading && (
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

        {/* TLD Pricing Cache Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-600" />
              TLD Pricing Cache
            </CardTitle>
            <CardDescription>
              Configure caching for TLD pricing data to improve performance and reduce API calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cache Status */}
            {cacheStatus && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-purple-900">Cache Status</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      {cacheStatus.isCached ? (
                        <>
                          Active • {cacheStatus.itemCount} TLDs cached •
                          Expires in {Math.floor(cacheStatus.remainingTime / 60)} minutes
                        </>
                      ) : (
                        'No active cache'
                      )}
                    </p>
                  </div>
                  <Badge className={`${cacheStatus.isCached ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                    {cacheStatus.isCached ? 'Cached' : 'Empty'}
                  </Badge>
                </div>

                {cacheStatus.isCached && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-purple-600 font-medium">Cached At</p>
                      <p className="text-purple-900">
                        {new Date(cacheStatus.cachedAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-600 font-medium">Expires At</p>
                      <p className="text-purple-900">
                        {new Date(cacheStatus.expiresAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cache Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Enable Cache</p>
                  <p className="text-sm text-gray-500">Cache TLD pricing data to reduce API calls</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cacheEnabled}
                    onChange={(e) => setCacheEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block">
                  <p className="font-medium text-gray-900 mb-2">Cache TTL (Time To Live)</p>
                  <p className="text-sm text-gray-500 mb-3">How long to cache data before refreshing (in minutes)</p>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={cacheTTL}
                      onChange={(e) => setCacheTTL(parseInt(e.target.value) || 60)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <span className="text-gray-600">minutes</span>
                    <span className="text-sm text-gray-500">
                      ({Math.floor(cacheTTL / 60)} hour{cacheTTL >= 120 ? 's' : ''} {cacheTTL % 60} min)
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={updateCacheSettings}
                disabled={cacheLoading}
                className="flex items-center gap-2"
              >
                {cacheLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>

              <Button
                onClick={purgeCache}
                disabled={cacheLoading || !cacheStatus?.isCached}
                variant="outline"
                className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
              >
                {cacheLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Purging...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Purge Cache
                  </>
                )}
              </Button>

              <Button
                onClick={loadCacheSettings}
                disabled={cacheLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayoutNew>
  );
}
