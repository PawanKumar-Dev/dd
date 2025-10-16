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

interface StatusSummary {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminPendingDomainsPage() {
  const router = useRouter();
  const [pendingDomains, setPendingDomains] = useState<PendingDomain[]>([]);
  const [statusSummary, setStatusSummary] = useState<StatusSummary>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
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

  // Fetch pending domains
  const fetchPendingDomains = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(selectedStatus !== "all" && { status: selectedStatus }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/pending-domains?${params}`);
      const data = await response.json();

      if (data.success) {
        setPendingDomains(data.pendingDomains);
        setStatusSummary(data.statusSummary);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to fetch pending domains");
      }
    } catch (error) {
      console.error("Error fetching pending domains:", error);
      toast.error("Failed to fetch pending domains");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDomains();
  }, [pagination.page, selectedStatus, searchTerm]);

  // Handle domain registration
  const handleRegisterDomain = async (domainId: string) => {
    try {
      setActionLoading(domainId);
      const response = await fetch(`/api/admin/pending-domains/${domainId}/register`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Domain registered successfully");
        fetchPendingDomains();
      } else {
        toast.error(data.message || "Failed to register domain");
      }
    } catch (error) {
      console.error("Error registering domain:", error);
      toast.error("Failed to register domain");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle domain verification
  const handleVerifyDomains = async (domainIds: string[]) => {
    try {
      setActionLoading("verify");
      const response = await fetch("/api/admin/pending-domains/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domainIds }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Verified ${data.summary.total} domains`);
        fetchPendingDomains();
      } else {
        toast.error("Failed to verify domains");
      }
    } catch (error) {
      console.error("Error verifying domains:", error);
      toast.error("Failed to verify domains");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle status update
  const handleUpdateStatus = async (domainId: string, status: string) => {
    try {
      setActionLoading(domainId);
      const response = await fetch(`/api/admin/pending-domains/${domainId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes[domainId],
        }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Domain status updated successfully");
        fetchPendingDomains();
      } else {
        toast.error("Failed to update domain status");
      }
    } catch (error) {
      console.error("Error updating domain status:", error);
      toast.error("Failed to update domain status");
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
      const response = await fetch(`/api/admin/pending-domains/${domainId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Domain deleted successfully");
        fetchPendingDomains();
      } else {
        toast.error("Failed to delete domain");
      }
    } catch (error) {
      console.error("Error deleting domain:", error);
      toast.error("Failed to delete domain");
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pending Domains Management
        </h1>
        <p className="text-gray-600">
          Manage domains that failed registration due to insufficient funds or other issues
        </p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-gray-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{statusSummary.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{statusSummary.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <RefreshCw className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Processing</p>
              <p className="text-2xl font-bold text-blue-600">{statusSummary.processing}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{statusSummary.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600">{statusSummary.failed}</p>
            </div>
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
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
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
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading pending domains...</p>
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
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {domain.status === "pending" && (
                          <button
                            onClick={() => handleRegisterDomain(domain._id)}
                            disabled={actionLoading === domain._id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDomain(domain._id)}
                          disabled={actionLoading === domain._id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
  );
}
