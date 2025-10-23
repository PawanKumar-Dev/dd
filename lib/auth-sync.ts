import { getSession } from "next-auth/react";

/**
 * Sync NextAuth session with localStorage for compatibility with existing auth system
 */
export async function syncAuthWithLocalStorage() {
  try {
    const session = await getSession();

    if (session?.user) {
      // Create a compatible user object for localStorage
      const userData = {
        id: (session.user as any).id,
        email: session.user.email || "",
        firstName: session.user.name?.split(" ")[0] || "",
        lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
        role: (session.user as any).role || "user",
        profileCompleted: (session.user as any).profileCompleted || false,
      };

      // Store in localStorage for compatibility
      localStorage.setItem("user", JSON.stringify(userData));

      // Create a simple token for API compatibility (server will validate via NextAuth)
      // We'll use a base64 encoded payload that the server can decode
      const tokenPayload = {
        userId: (session.user as any).id,
        email: session.user.email || "",
        role: (session.user as any).role || "user",
        jti: `${(session.user as any).id}_${Date.now()}`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
        iss: "excel-technologies",
        aud: "domain-management-system",
      };

      const token = btoa(JSON.stringify(tokenPayload));

      localStorage.setItem("token", token);

      // Set cookie for server-side access
      document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}`;

      return userData;
    }

    return null;
  } catch (error) {
    console.error("Error syncing auth with localStorage:", error);
    return null;
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
