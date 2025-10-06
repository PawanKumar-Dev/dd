'use client';

import { useTestingStore } from '@/store/testingStore';
import { TestTube, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TestingModeStatusProps {
  className?: string;
  showDetails?: boolean;
}

export default function TestingModeStatus({
  className = '',
  showDetails = false
}: TestingModeStatusProps) {
  const { isTestingMode } = useTestingStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isTestingMode) return null;

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <TestTube className="h-5 w-5 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Testing Mode Active
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            This page is running in testing mode. Only ResellerClub API calls are simulated.
          </p>

          {showDetails && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center space-x-2 text-xs text-yellow-700">
                <CheckCircle className="h-3 w-3" />
                <span>Domain searches return mock available domains</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-yellow-700">
                <CheckCircle className="h-3 w-3" />
                <span>Domain registration is simulated</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-yellow-700">
                <CheckCircle className="h-3 w-3" />
                <span>Cart, payments, and user management work normally</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-yellow-700">
                <CheckCircle className="h-3 w-3" />
                <span>Only ResellerClub API calls are mocked</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
