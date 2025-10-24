import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

/**
 * Comprehensive logout utility that handles both social login and credential users
 */
export const useLogout = () => {
  const router = useRouter();

  const logout = async () => {
    try {
      // Check if user is from social login by checking localStorage
      const userData = localStorage.getItem('user');
      let isSocialLogin = false;

      if (userData) {
        try {
          const user = JSON.parse(userData);
          isSocialLogin = user.provider && (user.provider === 'google' || user.provider === 'facebook');
        } catch (error) {
          console.error('Error parsing user data during logout:', error);
        }
      }

      // Clear localStorage first
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (isSocialLogin) {
        // For social login users, use NextAuth signOut
        await signOut({
          redirect: false, // Don't redirect automatically
          callbackUrl: '/login'
        });
      }

      // Redirect to login page
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, still redirect to login
      router.push('/login');
      toast.success('Logged out successfully');
    }
  };

  return logout;
};

/**
 * Simple logout function for use in components that don't use hooks
 */
export const logoutUser = async () => {
  try {
    // Check if user is from social login
    const userData = localStorage.getItem('user');
    let isSocialLogin = false;

    if (userData) {
      try {
        const user = JSON.parse(userData);
        isSocialLogin = user.provider && (user.provider === 'google' || user.provider === 'facebook');
      } catch (error) {
        console.error('Error parsing user data during logout:', error);
      }
    }

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (isSocialLogin) {
      // For social login users, use NextAuth signOut
      await signOut({
        redirect: true,
        callbackUrl: '/login'
      });
    } else {
      // For credential users, just redirect
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback: just redirect to login
    window.location.href = '/login';
  }
};