'use client';

import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { DomainRequirement } from '@/lib/domainRequirements';

interface DomainRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainName: string;
  requirements: DomainRequirement;
  onContactSupport?: () => void;
}

export default function DomainRequirementsModal({
  isOpen,
  onClose,
  domainName,
  requirements,
  onContactSupport
}: DomainRequirementsModalProps) {
  if (!isOpen) return null;

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      // Default action - open email client
      const subject = `Domain Registration Support - ${domainName}`;
      const body = `Hi,\n\nI would like to register the domain ${domainName} but I see it requires additional details.\n\nCould you please help me with the registration process?\n\nThanks!`;
      window.open(`mailto:support@exceltechnologies.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Domain Registration Requirements
              </h2>
              <p className="text-sm text-gray-600">
                {domainName} requires additional verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Domain Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-medium text-gray-900">{domainName}</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                {requirements.name}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              This domain requires additional business verification and cannot be registered through our standard process.
            </p>
          </div>

          {/* Warning Message */}
          {requirements.warningMessage && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-orange-800">Important Notice</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    {requirements.warningMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Requirements */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Required Information</h3>
            <div className="space-y-2">
              {requirements.requirements.map((requirement, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{requirement}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Restrictions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Restrictions</h3>
            <div className="space-y-2">
              {requirements.restrictions.map((restriction, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{restriction}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alternative Domains */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Alternative Options</h3>
            <p className="text-sm text-blue-700 mb-3">
              Consider these similar domains that don't require additional verification:
            </p>
            <div className="flex flex-wrap gap-2">
              {['.com', '.net', '.org', '.info', '.biz'].map((tld) => {
                const baseDomain = domainName.split('.').slice(0, -1).join('.');
                return (
                  <button
                    key={tld}
                    onClick={() => {
                      // This would trigger a search for the alternative domain
                      window.location.href = `/?search=${baseDomain}${tld}`;
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200 transition-colors"
                  >
                    {baseDomain}{tld}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handleContactSupport}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
