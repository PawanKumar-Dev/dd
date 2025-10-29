/**
 * Domain Search Component
 * 
 * This component provides a comprehensive domain search interface that allows users to:
 * - Search for domain availability across multiple TLDs
 * - View live pricing from domain services
 * - Add domains to cart for purchase
 * - Get TLD suggestions based on domain type
 * 
 * Features:
 * - Smart TLD detection and suggestions
 * - Live pricing integration
 * - Cart management
 * - Responsive design
 * - Error handling and loading states
 * 
 * @author Excel Technologies
 * @version 2.0.0
 * @since 2024
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, CheckCircle, XCircle, Globe, Star, AlertTriangle, TrendingUp, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import Button from './Button';
import DomainRequirementsModal from './DomainRequirementsModal';
import { getDomainRequirements, requiresAdditionalDetails, isDomainSupported, isRestrictedTLD } from '@/lib/domainRequirements';
import Input from './Input';

interface DomainSearchProps {
  className?: string;
}

interface SearchResult {
  domainName: string;
  available: boolean;
  price?: number;
  currency?: string;
  registrationPeriod?: number;
  pricingSource?: "live" | "fallback" | "unavailable" | "taken";
}


// Comprehensive TLD list including common and non-common TLDs
const TOP_TLDS = [
  // Most Popular
  '.com', '.net', '.org', '.co', '.io',
  // Tech & Innovation
  '.ai', '.app', '.dev', '.tech', '.digital', '.online', '.site', '.website', '.software', '.cloud',
  // Business & Professional
  '.biz', '.store', '.shop', '.business', '.company', '.solutions', '.services', '.agency', '.consulting',
  // Creative & Media
  '.design', '.art', '.media', '.studio', '.video', '.photography', '.graphics', '.music',
  // Location-based
  '.in', '.us', '.uk', '.ca', '.au', '.de', '.fr', '.jp',
  // New & Trending
  '.xyz', '.info', '.pro', '.name', '.email', '.work', '.live', '.space', '.fun',
  // Niche & Specialized
  '.blog', '.news', '.academy', '.education', '.school', '.university', '.training',
  '.health', '.fitness', '.life', '.style', '.fashion', '.beauty',
  '.food', '.cafe', '.restaurant', '.pizza', '.coffee',
  '.travel', '.tours', '.vacation', '.hotel', '.flights',
  '.finance', '.money', '.capital', '.ventures', '.credit',
  '.realestate', '.properties', '.construction', '.marketing', '.legal'
];

/**
 * Domain Search Component
 * 
 * @param {DomainSearchProps} props - Component props
 * @returns {JSX.Element} The domain search interface
 */
export default function DomainSearch({ className = '' }: DomainSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseDomain, setBaseDomain] = useState('');
  const [showTldSuggestions, setShowTldSuggestions] = useState(false);
  const [searchMode, setSearchMode] = useState<'single' | 'multiple'>('single');
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [selectedDomainForRequirements, setSelectedDomainForRequirements] = useState<string>('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchedTlds, setSearchedTlds] = useState<string[]>([]);
  const [canLoadMore, setCanLoadMore] = useState(false);
  const { addItem } = useCartStore();
  const router = useRouter();

  // Load saved search state on component mount
  useEffect(() => {
    const savedSearchState = localStorage.getItem('domainSearchState');
    if (savedSearchState) {
      try {
        const state = JSON.parse(savedSearchState);
        if (state.searchTerm) {
          setSearchTerm(state.searchTerm);
          setBaseDomain(state.baseDomain || '');
          setSearchMode(state.searchMode || 'single');
        }
      } catch (error) {
        // Failed to load saved search state
      }
    }

    // Ensure component is not stuck in loading state
    setIsSearching(false);
  }, []);

  // Save search state when it changes
  useEffect(() => {
    if (hasSearched) {
      const searchState = {
        searchTerm,
        baseDomain,
        searchMode
      };
      localStorage.setItem('domainSearchState', JSON.stringify(searchState));
    }
  }, [searchTerm, baseDomain, searchMode, hasSearched]);

  const validateDomainInput = (input: string) => {
    const trimmed = input.trim();

    if (trimmed.includes('.')) {
      const parts = trimmed.split('.');
      if (parts.length >= 2 && parts[0].length > 0 && parts[parts.length - 1].length > 0) {
        return {
          isValid: true,
          baseDomain: parts[0],
          suggestedTld: parts.slice(1).join('.')
        };
      }
    }

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/;
    const matches = domainRegex.test(trimmed);

    if (matches && trimmed.length >= 2) {
      return {
        isValid: true,
        baseDomain: trimmed,
        suggestedTld: null
      };
    }

    return {
      isValid: false,
      warning: 'Please enter a valid domain name (e.g., "example" or "example.com")'
    };
  };

  const getSuggestedTlds = (domain: string) => {
    // Filter out restricted TLDs from top TLDs
    const filteredSuggestions = TOP_TLDS.filter(tld => !isRestrictedTLD(tld));

    // Return more suggestions for "Show More" functionality (up to 20)
    return filteredSuggestions.slice(0, 20);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Validate domain input
    const validation = validateDomainInput(searchTerm);

    if (!validation.isValid) {
      const errorMessage = ('warning' in validation ? validation.warning : 'Please enter a valid domain name') || 'Please enter a valid domain name';
      toast.error(errorMessage);
      return;
    }

    // Reset states for new search
    setSearchedTlds([]);
    setCanLoadMore(false);
    setBaseDomain(('baseDomain' in validation ? validation.baseDomain : '') || '');
    setIsSearching(true);
    setHasSearched(true);
    setError(null);

    try {
      let searchTlds: string[] = [];

      // Determine if this should be a single or multiple TLD search
      // If user provided a TLD (e.g., "example.com"), search only that domain
      // If user provided just a name (e.g., "example"), search multiple TLDs
      const suggestedTld = 'suggestedTld' in validation ? validation.suggestedTld : null;
      const shouldSearchMultipleTlds = !suggestedTld;

      if (!shouldSearchMultipleTlds) {
        // Single domain search - user specified a TLD
        const domainToSearch = searchTerm;

        const response = await fetch('/api/domains/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: domainToSearch
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setResults(data.results || []);
          setError(null);
        } else {
          setResults([]);

          // Handle restricted TLD errors
          if (data.error === 'restricted_tld' || data.error === 'all_tlds_restricted') {
            setError(data.message);
            toast.error(data.message, {
              duration: 8000,
              style: {
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
              },
            });
          } else {
            setError(data.error || 'Failed to search domain. Please try again.');
            toast.error(data.error || 'Failed to search domain. Please try again.');
          }
        }
      } else {
        // Multiple TLD search - ONLY search .com initially for fast results
        const baseDomain = ('baseDomain' in validation ? validation.baseDomain : '') || '';
        const primaryTld = '.com'; // Start with .com only
        setBaseDomain(baseDomain);
        searchTlds = [primaryTld];
        setSearchedTlds([primaryTld]);

        // Check if more TLDs are available for "Show More" button
        const allTlds = getSuggestedTlds(baseDomain);
        setCanLoadMore(allTlds.length > 1);

        const response = await fetch('/api/domains/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: baseDomain,
            tlds: searchTlds
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setResults(data.results || []);
          setError(null);
        } else {
          setResults([]);

          // Handle restricted TLD errors
          if (data.error === 'restricted_tld' || data.error === 'all_tlds_restricted') {
            setError(data.message);
            toast.error(data.message, {
              duration: 8000,
              style: {
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
              },
            });
          } else {
            setError(data.error || 'Failed to search domain. Please try again.');
            toast.error(data.error || 'Failed to search domain. Please try again.');
          }
        }
      }
    } catch (error) {
      setResults([]);
      setError('Network error. Please check your connection and try again.');
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMoreSuggestions = async () => {
    if (!baseDomain || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      // Get all available TLDs
      const allTlds = getSuggestedTlds(baseDomain);

      // Filter out already searched TLDs
      const remainingTlds = allTlds.filter(tld => !searchedTlds.includes(tld));

      // Take next 6 TLDs for better coverage of expanded TLD list
      const tldsToSearch = remainingTlds.slice(0, 6);

      if (tldsToSearch.length === 0) {
        setCanLoadMore(false);
        toast('No more TLD suggestions available', {
          icon: 'ℹ️',
        });
        return;
      }

      const response = await fetch('/api/domains/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: baseDomain,
          tlds: tldsToSearch
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Append new results to existing results
        setResults(prevResults => [...prevResults, ...(data.results || [])]);

        // Update searched TLDs
        setSearchedTlds(prev => [...prev, ...tldsToSearch]);

        // Check if there are more TLDs to load
        const newRemainingTlds = remainingTlds.slice(tldsToSearch.length);
        setCanLoadMore(newRemainingTlds.length > 0);

        toast.success(`Found ${data.results?.length || 0} more suggestions`);
      } else {
        toast.error(data.error || 'Failed to load more suggestions');
      }
    } catch (error) {
      toast.error('Failed to load more suggestions. Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleAddToCart = (result: SearchResult) => {
    if (result.available && result.price) {
      // Check if domain requires additional details
      if (requiresAdditionalDetails(result.domainName)) {
        setSelectedDomainForRequirements(result.domainName);
        setShowRequirementsModal(true);
        return;
      }

      // Check if domain is supported
      if (!isDomainSupported(result.domainName)) {
        showErrorToast(`${result.domainName} requires additional verification. Please contact support.`);
        return;
      }

      const cartItem = {
        domainName: result.domainName,
        price: result.price,
        currency: result.currency || 'INR',
        registrationPeriod: result.registrationPeriod || 1,
      };
      addItem(cartItem);
      showSuccessToast(`${result.domainName} added to cart`);

      // Redirect to cart page after adding to cart
      setTimeout(() => {
        router.push('/cart');
      }, 1000); // Small delay to show the success toast
    } else {
      showErrorToast('Cannot add to cart - missing required data');
    }
  };


  const formatPrice = (price: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Auto-detect search mode based on input
    const validation = validateDomainInput(value);
    const suggestedTld = 'suggestedTld' in validation ? validation.suggestedTld : null;
    const baseDomain = (('baseDomain' in validation ? validation.baseDomain : '') || '');

    if (validation.isValid && !suggestedTld) {
      // Domain name without TLD - show multiple TLD suggestions
      setSearchMode('multiple');
      setShowTldSuggestions(true);
      setBaseDomain(baseDomain);
      // Clear any previous search results when switching to multiple mode
      if (hasSearched) {
        setResults([]);
        setHasSearched(false);
        setError(null);
      }
    } else if (suggestedTld) {
      // Domain name with TLD - single search
      setSearchMode('single');
      setShowTldSuggestions(false);
      setBaseDomain(baseDomain);
    } else {
      // Invalid input
      setSearchMode('single');
      setShowTldSuggestions(false);
      setBaseDomain('');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setHasSearched(false);
    setError(null);
    setBaseDomain('');
    setSearchedTlds([]);
    setCanLoadMore(false);
    setIsLoadingMore(false);
    setShowTldSuggestions(false);
    setSearchMode('single');
    localStorage.removeItem('domainSearchState');
  };


  return (
    <div className={`w-full ${className}`}>
      {/* Google Workspace Style Search Form - Always Visible */}
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 w-full max-w-8xl mx-auto">
        <div className="text-center mb-3 sm:mb-4 md:mb-6">
          <h2 className="text-xl sm:text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>Find Your Perfect Domain</h2>
        </div>

        <form onSubmit={handleSearch} className="space-y-4 sm:space-y-4">
          {/* Domain Input */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 w-full max-w-full sm:max-w-6xl mx-auto">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-4 sm:w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="domain-input"
                  type="text"
                  value={searchTerm}
                  onChange={handleInputChange}
                  placeholder="Enter domain name (e.g., example)"
                  className="pl-14 pr-5 py-5 sm:py-3 text-lg sm:text-sm border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl transition-all duration-200 hover:border-blue-400 bg-white text-gray-900 placeholder-gray-400 h-16 sm:h-12 w-full font-medium"
                  disabled={isSearching}
                  style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}
                />
              </div>
            </div>
            <div className="flex items-stretch w-full sm:w-auto">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSearching || !searchTerm.trim()}
                className="relative w-full sm:w-auto px-12 sm:px-6 py-0 text-lg sm:text-sm font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white border-0 h-16 sm:h-12 flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
                style={{
                  fontFamily: 'Google Sans, system-ui, sans-serif'
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <div className="relative flex items-center justify-center gap-3">
                  {isSearching ? (
                    <>
                      <Loader2 className="h-6 w-6 sm:h-4 sm:w-4 animate-spin" />
                      <span className="tracking-wide">Searching...</span>
                    </>
                  ) : (
                    <>
                      <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Search className="h-5 w-5 sm:h-4 sm:w-4" />
                      </div>
                      <span className="tracking-wide">Search Domains</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </div>


          {searchMode === 'multiple' && baseDomain && !hasSearched && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <p className="text-sm text-gray-800 font-medium" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>
                  We'll search all popular domain extensions for you
                </p>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Enhanced Loading State */}
      {isSearching && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4 sm:mb-6 w-full">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              {/* Enhanced animated search icon */}
              <div className="relative mb-6">
                {/* Outer rotating ring */}
                <div className="w-16 h-16 border-4 border-gray-100 border-t-blue-500 border-r-blue-400 rounded-full animate-spin mx-auto"></div>
                {/* Inner pulsing ring */}
                <div className="absolute inset-2 w-12 h-12 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                {/* Center search icon with bounce animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="h-6 w-6 text-blue-600 animate-bounce" style={{ animationDuration: '1s' }} />
                </div>
                {/* Floating dots around the search icon */}
                <div className="absolute -top-2 -right-2 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-blue-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute -top-1 -left-3 w-1.5 h-1.5 bg-blue-200 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              </div>

              {/* Animated text with typing effect */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 animate-pulse" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>S</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>e</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>a</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>r</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.5s' }}>c</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.6s' }}>h</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.7s' }}>i</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.8s' }}>n</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.9s' }}>g</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '1.0s' }}> </span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '1.1s' }}>f</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '1.2s' }}>o</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '1.3s' }}>r</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '1.4s' }}> </span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '1.5s' }}>d</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '1.6s' }}>o</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '1.7s' }}>m</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '1.8s' }}>a</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '1.9s' }}>i</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '2.0s' }}>n</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '2.1s' }}>s</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '2.2s' }}>.</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '2.3s' }}>.</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '2.4s' }}>.</span>
              </h3>

              {/* Animated progress dots */}
              <div className="flex justify-center space-x-1 mb-4">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.8s' }}></div>
              </div>

              {/* Animated status messages */}
              <div className="space-y-2">
                <p className="text-gray-600 text-sm animate-fade-in" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
                  <span className="inline-block animate-pulse">Please wait while we check availability and pricing</span>
                </p>
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="animate-pulse">Checking domain availability</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <span className="animate-pulse" style={{ animationDelay: '0.5s' }}>Fetching live pricing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Results Section */}
      {hasSearched && !isSearching && (
        <div className="space-y-4 w-full">
          {/* Results Header */}
          <div className="bg-white rounded-lg shadow-sm border border-[var(--google-border-light)] p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--google-blue-light)] rounded-lg flex-shrink-0">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--google-blue)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-semibold text-[var(--google-text-primary)]" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>
                    Search Results
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--google-text-secondary)]" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
                    {results.length} domain{results.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
              <button
                onClick={clearSearch}
                className="px-3 py-1.5 text-sm text-[var(--google-text-secondary)] hover:text-[var(--google-text-primary)] hover:bg-[var(--google-bg-secondary)] rounded-md transition-colors self-start sm:self-auto"
                style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}
              >
                Clear
              </button>
            </div>
          </div>


          {/* Enhanced Error State */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center justify-center gap-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-red-900 mb-1">Search Error</h4>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {!isSearching && results.length > 0 && (
            <div className="space-y-4">

              {/* Results */}
              <div className="grid gap-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm border border-[var(--google-border-light)] p-3 sm:p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${result.available ? 'bg-[var(--google-blue-light)]' : 'bg-red-50'}`}>
                          {result.available ? (
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--google-green)]" />
                          ) : (
                            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--google-error)]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-base sm:text-lg font-semibold text-[var(--google-text-primary)] truncate" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>{result.domainName}</h4>
                              {requiresAdditionalDetails(result.domainName) && (
                                <button
                                  onClick={() => {
                                    setSelectedDomainForRequirements(result.domainName);
                                    setShowRequirementsModal(true);
                                  }}
                                  className="text-orange-500 hover:text-orange-600 transition-colors"
                                  title="This domain requires additional verification"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {result.available && result.pricingSource && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${result.pricingSource === 'live'
                                  ? 'bg-[var(--google-blue-light)] text-[var(--google-blue)]'
                                  : 'bg-[var(--google-bg-tertiary)] text-[var(--google-text-secondary)]'
                                  }`}
                                  style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>
                                  {result.pricingSource === 'live' && 'Live'}
                                  {result.pricingSource === 'unavailable' && 'N/A'}
                                </span>
                              )}
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${result.available
                                ? 'text-white bg-gradient-to-r from-green-500 to-green-600'
                                : result.pricingSource === 'taken'
                                  ? 'text-white bg-gradient-to-r from-red-500 to-red-600'
                                  : result.pricingSource === 'unavailable'
                                    ? 'text-white bg-gradient-to-r from-orange-500 to-orange-600'
                                    : 'text-white bg-gradient-to-r from-red-500 to-red-600'
                                }`} style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>
                                {result.available
                                  ? 'Available'
                                  : result.pricingSource === 'taken'
                                    ? 'Taken'
                                    : result.pricingSource === 'unavailable'
                                      ? 'Pricing Unavailable'
                                      : 'Taken'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        {result.available && result.price ? (
                          <>
                            <div className="text-left sm:text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <div className="text-right">
                                  <p className="text-base sm:text-lg font-bold text-[var(--google-text-primary)]" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>
                                    {formatPrice(result.price, result.currency)}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-[var(--google-text-secondary)]" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>per year</p>
                            </div>
                            <Button
                              onClick={() => handleAddToCart(result)}
                              variant="primary"
                              size="sm"
                              disabled={!result.available || result.pricingSource === 'unavailable'}
                              className={`flex items-center justify-center space-x-1 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm shadow-sm transition-all duration-200 w-full sm:w-auto ${!result.available || result.pricingSource === 'unavailable'
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:shadow-md'
                                }`}
                              style={{
                                backgroundColor: !result.available || result.pricingSource === 'unavailable'
                                  ? 'var(--google-text-secondary)'
                                  : 'var(--google-blue)',
                                borderColor: !result.available || result.pricingSource === 'unavailable'
                                  ? 'var(--google-text-secondary)'
                                  : 'var(--google-blue)',
                                fontFamily: 'Google Sans, system-ui, sans-serif'
                              }}
                            >
                              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>
                                {!result.available || result.pricingSource === 'unavailable'
                                  ? 'No Live Pricing'
                                  : 'Add'
                                }
                              </span>
                            </Button>
                          </>
                        ) : (
                          <div className="text-left sm:text-right">
                            <p className="text-xs text-[var(--google-text-secondary)]" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
                              {result.available
                                ? 'Pricing N/A'
                                : result.pricingSource === 'taken'
                                  ? 'Domain is taken'
                                  : result.pricingSource === 'unavailable'
                                    ? 'Unable to fetch pricing'
                                    : 'Taken'
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show More Suggestions Button */}
              {canLoadMore && !isLoadingMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMoreSuggestions}
                    className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-md flex items-center gap-2 mx-auto"
                    style={{
                      backgroundColor: 'var(--google-bg-tertiary)',
                      color: 'var(--google-blue)',
                      border: '2px solid var(--google-blue)',
                      fontFamily: 'Google Sans, system-ui, sans-serif'
                    }}
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span>Show More Suggestions</span>
                  </button>
                  <p className="text-xs text-white/80 mt-2" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
                    See more TLD options for "{baseDomain}"
                  </p>
                </div>
              )}

              {/* Loading More Indicator */}
              {isLoadingMore && (
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                    <span className="text-sm text-white/90" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
                      Loading more suggestions...
                    </span>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Enhanced No Results */}
          {!isSearching && results.length === 0 && !error && (
            <div className="text-center py-16">
              <div className="bg-white rounded-lg shadow-sm border border-[var(--google-border-light)] p-12 max-w-md mx-auto">
                <div className="p-4 bg-[var(--google-bg-tertiary)] rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Globe className="h-10 w-10 text-[var(--google-text-tertiary)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--google-text-primary)] mb-3" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>No domains found</h3>
                <p className="text-[var(--google-text-secondary)] mb-6" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>Try searching with a different term or check your spelling</p>
                <button
                  onClick={clearSearch}
                  className="px-6 py-3 text-white rounded-lg font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--google-blue)',
                    borderColor: 'var(--google-blue)',
                    fontFamily: 'Google Sans, system-ui, sans-serif'
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Domain Requirements Modal */}
      {showRequirementsModal && selectedDomainForRequirements && (
        <DomainRequirementsModal
          isOpen={showRequirementsModal}
          onClose={() => {
            setShowRequirementsModal(false);
            setSelectedDomainForRequirements('');
          }}
          domain={selectedDomainForRequirements.split('.')[0]}
          tld={`.${selectedDomainForRequirements.split('.').slice(1).join('.')}`}
          requirements={getDomainRequirements(`.${selectedDomainForRequirements.split('.').slice(1).join('.')}`).requirements}
          restrictions={getDomainRequirements(`.${selectedDomainForRequirements.split('.').slice(1).join('.')}`).restrictions}
          onSelectAlternative={() => {
            // Handle contact support action
            window.open('mailto:support@exceltechnologies.com?subject=Domain Registration Support');
          }}
        />
      )}
    </div>
  );
}