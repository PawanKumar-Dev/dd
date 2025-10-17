'use client';

import React, { useState } from 'react';
import { DomainRequirementsModal } from '@/components';

export default function DomainRequirementsExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const requirements = [
    { text: 'Australian Business Number (ABN) or Australian Company Number (ACN)', required: true },
    { text: 'Australian presence or connection', required: true },
    { text: 'Business registration details', required: true },
    { text: 'Specific contact information requirements', required: true }
  ];

  const restrictions = [
    { text: 'Must have Australian business registration', type: 'warning' as const },
    { text: 'Cannot be registered by individuals without business connection', type: 'error' as const },
    { text: 'Requires additional verification process', type: 'info' as const }
  ];

  const alternativeDomains = [
    { domain: 'anutech.com', available: true, price: '$12.99/year' },
    { domain: 'anutech.net', available: true, price: '$14.99/year' },
    { domain: 'anutech.org', available: false },
    { domain: 'anutech.io', available: true, price: '$49.99/year' }
  ];

  return (
    <div className="p-8">
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
      >
        Show Domain Requirements Modal
      </button>

      <DomainRequirementsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        domain="anutech"
        tld=".au"
        requirements={requirements}
        restrictions={restrictions}
        alternativeDomains={alternativeDomains}
        onSelectAlternative={(domain) => {
          console.log('Selected alternative domain:', domain);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
