"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Plus,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  Mail,
  Phone,
  Building,
} from "lucide-react";
import AdminLayoutNew from "@/components/admin/AdminLayoutNew";

interface PendingDomain {
  _id: string;
  domainName: string;
  price: number;
  currency: string;
  registrationPeriod: number;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName: string;
  };
  orderId: string;
  customerId: number;
  contactId: number;
  nameServers?: string[];
  adminContactId?: number;
  techContactId?: number;
  billingContactId?: number;
  status: "pending" | "processing" | "completed" | "failed";
  reason: string;
  verificationAttempts: number;
  lastVerifiedAt?: string;
  registeredAt?: string;
  expiresAt?: string;
  resellerClubOrderId?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminPendingDomainsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDomains, setPendingDomains] = useState<PendingDomain[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  // Helper function to get authentication token
  const getAuthToken = () => {
    const getCookieValue = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    return getCookieValue('token') || localStorage.getItem('token');
  };

  // Helper function to handle authentication errors
  const handleAuthError = (status: number) => {
    if (status === 401) {
      toast.error("Session expired. Please login again.");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
      return true;
    }
    if (status === 403) {
      toast.error("Access denied. Admin privileges required.");
      router.push('/dashboard');
      return true;
    }
    return false;
  };

  // Authentication check
  useEffect(() => {
    const token = getAuthToken();
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

  // Fetch pending domains
  const fetchPendingDomains = async () => {
    try {
      setLoading(true);

      const token = getAuthToken();

      // If no token, redirect to login
      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(selectedStatus !== "all" && { status: selectedStatus }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/pending-domains?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Handle authentication errors
      if (handleAuthError(response.status)) {
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        setPendingDomains(data.pendingDomains);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || "Failed to fetch pending domains");
      }
    } catch (error) {
      // Only log generic error message, don't expose details
      toast.error("Unable to load pending domains. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user is authenticated
    if (!isLoading && user) {
      fetchPendingDomains();
    }
  }, [pagination.page, selectedStatus, searchTerm, user, isLoading]);

  // Handle domain registration
  const handleRegisterDomain = async (domainId: string) => {
    try {
      setActionLoading(domainId);
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/admin/pending-domains/${domainId}/register`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (handleAuthError(response.status)) {
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Domain registered successfully");
        fetchPendingDomains();
      } else {
        toast.error(data.message || data.error || "Failed to register domain");
      }
    } catch (error) {
      toast.error("Unable to register domain. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle domain verification
  const handleVerifyDomains = async (domainIds: string[]) => {
    try {
      setActionLoading("verify");
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch("/api/admin/pending-domains/verify", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domainIds }),
      });

      if (handleAuthError(response.status)) {
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Verified ${data.summary.total} domains`);
        fetchPendingDomains();
      } else {
        toast.error(data.error || "Failed to verify domains");
      }
    } catch (error) {
      toast.error("Unable to verify domains. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle status update
  const handleUpdateStatus = async (domainId: string, status: string) => {
    try {
      setActionLoading(domainId);
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/admin/pending-domains/${domainId}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes[domainId],
        }),
      });

      if (handleAuthError(response.status)) {
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Domain status updated successfully");
        fetchPendingDomains();
      } else {
        toast.error(data.error || "Failed to update domain status");
      }
    } catch (error) {
      toast.error("Unable to update domain status. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle domain deletion
  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm("Are you sure you want to delete this pending domain?")) {
      return;
    }

    try {
      setActionLoading(domainId);
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/admin/pending-domains/${domainId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (handleAuthError(response.status)) {
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Domain deleted successfully");
        fetchPendingDomains();
      } else {
        toast.error(data.error || "Failed to delete domain");
      }
    } catch (error) {
      toast.error("Unable to delete domain. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
    <AdminLayoutNew user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                Pending Domains Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage domains that failed registration due to insufficient funds or other issues
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white p-4 rounded-lg shadow border mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search domains or order IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {selectedDomains.length > 0 && (
                <button
                  onClick={() => handleVerifyDomains(selectedDomains)}
                  disabled={actionLoading === "verify"}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${actionLoading === "verify" ? "animate-spin" : ""}`} />
                  Verify Selected ({selectedDomains.length})
                </button>
              )}
              <button
                onClick={fetchPendingDomains}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Pending Domains Table */}
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <RefreshCw className="h-10 w-10 animate-spin mx-auto text-blue-600 mb-3" />
                <p className="text-gray-600">Loading pending domains...</p>
              </div>
            </div>
          ) : pendingDomains.length === 0 ? (
            <div className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No pending domains found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedDomains.length === pendingDomains.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDomains(pendingDomains.map(d => d._id));
                          } else {
                            setSelectedDomains([]);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingDomains.map((domain) => (
                    <>
                      <tr key={domain._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedDomains.includes(domain._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDomains([...selectedDomains, domain._id]);
                              } else {
                                setSelectedDomains(selectedDomains.filter(id => id !== domain._id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {domain.domainName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Order: {domain.orderId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {domain.userId.firstName} {domain.userId.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {domain.userId.email}
                            </div>
                            {domain.userId.companyName && (
                              <div className="text-sm text-gray-500">
                                {domain.userId.companyName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(domain.status)}`}>
                            {getStatusIcon(domain.status)}
                            <span className="ml-1 capitalize">{domain.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {domain.currency} {domain.price}
                          </div>
                          <div className="text-sm text-gray-500">
                            {domain.registrationPeriod} year{domain.registrationPeriod > 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(domain.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowDetails(showDetails === domain._id ? null : domain._id)}
                              title="View Details"
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            {domain.status === "pending" && (
                              <button
                                onClick={() => handleRegisterDomain(domain._id)}
                                disabled={actionLoading === domain._id}
                                title="Register Domain"
                                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteDomain(domain._id)}
                              disabled={actionLoading === domain._id}
                              title="Delete Domain"
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {showDetails === domain._id && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="space-y-4">
                              <h3 className="font-semibold text-gray-900 text-lg mb-3">Domain Details</h3>

                              <div className="grid grid-cols-2 gap-4">
                              {/* Customer Information */}
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                  <User className="h-4 w-4 text-blue-600" />
                                  Customer Information
                                </h4>
                                {domain.userId && typeof domain.userId === 'object' ? (
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Name:</span>
                                      <span className="font-medium">
                                        {domain.userId.firstName || 'N/A'} {domain.userId.lastName || ''}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Email:</span>
                                      <span className="font-medium">{domain.userId.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Phone:</span>
                                      <span className="font-medium">{domain.userId.phone || 'N/A'}</span>
                                    </div>
                                    {domain.userId.companyName && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Company:</span>
                                        <span className="font-medium">{domain.userId.companyName}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500">
                                    <p className="mb-2">User ID: {typeof domain.userId === 'string' ? domain.userId : 'N/A'}</p>
                                    <p className="text-xs text-orange-600">⚠️ User information not populated. User ID may be invalid or user may have been deleted.</p>
                                  </div>
                                )}
                              </div>

                                {/* Order Information */}
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    Order Information
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Order ID:</span>
                                      <span className="font-mono font-medium">{domain.orderId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Customer ID:</span>
                                      <span className="font-medium">{domain.customerId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Contact ID:</span>
                                      <span className="font-medium">{domain.contactId}</span>
                                    </div>
                                    {domain.resellerClubOrderId && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">RC Order ID:</span>
                                        <span className="font-mono font-medium">{domain.resellerClubOrderId}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Technical Details */}
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    Technical Details
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    {domain.nameServers && domain.nameServers.length > 0 && (
                                      <div>
                                        <span className="text-gray-600 block mb-1">Name Servers:</span>
                                        <div className="pl-2 space-y-1">
                                          {domain.nameServers.map((ns, idx) => (
                                            <div key={idx} className="font-mono text-xs">{ns}</div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {domain.adminContactId && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Admin Contact ID:</span>
                                        <span className="font-medium">{domain.adminContactId}</span>
                                      </div>
                                    )}
                                    {domain.techContactId && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Tech Contact ID:</span>
                                        <span className="font-medium">{domain.techContactId}</span>
                                      </div>
                                    )}
                                    {domain.billingContactId && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Billing Contact ID:</span>
                                        <span className="font-medium">{domain.billingContactId}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Status & History */}
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-purple-600" />
                                    Status & History
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Verification Attempts:</span>
                                      <span className="font-medium">{domain.verificationAttempts}</span>
                                    </div>
                                    {domain.lastVerifiedAt && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Last Verified:</span>
                                        <span className="font-medium">{new Date(domain.lastVerifiedAt).toLocaleString()}</span>
                                      </div>
                                    )}
                                    {domain.registeredAt && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Registered At:</span>
                                        <span className="font-medium">{new Date(domain.registeredAt).toLocaleString()}</span>
                                      </div>
                                    )}
                                    {domain.expiresAt && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Expires At:</span>
                                        <span className="font-medium">{new Date(domain.expiresAt).toLocaleString()}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Failure Reason */}
                              {domain.reason && (
                                <div className="bg-white p-4 rounded-lg border border-red-200">
                                  <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Failure Reason
                                  </h4>
                                  <p className="text-sm text-red-700">{domain.reason}</p>
                                </div>
                              )}

                              {/* Admin Notes */}
                              {domain.adminNotes && (
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
                                  <p className="text-sm text-gray-700">{domain.adminNotes}</p>
                                </div>
                              )}

                              {/* Timestamps */}
                              <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                                <span>Created: {new Date(domain.createdAt).toLocaleString()}</span>
                                <span>Updated: {new Date(domain.updatedAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutNew>
  );
}
