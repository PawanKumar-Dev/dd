'use client';

import { useState, useEffect } from 'react';
import { useTestingStore } from '@/store/testingStore';
import { AlertTriangle, CheckCircle, Settings } from 'lucide-react';

export default function TestingModeToggle() {
  const { isTestingMode, toggleTestingMode, setTestingMode } = useTestingStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      toggleTestingMode();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isTestingMode ? 'bg-yellow-100' : 'bg-gray-100'}`}>
            {isTestingMode ? (
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            ) : (
              <Settings className="h-6 w-6 text-gray-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Testing Mode
            </h3>
            <p className="text-sm text-gray-600">
              {isTestingMode
                ? 'Testing mode - Only ResellerClub API calls are simulated'
                : 'Production mode - All API calls are real'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${isTestingMode
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-green-100 text-green-800'
            }`}>
            {isTestingMode ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Testing</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Production</span>
              </>
            )}
          </div>

          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isTestingMode ? 'bg-yellow-500' : 'bg-gray-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTestingMode ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
      </div>

      {isTestingMode && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Testing mode is active. See the floating indicator in the bottom-right corner for details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
