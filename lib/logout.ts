import toast from "react-hot-toast";
import { signOut } from "next-auth/react";

/**
 * Simple logout utility - same process for all users
 */
export const useLogout = () => {

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');

      // Set logout flag to prevent AuthSync from re-syncing
      sessionStorage.setItem('isLoggingOut', 'true');

      // Get user data for debugging
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          console.log('🔍 Logging out user:', {
            email: user.email,
            provider: user.provider,
            role: user.role
          });
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }

      // Step 1: Sign out from NextAuth (handles social login sessions)
      console.log('🔐 Signing out from NextAuth...');
      await signOut({ redirect: false });

      // Step 2: Clear all localStorage and sessionStorage data
      console.log('🧹 Clearing localStorage and sessionStorage...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');
      sessionStorage.clear(); // Clear all session storage including logout flag

      // Step 3: Clear all cookies manually (more aggressive approach)
      console.log('🍪 Clearing cookies...');

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

      // Step 4: Show success message
      toast.success('Logged out successfully');
      console.log('✅ Logout successful!');

      // Step 5: Direct redirect to login (same for all users)
      // Use replace() to prevent back button from returning to authenticated page
      console.log('🔄 Redirecting to login page...');
      setTimeout(() => {
        window.location.replace('/login');
      }, 500);

    } catch (error) {
      console.error('❌ Logout error:', error);
      // Fallback: clear everything and redirect
      try {
        await signOut({ redirect: false });
      } catch (e) {
        console.error('NextAuth signOut failed:', e);
      }
      localStorage.clear();
      // Clear all cookies
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      toast.success('Logged out successfully');
      console.log('✅ Logout successful!');
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
    console.log('🚪 Direct logout function called...');

    // Set logout flag to prevent AuthSync from re-syncing
    sessionStorage.setItem('isLoggingOut', 'true');

    // Get user data for debugging
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('🔍 Logging out user:', {
          email: user.email,
          provider: user.provider || 'credential',
          role: user.role
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Sign out from NextAuth (handles social login sessions)
    console.log('🔐 Signing out from NextAuth...');
    await signOut({ redirect: false });

    // Clear all localStorage and sessionStorage data
    console.log('🧹 Clearing localStorage and sessionStorage...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedEmail');
    sessionStorage.clear(); // Clear all session storage including logout flag

    // Clear all cookies
    console.log('🍪 Clearing cookies...');
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
    console.log('✅ Logout successful!');

    // Direct redirect to login (same for all users)
    // Use replace() to prevent back button from returning to authenticated page
    console.log('🔄 Redirecting to login page...');
    window.location.replace('/login');

  } catch (error) {
    console.error('❌ Direct logout error:', error);
    // Fallback: clear everything and redirect
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.error('NextAuth signOut failed:', e);
    }
    localStorage.clear();
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    toast.success('Logged out successfully');
    console.log('✅ Logout successful!');
    setTimeout(() => {
      window.location.replace('/login');
    }, 500);
  }
};