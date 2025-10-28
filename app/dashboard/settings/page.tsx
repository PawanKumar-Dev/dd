'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { performLogout } from '@/lib/logout';
import {
  User, Mail, Phone, MapPin, Shield, Key, Save,
  Eye, EyeOff, Calendar, Globe, CreditCard, AlertCircle, Building, Navigation
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
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [hasExistingPassword, setHasExistingPassword] = useState(true);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
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

          // Update user data with profile information - map flat structure to nested
          if (data.profile) {
            setUser(prev => prev ? {
              ...prev,
              firstName: data.profile.firstName || prev.firstName,
              lastName: data.profile.lastName || prev.lastName,
              email: data.profile.email || prev.email,
              phone: data.profile.phone || prev.phone,
              phoneCc: prev.phoneCc || '+91',
              companyName: data.profile.company || prev.companyName,
              address: {
                line1: data.profile.address || prev.address?.line1 || '',
                city: data.profile.city || prev.address?.city || '',
                state: data.profile.state || prev.address?.state || '',
                country: data.profile.country || prev.address?.country || 'IN',
                zipcode: data.profile.zipCode || prev.address?.zipcode || '',
              }
            } : null);
          }
        } else {
          // Use default settings
          setSettings({} as any);
        }

        // Check if user has existing password (credential user vs social login)
        // Also refresh complete user data from database
        const meResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        if (meResponse.ok) {
          const meData = await meResponse.json();

          // Check if user has a password - the API returns password as a boolean
          // Allow all users to set/change password regardless of login method
          const hasPassword = meData.user?.password === true;

          setHasExistingPassword(hasPassword);

          // Update user state with complete data from database
          if (meData.user) {
            setUser(prev => ({
              ...prev,
              ...meData.user,
              // Ensure id is set
              id: meData.user.id || prev?.id,
            }));

            // Update localStorage with fresh data
            localStorage.setItem('user', JSON.stringify({
              ...JSON.parse(localStorage.getItem('user') || '{}'),
              ...meData.user,
            }));
          }
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

  // Use performLogout directly - always available

  const handleChangePassword = async () => {
    try {
      // Validate passwords
      if (!hasExistingPassword && !passwordData.newPassword) {
        toast.error('Please enter a new password');
        return;
      }

      if (hasExistingPassword && !passwordData.currentPassword) {
        toast.error('Please enter your current password');
        return;
      }

      if (!passwordData.newPassword) {
        toast.error('Please enter a new password');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      setIsSaving(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token available');
        return;
      }

      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: {
            currentPassword: hasExistingPassword ? passwordData.currentPassword : undefined,
            newPassword: passwordData.newPassword
          }
        })
      });

      if (response.ok) {
        toast.success(hasExistingPassword ? 'Password changed successfully' : 'Password set successfully! You can now login with email and password.');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setHasExistingPassword(true);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to update password');
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

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsDetectingLocation(true);
    const loadingToast = toast.loading('Detecting your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Use Nominatim reverse geocoding API (free and no API key required)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Excel Technologies Domain Management' // Required by Nominatim
              }
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch address details');
          }

          const data = await response.json();
          const address = data.address;

          // Extract address components
          const line1 = [
            address.house_number,
            address.road || address.street,
            address.neighbourhood || address.suburb
          ].filter(Boolean).join(', ');

          const city = address.city || address.town || address.village || address.municipality || '';
          const state = address.state || '';
          const zipcode = address.postcode || '';

          // Update user state with detected location
          setUser(prev => prev ? {
            ...prev,
            address: {
              ...prev.address,
              line1: line1 || prev.address?.line1 || '',
              city: city || prev.address?.city || '',
              state: state || prev.address?.state || '',
              zipcode: zipcode || prev.address?.zipcode || '',
              country: 'IN' // Keep India as default
            }
          } : null);

          toast.success('Location detected and address filled!', { id: loadingToast });
        } catch (error) {
          toast.error('Failed to get address details from location', { id: loadingToast });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        let errorMessage = 'Failed to detect location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        toast.error(errorMessage, { id: loadingToast });
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  if (!user) {
    return <PageLoading page="settings" />;
  }

  if (isLoading) {
    return (
      <UserLayout user={user} onLogout={performLogout}>
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
      <UserLayout user={user} onLogout={performLogout}>
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
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Address Line 1
                          </label>
                          <button
                            type="button"
                            onClick={handleDetectLocation}
                            disabled={isDetectingLocation}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200 hover:border-blue-300"
                          >
                            <Navigation className={`h-3.5 w-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                            {isDetectingLocation ? 'Detecting...' : 'Detect Location'}
                          </button>
                        </div>
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
                            placeholder="Enter your address or use location detection"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Click "Detect Location" to automatically fill your address details
                        </p>
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
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          {hasExistingPassword ? 'Change Password' : 'Set Password'}
                        </h4>
                        {!hasExistingPassword && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                            <div className="flex">
                              <AlertCircle className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-blue-700">
                                  Set a password to enable email/password login in addition to your social login.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {hasExistingPassword && (
                          <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-4">
                            <div className="flex">
                              <AlertCircle className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-600">
                                  Change your account password. You can use either password or social login to access your account.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="space-y-4">
                          {hasExistingPassword && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Password
                              </label>
                              <div className="relative">
                                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={passwordData.currentPassword}
                                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Enter current password"
                                  required
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
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              New Password
                            </label>
                            <input
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter new password (min 6 characters)"
                              required
                              minLength={6}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Confirm new password"
                              required
                            />
                          </div>
                        </form>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={handleChangePassword}
                        disabled={isSaving}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {hasExistingPassword ? 'Changing...' : 'Setting...'}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {hasExistingPassword ? 'Change Password' : 'Set Password'}
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
