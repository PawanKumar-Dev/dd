"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { syncAuthWithLocalStorage } from "@/lib/auth-sync";

export default function AuthSync() {
  const { data: session, status } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't sync on login page to avoid conflicts during logout
    if (pathname === "/login") {
      return;
    }

    // Check if user is in the process of logging out
    if (typeof window !== "undefined") {
      const isLoggingOut = sessionStorage.getItem("isLoggingOut");
      if (isLoggingOut === "true") {
        console.log("🚫 [AuthSync] Logout in progress, skipping sync");
        return; // Don't sync during logout
      }
    }

    if (status === "authenticated" && session && !isSyncing) {
      console.log("✅ [AuthSync] Session authenticated, starting sync...");
      setIsSyncing(true);

      // Sync NextAuth session with localStorage and create JWT token
      syncAuthWithLocalStorage()
        .then((userData) => {
          console.log("✅ [AuthSync] Sync completed successfully");
        })
        .catch((error) => {
          console.warn("⚠️ [AuthSync] Sync failed:", error);
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }

    // Clear any old logout flags when session is unauthenticated
    if (status === "unauthenticated" && typeof window !== "undefined") {
      const wasLoggingOut = sessionStorage.getItem("isLoggingOut");
      if (wasLoggingOut === "true") {
        console.log("🧹 [AuthSync] Clearing logout flag after session ended");
        sessionStorage.removeItem("isLoggingOut");
      }
    }
  }, [session, status, isSyncing, pathname]);

  return null; // This component doesn't render anything
}
