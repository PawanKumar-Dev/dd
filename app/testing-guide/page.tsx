'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TestTube,
  CheckCircle,
  ArrowRight,
  Globe,
  ShoppingCart,
  CreditCard,
  User,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useTestingStore } from '@/store/testingStore';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import Link from 'next/link';

interface User {
  firstName: string;
  lastName: string;
  role: string;
}

export default function TestingGuidePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const { isTestingMode, toggleTestingMode } = useTestingStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    setIsLoading(false);
  }, [router]);

  const testingSteps = [
    {
      id: 'enable-testing',
      title: 'Enable Testing Mode',
      description: 'Turn on testing mode to simulate all API calls',
      icon: TestTube,
      action: 'Go to Admin Settings',
      href: '/admin/settings',
      details: [
        'Navigate to Admin Dashboard → Settings → Testing Mode',
        'Toggle the switch to enable testing mode',
        'You\'ll see a yellow banner at the top of all pages',
        'Only ResellerClub API calls will be simulated'
      ]
    },
    {
      id: 'test-domain-search',
      title: 'Test Domain Search',
      description: 'Search for domains and see mock results',
      icon: Globe,
      action: 'Search Domains',
      href: '/',
      details: [
        'Go to the homepage',
        'Search for any domain name (e.g., "example.com")',
        'All searches will return mock available domains from ResellerClub',
        'Try different domain extensions (.com, .net, .org)',
        'Cart functionality works normally with real data'
      ]
    },
    {
      id: 'test-cart',
      title: 'Test Cart Functionality',
      description: 'Add domains to cart and manage quantities',
      icon: ShoppingCart,
      action: 'View Cart',
      href: '/cart',
      details: [
        'Add domains to your cart from search results',
        'View cart page to see all items',
        'Test quantity updates and item removal',
        'Verify total price calculations',
        'Cart uses real data and works exactly like production'
      ]
    },
    {
      id: 'test-checkout',
      title: 'Test Checkout Process',
      description: 'Complete the payment flow with test credentials',
      icon: CreditCard,
      action: 'Go to Checkout',
      href: '/checkout',
      details: [
        'Proceed to checkout with items in cart',
        'Review order summary and pricing',
        'Complete payment with test Razorpay credentials',
        'Payment processing works normally with real Razorpay',
        'Only domain registration to ResellerClub is simulated'
      ]
    },
    {
      id: 'test-dashboard',
      title: 'Test User Dashboard',
      description: 'View registered domains and manage account',
      icon: User,
      action: 'View Dashboard',
      href: '/dashboard',
      details: [
        'Check your user dashboard after payment',
        'View registered domains (simulated from ResellerClub)',
        'Test domain management features',
        'Verify user account information',
        'User management works normally with real data'
      ]
    },
    {
      id: 'test-admin',
      title: 'Test Admin Features',
      description: 'Test admin panel functionality',
      icon: Settings,
      action: 'Admin Dashboard',
      href: '/admin/dashboard',
      details: [
        'Access admin dashboard with admin credentials',
        'View user management and payment records',
        'Test admin settings and testing mode toggle',
        'Verify admin-only features work correctly',
        'Admin panel works normally with real data'
      ]
    }
  ];

  const handleNextStep = () => {
    if (currentStep < testingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentStepData = testingSteps[currentStep];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <TestTube className="h-12 w-12 text-blue-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Complete App Testing Guide</h1>
          </div>
          <p className="text-lg text-gray-600">
            Test the entire application flow - only ResellerClub API calls are simulated
          </p>
        </div>

        {/* Testing Mode Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isTestingMode ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                {isTestingMode ? (
                  <CheckCircle className="h-6 w-6 text-yellow-600" />
                ) : (
                  <TestTube className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Testing Mode Status
                </h3>
                <p className="text-sm text-gray-600">
                  {isTestingMode ? 'Active - Ready for testing' : 'Inactive - Enable to start testing'}
                </p>
              </div>
            </div>

            <Button
              onClick={toggleTestingMode}
              className={isTestingMode ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}
            >
              {isTestingMode ? 'Disable Testing Mode' : 'Enable Testing Mode'}
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Testing Progress</h3>
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {testingSteps.length}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / testingSteps.length) * 100}%` }}
            />
          </div>

          <div className="flex justify-between">
            <Button
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </Button>
            <Button
              onClick={handleReset}
              className="bg-gray-500 hover:bg-gray-600"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={currentStep === testingSteps.length - 1}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </Button>
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="bg-blue-100 rounded-lg p-4">
                <currentStepData.icon className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-gray-600 mb-6">
                {currentStepData.description}
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Step-by-step instructions:</h4>
                <ul className="space-y-2">
                  {currentStepData.details.map((detail, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center space-x-4">
                <Link href={currentStepData.href}>
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    <currentStepData.icon className="h-4 w-4 mr-2" />
                    {currentStepData.action}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>

                {currentStepData.id === 'enable-testing' && !isTestingMode && (
                  <div className="text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
                    ⚠️ Enable testing mode first to see mock data
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/" className="block">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <Globe className="h-8 w-8 text-blue-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Homepage</h3>
              <p className="text-sm text-gray-600">Test domain search functionality</p>
            </div>
          </Link>

          <Link href="/cart" className="block">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <ShoppingCart className="h-8 w-8 text-green-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Cart</h3>
              <p className="text-sm text-gray-600">Test cart management</p>
            </div>
          </Link>

          <Link href="/checkout" className="block">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <CreditCard className="h-8 w-8 text-purple-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Checkout</h3>
              <p className="text-sm text-gray-600">Test payment process</p>
            </div>
          </Link>

          <Link href="/dashboard" className="block">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <User className="h-8 w-8 text-orange-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-sm text-gray-600">Test user dashboard</p>
            </div>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
