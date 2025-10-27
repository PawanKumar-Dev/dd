import { useEffect, useState } from "react";
import { RecaptchaClient } from "@/lib/recaptcha";

/**
 * React hook for Google reCAPTCHA v3
 */
export function useRecaptcha() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    RecaptchaClient.loadScript()
      .then(() => setIsLoaded(true))
      .catch((err) => {
        setError(err.message);
        console.error("Failed to load reCAPTCHA:", err);
      });
  }, []);

  /**
   * Execute reCAPTCHA and get token
   */
  const executeRecaptcha = async (action: string): Promise<string | null> => {
    try {
      if (!isLoaded) {
        console.warn("reCAPTCHA not loaded yet");
        return null;
      }

      const token = await RecaptchaClient.getToken(action);
      return token;
    } catch (err) {
      console.error("reCAPTCHA execution error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  };

  return {
    isLoaded,
    error,
    executeRecaptcha,
  };
}
