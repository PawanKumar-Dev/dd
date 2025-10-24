"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertTriangle, X } from "lucide-react";

interface ProfileCompletionWarningProps {
  className?: string;
}

interface User {
  phone?: string;
  phoneCc?: string;
  companyName?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    country?: string;
    zipcode?: string;
  };
  profileCompleted?: boolean;
  provider?: string;
}

export default function ProfileCompletionWarning({ className = "" }: ProfileCompletionWarningProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkProfileCompletion = (userData: User): boolean => {
    // Check if all required fields are filled
    const hasPhone = !!(userData.phone && userData.phone.trim() !== '');
    const hasPhoneCc = !!(userData.phoneCc && userData.phoneCc.trim() !== '');
    const hasCompanyName = !!(userData.companyName && userData.companyName.trim() !== '');
    const hasAddress = !!(userData.address?.line1 && userData.address.line1.trim() !== '');
    const hasCity = !!(userData.address?.city && userData.address.city.trim() !== '');
    const hasState = !!(userData.address?.state && userData.address.state.trim() !== '');
    const hasCountry = !!(userData.address?.country && userData.address.country.trim() !== '');
    const hasZipcode = !!(userData.address?.zipcode && userData.address.zipcode.trim() !== '');

    return hasPhone && hasPhoneCc && hasCompanyName && hasAddress && hasCity && hasState && hasCountry && hasZipcode;
  };

  useEffect(() => {
    const checkUserProfile = () => {
      let userData: User | null = null;

      // Check both NextAuth session and localStorage for user data
      if (session?.user) {
        // User from NextAuth (social login)
        userData = session.user as any;
      } else {
        // Check localStorage for custom JWT user
        const localUserData = localStorage.getItem('user');
        if (localUserData) {
          try {
            userData = JSON.parse(localUserData);
          } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
          }
        }
      }

      if (userData) {
        // Only show warning for social login users
        const isSocialLogin = userData.provider && (userData.provider === 'google' || userData.provider === 'facebook');

        if (isSocialLogin) {
          // Check if profile is actually completed by validating all required fields
          const isProfileActuallyComplete = checkProfileCompletion(userData);

          // Show warning if profile is not actually complete and warning hasn't been dismissed
          if (!isProfileActuallyComplete && !isDismissed) {
            setShowWarning(true);
          } else {
            setShowWarning(false);
          }
        } else {
          // For credential-based users, never show the warning
          setShowWarning(false);
        }
      } else {
        setShowWarning(false);
      }
    };

    // Initial check
    checkUserProfile();

    // Listen for localStorage changes (when profile is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        checkUserProfile();
      }
    };

    // Listen for custom profile update events
    const handleProfileUpdate = (e: CustomEvent) => {
      checkUserProfile();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);

    // Also check periodically in case localStorage was updated in the same tab
    const interval = setInterval(checkUserProfile, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
      clearInterval(interval);
    };
  }, [session, isDismissed]);

  const handleCompleteProfile = () => {
    router.push("/dashboard/settings");
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowWarning(false);
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className={`bg-red-50 border-l-4 border-red-400 p-4 mb-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Profile Completion Required
              </h3>
              <div className="mt-1 text-sm text-red-700">
                You must complete your profile before you can proceed to checkout.
                Please fill in all the required fields below and save your changes.
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCompleteProfile}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Complete Profile
              </button>
              <button
                onClick={handleDismiss}
                className="text-red-400 hover:text-red-600 p-1"
                title="Dismiss warning"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
