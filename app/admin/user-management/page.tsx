'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, MoreVertical, Trash2, Eye, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayoutNew';
import AdminDataTable from '@/components/admin/AdminDataTable';
import Modal from '@/components/Modal';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
  isActive?: boolean;
}

export default function AdminUsers() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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
      key: 'lastLogin',
      label: 'Last Login',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {value || 'Never'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </span>
      )
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
                  {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Last Login</label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedUser.lastLogin
                    ? new Date(selectedUser.lastLogin).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    : 'Never logged in'
                  }
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
    </AdminLayout>
  );
}
