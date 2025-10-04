'use client';

import { useState, useEffect } from 'react';

export default function SimplePage() {
  const [test, setTest] = useState('Hello World');

  useEffect(() => {
    console.log('Simple page loaded');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{test}</h1>
        <p className="text-gray-600">This is a simple test page with hooks.</p>
        <button
          onClick={() => setTest(test === 'Hello World' ? 'React is working!' : 'Hello World')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Button
        </button>
      </div>
    </div>
  );
}
