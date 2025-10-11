/**
 * Admin TLD Pricing Page
 * 
 * This page provides administrators with a comprehensive view of TLD pricing,
 * including both customer and reseller pricing for comparison and margin analysis.
 * 
 * Features:
 * - Live pricing data from ResellerClub API
 * - Customer vs Reseller pricing comparison
 * - Margin calculation and display
 * - TLD categorization and filtering
 * - Data export functionality
 * - Real-time pricing updates
 * 
 * @author Excel Technologies
 * @version 2.0.0
 * @since 2024
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, RefreshCw, Search, Filter, Globe } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayoutNew';
import AdminDataTable from '@/components/admin/AdminDataTable';
import { formatIndianCurrency, formatIndianNumber, formatIndianDateTime } from '@/lib/dateUtils';

/**
 * TLD Pricing Interface
 * 
 * Represents pricing data for a specific TLD, including both customer and reseller pricing
 * along with calculated margin information.
 */
interface TLDPricing {
  tld: string;
  customerPrice: number;
  resellerPrice: number;
  currency: string;
  category: string;
  description?: string;
  margin?: number; // Calculated margin percentage
}

/**
 * TLD Pricing API Response Interface
 * 
 * Represents the response structure from the TLD pricing API endpoint.
 */
interface TLDPricingResponse {
  success: boolean;
  tldPricing: TLDPricing[];
  totalCount: number;
  lastUpdated: string;
  pricingSource: string;
}

/**
 * Admin TLD Pricing Component
 * 
 * Main component for managing and displaying TLD pricing information.
 * Provides administrators with tools to analyze pricing, margins, and TLD performance.
 */
export default function AdminTLDPricing() {
  const [user, setUser] = useState<any>(null);
  const [tldPricing, setTldPricing] = useState<TLDPricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [pricingSource, setPricingSource] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('tld');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [priceRange, setPriceRange] = useState<{ min: number, max: number }>({ min: 0, max: 100000 });
  const [showOnlyWithMargin, setShowOnlyWithMargin] = useState<boolean>(false);
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
    loadTLDPricing();
  }, [router]);

  const loadTLDPricing = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/tld-pricing', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: TLDPricingResponse = await response.json();
        setTldPricing(data.tldPricing || []);
        setLastUpdated(data.lastUpdated || '');
        setPricingSource(data.pricingSource || '');
      } else {
        console.error('Failed to load TLD pricing:', response.statusText);
        setTldPricing([]);
      }
    } catch (error) {
      console.error('Failed to load TLD pricing:', error);
      setTldPricing([]);
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


  // Filter TLD pricing based on search term, category, and other filters
  const filteredTLDPricing = tldPricing.filter(tld => {
    const matchesSearch = tld.tld.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tld.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tld.category === selectedCategory;
    const matchesPriceRange = tld.customerPrice >= priceRange.min && tld.customerPrice <= priceRange.max;
    const matchesMargin = !showOnlyWithMargin || (tld.margin && tld.margin > 0);

    return matchesSearch && matchesCategory && matchesPriceRange && matchesMargin;
  });

  // Get unique categories for filter
  const categories = ['all', ...Array.from(new Set(tldPricing.map(tld => tld.category)))];

  // Sort filtered TLD pricing
  const sortedTLDPricing = [...filteredTLDPricing].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'tld':
        aValue = a.tld.toLowerCase();
        bValue = b.tld.toLowerCase();
        break;
      case 'customerPrice':
        aValue = a.customerPrice;
        bValue = b.customerPrice;
        break;
      case 'resellerPrice':
        aValue = a.resellerPrice;
        bValue = b.resellerPrice;
        break;
      case 'margin':
        aValue = a.margin || 0;
        bValue = b.margin || 0;
        break;
      case 'category':
        aValue = a.category;
        bValue = b.category;
        break;
      default:
        aValue = a.tld.toLowerCase();
        bValue = b.tld.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (key: string) => {
    if (sortBy !== key) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const columns = [
    {
      key: 'tld',
      label: 'TLD',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center">
          <Globe className="h-4 w-4 text-blue-500 mr-2" />
          <span className="font-mono font-semibold text-gray-900">{value}</span>
        </div>
      )
    },
    {
      key: 'customerPrice',
      label: 'Customer Price',
      sortable: true,
      render: (value: number, row: TLDPricing) => (
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="font-semibold text-gray-900">
            {formatIndianCurrency(value)}
          </span>
          <span className="text-sm text-gray-500 ml-1">{row.currency}</span>
        </div>
      )
    },
    {
      key: 'resellerPrice',
      label: 'Reseller Price',
      sortable: true,
      render: (value: number, row: TLDPricing) => (
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
          <span className="font-semibold text-gray-900">
            {formatIndianCurrency(value)}
          </span>
          <span className="text-sm text-gray-500 ml-1">{row.currency}</span>
        </div>
      )
    },
    {
      key: 'margin',
      label: 'Margin',
      sortable: true,
      render: (value: number, row: TLDPricing) => {
        const margin = row.customerPrice > 0 && row.resellerPrice > 0
          ? ((row.customerPrice - row.resellerPrice) / row.customerPrice * 100)
          : 0;
        return (
          <div className="flex items-center">
            <span className={`font-semibold ${margin > 0 ? 'text-green-600' : margin < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
              {margin > 0 ? '+' : ''}{margin.toFixed(1)}%
            </span>
          </div>
        );
      }
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${value === 'Generic' ? 'bg-blue-100 text-blue-800' :
          value === 'Country Code' ? 'bg-green-100 text-green-800' :
            value === 'New Generic' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
          }`}>
          {value}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value || 'N/A'}</span>
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
            <h1 className="text-2xl font-bold text-gray-900">TLD Pricing Management</h1>
            <p className="text-gray-600">
              Live domain pricing from {pricingSource} - {tldPricing.length} TLDs available
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {formatIndianDateTime(lastUpdated)}
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadTLDPricing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Pricing
            </button>
          </div>
        </div>


        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="space-y-4">
            {/* Search and Category Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search TLDs or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Price Range and Special Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Price Range */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (₹)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) || 0 })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) || 100000 })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Special Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showOnlyWithMargin}
                    onChange={(e) => setShowOnlyWithMargin(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show only with margin</span>
                </label>
              </div>
            </div>

            {/* Sorting Options */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tld">TLD Name</option>
                    <option value="customerPrice">Customer Price</option>
                    <option value="resellerPrice">Reseller Price</option>
                    <option value="margin">Margin</option>
                    <option value="category">Category</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                  </button>
                </div>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  Showing {sortedTLDPricing.length} of {tldPricing.length} TLDs
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TLD Pricing Table */}
        <AdminDataTable
          title="TLD Pricing"
          columns={columns}
          data={sortedTLDPricing}
          searchable={false}
          pagination={true}
          pageSize={20}
        />
      </div>
    </AdminLayout>
  );
}
