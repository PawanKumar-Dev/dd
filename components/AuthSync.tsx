"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { syncAuthWithLocalStorage } from "@/lib/auth-sync";

export default function AuthSync() {
  const { data: session, status } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session && !isSyncing) {
      setIsSyncing(true);

      // Sync NextAuth session with localStorage and create JWT token
      syncAuthWithLocalStorage()
        .then((userData) => {
          if (userData) {
            console.log("Auth synced successfully:", userData);
          }
        })
        .catch((error) => {
          console.error("Auth sync failed:", error);
          // Don't block the user if sync fails
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }
  }, [session, status, isSyncing]);

  return null; // This component doesn't render anything
}
