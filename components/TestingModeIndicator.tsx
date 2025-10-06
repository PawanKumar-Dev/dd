'use client';

import { useTestingStore } from '@/store/testingStore';
import { AlertTriangle, TestTube, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TestingModeIndicator() {
  const { isTestingMode, toggleTestingMode } = useTestingStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Listen for storage changes and custom events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'testing-mode-storage') {
        // Force re-render when testing mode changes in another tab
        window.location.reload();
      }
    };

    const handleTestingModeChange = (e: any) => {
      // Re-render when testing mode changes in another tab
      window.location.reload();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('testing-mode-changed', handleTestingModeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('testing-mode-changed', handleTestingModeChange);
    };
  }, []);

  if (!isMounted || !isTestingMode || isDismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <TestTube className="h-5 w-5 animate-pulse mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-sm mb-1">Testing Mode Active</div>
            <div className="text-yellow-100 text-xs leading-relaxed">
              Domain searches return mock results • Domain registration is simulated • Cart, payments, and user management work normally
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-3">
          <button
            onClick={toggleTestingMode}
            className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap"
          >
            Disable
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-yellow-200 hover:text-white transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
