import { getSession } from "next-auth/react";

/**
 * Sync NextAuth session with localStorage for compatibility with existing auth system
 */
export async function syncAuthWithLocalStorage() {
  try {
    console.log("🔄 [AuthSync] Starting session sync...");

    const session = await getSession();
    console.log("📊 [AuthSync] Session data:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      email: session?.user?.email,
    });

    if (session?.user) {
      // Check if user already has data in localStorage (to preserve profileCompleted)
      const existingUserData = localStorage.getItem("user");
      let existingProfileCompleted = false;

      if (existingUserData) {
        try {
          const existing = JSON.parse(existingUserData);
          existingProfileCompleted = existing.profileCompleted === true;
          console.log("📦 [AuthSync] Existing user data found:", {
            profileCompleted: existingProfileCompleted,
          });
        } catch (e) {
          console.warn("⚠️ [AuthSync] Failed to parse existing user data:", e);
        }
      }

      // Create a compatible user object for localStorage
      // IMPORTANT: Preserve existing profileCompleted status if user already had one
      const userData = {
        id: (session.user as any).id,
        email: session.user.email || "",
        firstName: session.user.name?.split(" ")[0] || "",
        lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
        role: (session.user as any).role || "user",
        // Preserve existing profileCompleted or use session value, never default to false if they had true
        profileCompleted:
          existingProfileCompleted ||
          (session.user as any).profileCompleted ||
          false,
      };

      console.log("💾 [AuthSync] Saving user data to localStorage:", userData);
      // Store in localStorage for compatibility
      localStorage.setItem("user", JSON.stringify(userData));

      // Fetch a proper JWT token from the server
      try {
        console.log("🔑 [AuthSync] Fetching JWT token from server...");

        const syncResponse = await fetch("/api/auth/sync-token", {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        console.log("📡 [AuthSync] Server response:", {
          ok: syncResponse.ok,
          status: syncResponse.status,
        });

        if (syncResponse.ok) {
          const data = await syncResponse.json();
          if (data.token) {
            console.log("✅ [AuthSync] JWT token received and stored");
            // Store token in localStorage
            localStorage.setItem("token", data.token);
            // Cookie is already set by the server
          } else {
            console.warn("⚠️ [AuthSync] No token in response:", data);
          }
        } else {
          console.error(
            "❌ [AuthSync] Server returned error:",
            syncResponse.status
          );
          throw new Error(`Server returned ${syncResponse.status}`);
        }
      } catch (error) {
        console.error("❌ [AuthSync] Failed to sync token with server:", error);
        console.log("🔄 [AuthSync] Falling back to client-side token...");

        // Fallback: create base64 token for client-side
        const tokenPayload = {
          userId: (session.user as any).id,
          email: session.user.email || "",
          role: (session.user as any).role || "user",
          jti: `${(session.user as any).id}_${Date.now()}`,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
          iss: "excel-technologies",
          aud: "domain-management-system",
        };

        const token = btoa(JSON.stringify(tokenPayload));
        localStorage.setItem("token", token);
        document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}`;
        console.log("✅ [AuthSync] Fallback token created");
      }

      console.log("✅ [AuthSync] Sync completed successfully");
      return userData;
    }

    console.warn("⚠️ [AuthSync] No session found");
    return null;
  } catch (error) {
    console.error("❌ [AuthSync] Error during sync:", error);
    throw error; // Re-throw to let caller handle it
  }
}

/**
 * Clear auth data from localStorage
 */
export function clearAuthFromLocalStorage() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
