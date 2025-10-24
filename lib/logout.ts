import toast from "react-hot-toast";

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
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'next-auth.callback-url=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'next-auth.csrf-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      // Step 3: Show success message
      toast.success('Logged out successfully');

      // Step 4: Use NextAuth signout to clear all sessions (works for both social and credential)
      console.log('🔄 Using NextAuth signout to clear all sessions...');
      setTimeout(() => {
        window.location.href = '/api/auth/signout?callbackUrl=' + encodeURIComponent('/login');
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
      setTimeout(() => {
        window.location.href = '/api/auth/signout?callbackUrl=' + encodeURIComponent('/login');
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
    console.log('✅ Showing success message...');
    toast.success('Logged out successfully');

    // Always use NextAuth signout to clear all sessions (works for both social and credential)
    console.log('🔄 Using NextAuth signout to clear all sessions...');
    window.location.href = '/api/auth/signout?callbackUrl=' + encodeURIComponent('/login');

  } catch (error) {
    console.error('❌ Direct logout error:', error);
    // Fallback: clear everything and redirect
    localStorage.clear();
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    toast.success('Logged out successfully');
    setTimeout(() => {
      window.location.href = '/api/auth/signout?callbackUrl=' + encodeURIComponent('/login');
    }, 100);
  }
};