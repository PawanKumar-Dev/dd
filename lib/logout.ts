import toast from "react-hot-toast";
import { signOut } from "next-auth/react";

/**
 * Simple logout utility - same process for all users
 */
export const useLogout = () => {

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');

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

      // Step 1: Clear all localStorage data
      console.log('🧹 Clearing localStorage...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');

      // Step 2: Clear all cookies manually
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

      // Step 3: Show success message
      toast.success('Logged out successfully');
      console.log('✅ Logout successful!');

      // Step 4: Direct redirect to login (all cleanup done above)
      console.log('🔄 Redirecting to login page...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 500); // Small delay to ensure toast is visible

    } catch (error) {
      console.error('❌ Logout error:', error);
      // Fallback: clear everything and redirect
      localStorage.clear();
      // Clear all cookies
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      toast.success('Logged out successfully');
      console.log('✅ Logout successful!');
      setTimeout(() => {
        window.location.href = '/login';
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

    // Clear all localStorage data
    console.log('🧹 Clearing localStorage...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedEmail');

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

    // Direct redirect to login (all cleanup done above)
    console.log('🔄 Redirecting to login page...');
    window.location.href = '/login';

  } catch (error) {
    console.error('❌ Direct logout error:', error);
    // Fallback: clear everything and redirect
    localStorage.clear();
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    toast.success('Logged out successfully');
    console.log('✅ Logout successful!');
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  }
};