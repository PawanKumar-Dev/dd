'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLogout } from '@/lib/logout';
import {
  User, Mail, Phone, MapPin, Shield, Key, Save,
  Eye, EyeOff, Calendar, Globe, CreditCard, AlertCircle, Building
} from 'lucide-react';
import toast from 'react-hot-toast';
import UserLayout from '@/components/user/UserLayout';
import { PageLoading } from '@/components/user/LoadingComponents';
import ClientOnly from '@/components/ClientOnly';

interface User {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  phone?: string;
  phoneCc?: string;
  companyName?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    country?: string;
    zipcode?: string;
  };
  profileCompleted?: boolean;
}

interface UserSettings {
  security: {};
}

export default function UserSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const userObj = JSON.parse(userData);

    if (userObj.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    setUser(userObj);
    loadSettings();
  }, [router]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch actual settings data
      try {
        const token = localStorage.getItem('token');
        if (!token) {

          setSettings({} as any);
          return;
        }

        const response = await fetch('/api/user/settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSettings(data);

          // Update user data with profile information
          if (data.profile) {
            setUser(prev => prev ? { ...prev, ...data.profile } : null);
          }
        } else {
          // Use default settings
          setSettings({} as any);
        }
      } catch (error) {

        // Use default settings
        setSettings({
          notifications: {
            email: true,
            sms: false,
            domainExpiry: true,
            paymentReminders: true
          }
        } as any);
      }
    } catch (error) {

      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = useLogout();

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Settings saved successfully');
    } catch (error) {

      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const checkProfileCompletion = (userData: Partial<User>): boolean => {
    // Check if all required fields are filled
    const hasPhone = !!(userData.phone && userData.phone.trim() !== '');
    const hasPhoneCc = !!(userData.phoneCc && userData.phoneCc.trim() !== '');
    const hasCompanyName = !!(userData.companyName && userData.companyName.trim() !== '');
    const hasAddress = !!(userData.address?.line1 && userData.address.line1.trim() !== '');
    const hasCity = !!(userData.address?.city && userData.address.city.trim() !== '');
    const hasState = !!(userData.address?.state && userData.address.state.trim() !== '');
    const hasCountry = !!(userData.address?.country && userData.address.country.trim() !== '');
    const hasZipcode = !!(userData.address?.zipcode && userData.address.zipcode.trim() !== '');

    return hasPhone && hasPhoneCc && hasCompanyName && hasAddress && hasCity && hasState && hasCountry && hasZipcode;
  };

  const handleUpdateProfile = async (updatedUser: Partial<User>) => {
    try {
      setIsSaving(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token available');
        return;
      }

      // Ensure phoneCc and country are set for India-only service
      const profileData = {
        ...updatedUser,
        phoneCc: '+91', // Always set to India
        address: {
          ...updatedUser.address,
          country: 'IN' // Always set to India
        }
      };

      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: profileData
        })
      });

      if (response.ok) {
        // Check if all required fields are filled for profile completion
        const isProfileComplete = checkProfileCompletion(profileData);

        const updatedUserData = {
          ...user,
          ...profileData,
          profileCompleted: isProfileComplete,
          email: profileData.email || user?.email || '',
          firstName: profileData.firstName || user?.firstName || '',
          lastName: profileData.lastName || user?.lastName || ''
        };
        setUser(updatedUserData);

        // Update localStorage with the updated user data
        localStorage.setItem('user', JSON.stringify(updatedUserData));

        // Trigger a custom event to notify other components of profile update
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: { user: updatedUserData, isComplete: isProfileComplete }
        }));

        if (isProfileComplete) {
          toast.success('Profile completed successfully!');
        } else {
          toast.success('Profile updated successfully');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update profile');
      }
    } catch (error) {

      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <PageLoading page="settings" />;
  }

  if (isLoading) {
    return (
      <UserLayout user={user} onLogout={handleLogout}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </UserLayout>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield }
  ];

  return (
    <ClientOnly>
      <UserLayout user={user} onLogout={handleLogout}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h1>
            <p className="text-gray-600">
              Manage your account information and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={user.firstName}
                            onChange={(e) => setUser(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={user.lastName}
                            onChange={(e) => setUser(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Name
                          </label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              value={user.companyName || ''}
                              onChange={(e) => setUser(prev => prev ? { ...prev, companyName: e.target.value } : null)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter your company name"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <div className="flex">
                            <div className="px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-gray-700 font-medium">
                              🇮🇳 +91 (India)
                            </div>
                            <div className="relative flex-1">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="tel"
                                value={user.phone || ''}
                                onChange={(e) => setUser(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your phone number"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address Line 1
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <textarea
                            value={user.address?.line1 || ''}
                            onChange={(e) => setUser(prev => prev ? {
                              ...prev,
                              address: {
                                ...prev.address,
                                line1: e.target.value
                              }
                            } : null)}
                            rows={3}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your address"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={user.address?.city || ''}
                            onChange={(e) => setUser(prev => prev ? {
                              ...prev,
                              address: {
                                ...prev.address,
                                city: e.target.value
                              }
                            } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your city"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            value={user.address?.state || ''}
                            onChange={(e) => setUser(prev => prev ? {
                              ...prev,
                              address: {
                                ...prev.address,
                                state: e.target.value
                              }
                            } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your state"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                          </label>
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
                            🇮🇳 India
                          </div>
                          <input type="hidden" value="IN" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            value={user.address?.zipcode || ''}
                            onChange={(e) => setUser(prev => prev ? {
                              ...prev,
                              address: {
                                ...prev.address,
                                zipcode: e.target.value
                              }
                            } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your ZIP code"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={() => handleUpdateProfile(user)}
                        disabled={isSaving}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}


                {/* Security Tab */}
                {activeTab === 'security' && settings && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>

                    <div className="space-y-6">
                      <div className="border-t pt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Change Password</h4>
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Current Password
                            </label>
                            <div className="relative">
                              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type={showPassword ? 'text' : 'password'}
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter current password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              New Password
                            </label>
                            <input
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter new password"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Confirm new password"
                            />
                          </div>
                        </form>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Settings
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </UserLayout>
    </ClientOnly>
  );
}
