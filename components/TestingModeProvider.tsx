'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useTestingStore } from '@/store/testingStore';

interface TestingModeContextType {
  isTestingMode: boolean;
  toggleTestingMode: () => void;
  setTestingMode: (enabled: boolean) => void;
}

const TestingModeContext = createContext<TestingModeContextType | undefined>(undefined);

export function TestingModeProvider({ children }: { children: ReactNode }) {
  const testingStore = useTestingStore();

  return (
    <TestingModeContext.Provider value={testingStore}>
      {children}
    </TestingModeContext.Provider>
  );
}

export function useTestingMode() {
  const context = useContext(TestingModeContext);
  if (context === undefined) {
    throw new Error('useTestingMode must be used within a TestingModeProvider');
  }
  return context;
}
