import toast from "react-hot-toast";
import { signOut } from "next-auth/react";

/**
 * Simple logout utility - same process for all users
 */
export const useLogout = () => {

  const logout = async () => {
    try {
      // Set logout flag to prevent AuthSync from re-syncing
      sessionStorage.setItem('isLoggingOut', 'true');

      // Sign out from NextAuth (handles social login sessions)
      // Wrap in try-catch in case NextAuth isn't ready yet
      try {
        await signOut({ redirect: false });
      } catch (signOutError) {
        console.warn('NextAuth signOut failed, continuing with logout:', signOutError);
      }

      // Clear all localStorage and sessionStorage data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');
      sessionStorage.clear();

      // Clear all cookies by setting them to expire
      const cookiesToClear = [
        'token',
        'next-auth.session-token',
        'next-auth.callback-url',
        'next-auth.csrf-token',
        '__Secure-next-auth.session-token',
        '__Host-next-auth.csrf-token'
      ];

      cookiesToClear.forEach(cookieName => {
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}`;
      });

      // Show success message
      toast.success('Logged out successfully');

      // Direct redirect to login
      setTimeout(() => {
        window.location.replace('/login');
      }, 500);

    } catch (error) {
      // Fallback: clear everything and redirect
      try {
        await signOut({ redirect: false });
      } catch (e) {
        // Silent fallback
      }
      localStorage.clear();
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      toast.success('Logged out successfully');
      setTimeout(() => {
        window.location.replace('/login');
      }, 500);
    }
  };

  return logout;
};

/**
 * Simple logout function - SAME process for ALL users (social + credential)
 */
export const logoutUser = async () => {
  try {
    // Set logout flag to prevent AuthSync from re-syncing
    sessionStorage.setItem('isLoggingOut', 'true');

    // Sign out from NextAuth (handles social login sessions)
    await signOut({ redirect: false });

    // Clear all localStorage and sessionStorage data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedEmail');
    sessionStorage.clear();

    // Clear all cookies
    const cookiesToClear = [
      'token',
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token'
    ];

    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}`;
    });

    // Show success message
    toast.success('Logged out successfully');

    // Direct redirect to login
    window.location.replace('/login');

  } catch (error) {
    // Fallback: clear everything and redirect
    try {
      await signOut({ redirect: false });
    } catch (e) {
      // Silent fallback
    }
    localStorage.clear();
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    toast.success('Logged out successfully');
    setTimeout(() => {
      window.location.replace('/login');
    }, 500);
  }
};