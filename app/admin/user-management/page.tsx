'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, MoreVertical, Trash2, Eye, RefreshCw, Key } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayoutNew';
import AdminDataTable from '@/components/admin/AdminDataTable';
import Modal from '@/components/Modal';
import { formatIndianDate, formatIndianLongDateTime } from '@/lib/dateUtils';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  isActive?: boolean;
}

export default function AdminUsers() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
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
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Get token from localStorage or cookies
      const getCookieValue = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const token = getCookieValue('token') || localStorage.getItem('token');

      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch users:', errorData);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedEmail');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };

  const handleViewUser = (userId: string) => {
    const userToView = users.find(u => u._id === userId);
    if (userToView) {
      setSelectedUser(userToView);
      setIsModalOpen(true);
    }
  };

  const handleResetPassword = (userId: string) => {
    const userToReset = users.find(u => u._id === userId);
    if (userToReset) {
      setPasswordResetUser(userToReset);
      setNewPassword('');
      setConfirmPassword('');
      setSendEmailNotification(true);
      setIsPasswordResetModalOpen(true);
    }
  };

  const handlePasswordResetSubmit = async () => {
    if (!passwordResetUser) return;

    if (!newPassword || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setIsResettingPassword(true);

    try {
      const getCookieValue = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const token = getCookieValue('token') || localStorage.getItem('token');

      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: passwordResetUser._id,
          newPassword,
          sendEmail: sendEmailNotification,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Password reset successfully! ${data.emailSent ? 'Email notification sent to user.' : 'Email notification was not sent.'}`);
        setIsPasswordResetModalOpen(false);
        setPasswordResetUser(null);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        alert(`Failed to reset password: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handlePasswordResetCancel = () => {
    setIsPasswordResetModalOpen(false);
    setPasswordResetUser(null);
    setNewPassword('');
    setConfirmPassword('');
    setSendEmailNotification(true);
  };


  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Get token
      const getCookieValue = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const token = getCookieValue('token') || localStorage.getItem('token');

      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Reload users to reflect changes
        loadUsers();
        alert('User deleted successfully');
      } else {
        const error = await response.json();
        alert(`Failed to delete user: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value: any, row: User) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {row.firstName} {row.lastName}
          </div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          user
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: any, row: User) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
          {row.isActive ? 'active' : 'inactive'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      render: (value: string) => {
        if (!value) {
          return <span className="text-sm text-gray-400">-</span>;
        }

        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return <span className="text-sm text-gray-400">-</span>;
        }

        return (
          <span className="text-sm text-gray-600">
            {formatIndianDate(date)}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: User) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewUser(row._id)}
            className="text-gray-400 hover:text-gray-600"
            title="View User"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleResetPassword(row._id)}
            className="text-gray-400 hover:text-blue-600"
            title="Reset Password"
          >
            <Key className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteUser(row._id)}
            className="text-gray-400 hover:text-red-600"
            title="Delete User"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // Don't render anything until user is loaded
  if (!user || isLoading) {
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
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user accounts and permissions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadUsers}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Users Table */}
        <AdminDataTable
          title="All Users"
          columns={columns}
          data={users}
          searchable={true}
          pagination={true}
          pageSize={10}
        />
      </div>

      {/* User Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="User Details"
      >
        {selectedUser ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Email Address</label>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {selectedUser.role}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Account Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${selectedUser.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Registration Date</label>
                <p className="text-lg font-semibold text-gray-900">
                  {formatIndianLongDateTime(selectedUser.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">No user selected</p>
          </div>
        )}
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={isPasswordResetModalOpen}
        onClose={handlePasswordResetCancel}
        title="Reset User Password"
      >
        {passwordResetUser ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-yellow-800 text-xs font-bold">!</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Reset Password for {passwordResetUser.firstName} {passwordResetUser.lastName}
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    This will change the user's password and optionally send them an email notification.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={sendEmailNotification}
                  onChange={(e) => setSendEmailNotification(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-700">
                  Send email notification to user with new password
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handlePasswordResetCancel}
                disabled={isResettingPassword}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordResetSubmit}
                disabled={isResettingPassword || !newPassword || !confirmPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResettingPassword ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">No user selected</p>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
