/**
 * Domain Search Component
 * 
 * This component provides a comprehensive domain search interface that allows users to:
 * - Search for domain availability across multiple TLDs
 * - View live pricing from ResellerClub API
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
import { Search, Loader2, CheckCircle, XCircle, Globe, ShoppingCart, Star, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useTestingStore } from '@/store/testingStore';
import toast from 'react-hot-toast';
import Button from './Button';
import DomainRequirementsModal from './DomainRequirementsModal';
import { getDomainRequirements, requiresAdditionalDetails, isDomainSupported } from '@/lib/domainRequirements';
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

interface TLDCategory {
  name: string;
  icon: React.ComponentType<any>;
  tlds: string[];
  description: string;
}

const TLD_CATEGORIES: TLDCategory[] = [
  {
    name: 'Popular',
    icon: Star,
    tlds: ['.com', '.net', '.org', '.info', '.biz'],
    description: 'Most popular domain extensions'
  },
  {
    name: 'Business',
    icon: TrendingUp,
    tlds: ['.co', '.io', '.ai', '.app', '.dev', '.tech'],
    description: 'Perfect for businesses and startups'
  },
  {
    name: 'E-commerce',
    icon: ShoppingCart,
    tlds: ['.store', '.shop', '.buy', '.market', '.sale'],
    description: 'Great for online stores and marketplaces'
  },
  {
    name: 'Technology',
    icon: Zap,
    tlds: ['.tech', '.app', '.dev', '.ai', '.cloud', '.data'],
    description: 'Ideal for tech companies and developers'
  },
  {
    name: 'Online',
    icon: Globe,
    tlds: ['.online', '.web', '.site', '.website', '.digital'],
    description: 'Perfect for online presence'
  }
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
  const [selectedTlds, setSelectedTlds] = useState<string[]>([]);
  const [showTldSuggestions, setShowTldSuggestions] = useState(false);
  const [searchMode, setSearchMode] = useState<'single' | 'multiple'>('single');
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [selectedDomainForRequirements, setSelectedDomainForRequirements] = useState<string>('');
  const { addItem } = useCartStore();
  const { isTestingMode } = useTestingStore();
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
          setSelectedTlds(state.selectedTlds || []);
          setSearchMode(state.searchMode || 'single');
        }
      } catch (error) {
        console.error('Failed to load saved search state:', error);
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
        selectedTlds,
        searchMode
      };
      localStorage.setItem('domainSearchState', JSON.stringify(searchState));
    }
  }, [searchTerm, baseDomain, selectedTlds, searchMode, hasSearched]);

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
    if (domainRegex.test(trimmed) && trimmed.length >= 2) {
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
    const domainLower = domain.toLowerCase();
    const suggestions: string[] = [];

    if (domainLower.includes('shop') || domainLower.includes('store') || domainLower.includes('buy')) {
      suggestions.push(...TLD_CATEGORIES[2].tlds);
    }

    if (domainLower.includes('tech') || domainLower.includes('app') || domainLower.includes('dev') || domainLower.includes('ai')) {
      suggestions.push(...TLD_CATEGORIES[3].tlds);
    }

    if (domainLower.includes('online') || domainLower.includes('web') || domainLower.includes('site')) {
      suggestions.push(...TLD_CATEGORIES[4].tlds);
    }

    // Remove duplicates and limit to 12 suggestions
    return Array.from(new Set(suggestions)).slice(0, 12);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Validate domain input
    const validation = validateDomainInput(searchTerm);
    if (!validation.isValid) {
      toast.error(validation.warning || 'Please enter a valid domain name');
      return;
    }

    setBaseDomain(validation.baseDomain || '');
    setIsSearching(true);
    setHasSearched(true);
    setError(null);

    try {
      let searchTlds: string[] = [];

      if (searchMode === 'single' || validation.suggestedTld) {
        // Single domain search
        const domainToSearch = searchTerm;
        console.log('🔍 [FRONTEND] Single domain search:', domainToSearch);

        const response = await fetch('/api/domains/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-testing-mode': isTestingMode.toString(),
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
          setError(data.error || 'Failed to search domain. Please try again.');
          toast.error(data.error || 'Failed to search domain. Please try again.');
        }
      } else {
        // Multiple TLD search
        searchTlds = selectedTlds.length > 0 ? selectedTlds : getSuggestedTlds(validation.baseDomain || '');

        const response = await fetch('/api/domains/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-testing-mode': isTestingMode.toString(),
          },
          body: JSON.stringify({
            domain: validation.baseDomain,
            tlds: searchTlds
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setResults(data.results || []);
          setError(null);
        } else {
          setResults([]);
          setError(data.error || 'Failed to search domain. Please try again.');
          toast.error(data.error || 'Failed to search domain. Please try again.');
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
        toast.error(`${result.domainName} requires additional verification. Please contact support.`);
        return;
      }

      const cartItem = {
        domainName: result.domainName,
        price: result.price,
        currency: result.currency || 'INR',
        registrationPeriod: result.registrationPeriod || 1,
      };
      addItem(cartItem);
      toast.success(`${result.domainName} added to cart`);

      // Redirect to cart page after adding to cart
      setTimeout(() => {
        router.push('/cart');
      }, 1000); // Small delay to show the success toast
    } else {
      toast.error('Cannot add to cart - missing required data');
    }
  };

  const toggleTldSelection = (tld: string) => {
    setSelectedTlds(prev =>
      prev.includes(tld)
        ? prev.filter(t => t !== tld)
        : [...prev, tld]
    );
  };

  const selectAllTlds = (categoryTlds: string[]) => {
    setSelectedTlds(prev => {
      const newTlds = Array.from(new Set([...prev, ...categoryTlds]));
      return newTlds;
    });
  };

  const clearTldSelection = () => {
    setSelectedTlds([]);
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
    if (validation.isValid && !validation.suggestedTld) {
      setSearchMode('multiple');
      setShowTldSuggestions(true);
    } else if (validation.suggestedTld) {
      setSearchMode('single');
      setShowTldSuggestions(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setHasSearched(false);
    setError(null);
    setBaseDomain('');
    setSelectedTlds([]);
    setShowTldSuggestions(false);
    setSearchMode('single');
    localStorage.removeItem('domainSearchState');
  };


  return (
    <div className={`w-full max-w-5xl mx-auto ${className}`}>
      {/* Google Workspace Style Search Form - Always Visible */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 max-w-4xl mx-auto">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>Find Your Perfect Domain</h2>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          {/* Domain Input */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="domain-input"
                  type="text"
                  value={searchTerm}
                  onChange={handleInputChange}
                  placeholder="Enter domain name (e.g., example or example.com)"
                  className="pl-10 pr-4 py-2.5 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg transition-all duration-200 hover:border-gray-400 bg-white text-gray-900 placeholder-gray-500"
                  disabled={isSearching}
                  style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSearching || !searchTerm.trim()}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white border-0"
                style={{
                  fontFamily: 'Google Sans, system-ui, sans-serif'
                }}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-6 w-6 mr-3" />
                    Search Domains
                  </>
                )}
              </Button>
            </div>
          </div>


          {searchMode === 'multiple' && showTldSuggestions && baseDomain && (
            <div className="space-y-4 sm:space-y-6 bg-gray-50 rounded-xl p-4 sm:p-6 border-2 border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-sm text-gray-800 bg-blue-100 px-4 py-3 rounded-lg font-medium" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>
                  <TrendingUp className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <span className="text-sm">Select domain extensions below to search multiple TLDs</span>
                </div>
                <button
                  type="button"
                  onClick={clearTldSelection}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors self-start sm:self-auto"
                  style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}
                >
                  Clear all
                </button>
              </div>

              {/* TLD Categories */}
              <div className="space-y-4">
                {TLD_CATEGORIES.map((category) => {
                  const categoryTlds = category.tlds.filter(tld =>
                    !searchTerm.includes('.') || !searchTerm.endsWith(tld)
                  );

                  if (categoryTlds.length === 0) return null;

                  return (
                    <div key={category.name} className="bg-white rounded-xl p-4 sm:p-5 shadow-md border-2 border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                            <category.icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg sm:text-xl" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>{category.name}</h3>
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>{category.description}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => selectAllTlds(categoryTlds)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors self-start sm:self-auto"
                          style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}
                        >
                          Select all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {categoryTlds.map((tld) => (
                          <button
                            key={tld}
                            type="button"
                            onClick={() => toggleTldSelection(tld)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedTlds.includes(tld)
                              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-sm'
                              }`}
                            style={{
                              fontFamily: 'Google Sans, system-ui, sans-serif'
                            }}
                          >
                            {tld}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected TLDs Summary */}
              {selectedTlds.length > 0 && (
                <div className="bg-blue-600 p-6 sm:p-8 rounded-xl text-white shadow-lg">
                  <div className="flex items-center gap-4 mb-4 sm:mb-6">
                    <div className="p-3 bg-white bg-opacity-20 rounded-xl flex-shrink-0">
                      <Globe className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-lg sm:text-xl" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>Selected Extensions</h4>
                      <p className="text-blue-100 text-sm sm:text-base" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>{selectedTlds.length} TLD{selectedTlds.length !== 1 ? 's' : ''} selected</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {selectedTlds.slice(0, 5).map((tld) => (
                      <span
                        key={tld}
                        className="px-4 py-2 bg-white bg-opacity-25 text-white text-sm rounded-lg font-medium"
                        style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}
                      >
                        {tld}
                      </span>
                    ))}
                    {selectedTlds.length > 5 && (
                      <span className="px-4 py-2 bg-white bg-opacity-15 text-white text-sm rounded-lg font-medium" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>
                        +{selectedTlds.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Enhanced Loading State */}
      {isSearching && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4 sm:mb-6 max-w-4xl mx-auto">
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
        <div className="space-y-4 max-w-4xl mx-auto">
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
          domainName={selectedDomainForRequirements}
          requirements={getDomainRequirements(selectedDomainForRequirements)!}
          onContactSupport={() => {
            // Handle contact support action
            window.open('mailto:support@exceltechnologies.com?subject=Domain Registration Support');
          }}
        />
      )}
    </div>
  );
}