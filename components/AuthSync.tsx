"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { syncAuthWithLocalStorage } from "@/lib/auth-sync";

export default function AuthSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session) {
      // Sync NextAuth session with localStorage and create JWT token
      syncAuthWithLocalStorage().then((userData) => {
        if (userData) {
          console.log("Auth synced successfully:", userData);
        }
      }).catch((error) => {
        console.error("Auth sync failed:", error);
      });
    }
  }, [session, status]);

  return null; // This component doesn't render anything
}
