"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertTriangle, X } from "lucide-react";

interface ProfileCompletionWarningProps {
  className?: string;
}

export default function ProfileCompletionWarning({ className = "" }: ProfileCompletionWarningProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user is from social login and profile is not completed
    if (session?.user) {
      const profileCompleted = (session.user as any).profileCompleted;
      const provider = (session.user as any).provider;

      // Show warning if:
      // 1. User is from social login (has provider) OR profile is explicitly not completed
      // 2. Profile is not completed
      // 3. Warning hasn't been dismissed
      const isSocialLogin = provider && (provider === 'google' || provider === 'facebook');
      const needsProfileCompletion = profileCompleted === false;

      if ((isSocialLogin || needsProfileCompletion) && !isDismissed) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }
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
