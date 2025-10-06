'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Save, Eye, EyeOff, Settings, TestTube } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayoutNew';
import AdminPasswordReset from '@/components/AdminPasswordReset';
import TestingModeToggle from '@/components/admin/TestingModeToggle';

export default function AdminSettings() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('security');
  const router = useRouter();

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
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedEmail');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };

  const tabs = [
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'testing', name: 'Testing Mode', icon: TestTube },
    { id: 'general', name: 'General', icon: Settings },
  ];

  if (isLoading) {
    return (
      <AdminLayout user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your admin account and system settings</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Password Reset */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Password Management</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Change your admin password. This is the only way to reset the admin password for security reasons.
                </p>
                <AdminPasswordReset />
              </div>

            </div>
          )}

          {activeTab === 'testing' && (
            <div className="space-y-6">
              <TestingModeToggle />
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                <p className="text-sm text-gray-600">General system settings will be implemented here.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}
