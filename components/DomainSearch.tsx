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
import { Search, Loader2, CheckCircle, XCircle, Globe, ShoppingCart, Star, TrendingUp, Zap } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useTestingStore } from '@/store/testingStore';
import toast from 'react-hot-toast';
import Button from './Button';
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
  pricingSource?: "live" | "fallback" | "unavailable";
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
    return [...new Set(suggestions)].slice(0, 12);
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

    setBaseDomain(validation.baseDomain);
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
        searchTlds = selectedTlds.length > 0 ? selectedTlds : getSuggestedTlds(validation.baseDomain);
        console.log('🔍 [FRONTEND] Multiple TLD search:', validation.baseDomain, 'with TLDs:', searchTlds);

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
      const newTlds = [...new Set([...prev, ...categoryTlds])];
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
      {/* Enhanced Search Form */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-3xl shadow-2xl border border-slate-200 p-8 mb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">Find Your Perfect Domain</h2>
          <p className="text-slate-600 text-lg">Search from thousands of available domains with live pricing</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          {/* Domain Input */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  id="domain-input"
                  type="text"
                  value={searchTerm}
                  onChange={handleInputChange}
                  placeholder="Enter domain name (e.g., example or example.com)"
                  className="pl-12 pr-4 py-5 text-lg border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-2xl transition-all duration-200 hover:border-slate-300 bg-white"
                  disabled={isSearching}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSearching || !searchTerm.trim()}
                className="w-full sm:w-auto px-10 py-5 text-lg font-semibold rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
            <div className="space-y-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 rounded-2xl p-6 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-indigo-700 bg-indigo-100 px-4 py-3 rounded-xl font-medium">
                  <TrendingUp className="h-5 w-5" />
                  <span>Select domain extensions below to search multiple TLDs</span>
                </div>
                <button
                  type="button"
                  onClick={clearTldSelection}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
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
                    <div key={category.name} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                            <category.icon className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-lg">{category.name}</h3>
                            <p className="text-sm text-slate-500">{category.description}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => selectAllTlds(categoryTlds)}
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          Select all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {categoryTlds.map((tld) => (
                          <button
                            key={tld}
                            type="button"
                            onClick={() => toggleTldSelection(tld)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${selectedTlds.includes(tld)
                              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-lg'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-md'
                              }`}
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
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 rounded-2xl text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Selected Extensions</h4>
                      <p className="text-indigo-100 text-sm">{selectedTlds.length} TLD{selectedTlds.length !== 1 ? 's' : ''} selected</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTlds.slice(0, 5).map((tld) => (
                      <span
                        key={tld}
                        className="px-4 py-2 bg-white bg-opacity-20 text-white text-sm rounded-xl font-medium backdrop-blur-sm"
                      >
                        {tld}
                      </span>
                    ))}
                    {selectedTlds.length > 5 && (
                      <span className="px-4 py-2 bg-white bg-opacity-10 text-white text-sm rounded-xl font-medium">
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

      {/* Enhanced Results Section */}
      {hasSearched && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Search className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Search Results
                  </h2>
                  {!isSearching && (
                    <p className="text-sm text-slate-600">
                      {results.length} domain{results.length !== 1 ? 's' : ''} found
                    </p>
                  )}
                </div>
              </div>
              {!isSearching && (
                <button
                  onClick={clearSearch}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Loading State */}
          {isSearching && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="h-6 w-6 text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Searching for domains...</h3>
                <p className="text-slate-600">Please wait while we check availability and pricing</p>
              </div>
            </div>
          )}

          {/* Enhanced Error State */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Search Error</h4>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {!isSearching && results.length > 0 && (
            <div className="space-y-4">
              {/* Compact Legend */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-3">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-600">Live Price</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    <span className="text-slate-600">Unavailable</span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="grid gap-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${result.available ? 'bg-emerald-100' : 'bg-red-100'}`}>
                          {result.available ? (
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-lg font-semibold text-slate-800">{result.domainName}</h4>
                            {result.available && result.pricingSource && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${result.pricingSource === 'live'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                                }`}>
                                {result.pricingSource === 'live' && 'Live'}
                                {result.pricingSource === 'unavailable' && 'N/A'}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${result.available ? 'text-emerald-600' : 'text-red-600'}`}>
                            {result.available ? 'Available' : 'Taken'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {result.available && result.price ? (
                          <>
                            <div className="text-right">
                              <p className="text-lg font-bold text-slate-800">
                                {formatPrice(result.price, result.currency)}
                              </p>
                              <p className="text-xs text-slate-500">per year</p>
                            </div>
                            <Button
                              onClick={() => handleAddToCart(result)}
                              variant="primary"
                              size="sm"
                              className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg font-medium text-sm shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <ShoppingCart className="h-4 w-4" />
                              <span>Add</span>
                            </Button>
                          </>
                        ) : (
                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              {result.available ? 'Pricing N/A' : 'Taken'}
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
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 max-w-md mx-auto">
                <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Globe className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">No domains found</h3>
                <p className="text-slate-600 mb-6">Try searching with a different term or check your spelling</p>
                <button
                  onClick={clearSearch}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-xl font-semibold hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 transition-all duration-200 transform hover:scale-105"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}