import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Custom hook to prevent user from leaving page during critical operations
 * @param isBlocking - Whether to block navigation
 * @param message - Custom message to show to user
 */
export function usePreventNavigation(isBlocking: boolean, message?: string) {
  const router = useRouter();

  useEffect(() => {
    if (!isBlocking) return;

    const defaultMessage =
      "Are you sure you want to leave? Your changes may not be saved.";
    const warningMessage = message || defaultMessage;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = warningMessage;
      return warningMessage;
    };

    const handleRouteChange = (url: string) => {
      if (isBlocking) {
        const confirmed = window.confirm(warningMessage);
        if (!confirmed) {
          throw new Error("Route change cancelled by user");
        }
      }
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);

    // For Next.js App Router, we need to handle programmatic navigation differently
    // We'll override the router.push method temporarily
    const originalPush = router.push;
    const originalBack = router.back;
    const originalReplace = router.replace;

    router.push = (href: string, options?: any) => {
      if (isBlocking) {
        const confirmed = window.confirm(warningMessage);
        if (!confirmed) return Promise.resolve(false);
      }
      return originalPush.call(router, href, options);
    };

    router.back = () => {
      if (isBlocking) {
        const confirmed = window.confirm(warningMessage);
        if (!confirmed) return;
      }
      return originalBack.call(router);
    };

    router.replace = (href: string, options?: any) => {
      if (isBlocking) {
        const confirmed = window.confirm(warningMessage);
        if (!confirmed) return Promise.resolve(false);
      }
      return originalReplace.call(router, href, options);
    };

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Restore original router methods
      router.push = originalPush;
      router.back = originalBack;
      router.replace = originalReplace;
    };
  }, [isBlocking, message, router]);
}
