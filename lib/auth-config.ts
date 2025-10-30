import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { serverLogger } from "@/lib/logger";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request additional scopes for more user data
          scope:
            "openid email profile https://www.googleapis.com/auth/user.phonenumbers.read https://www.googleapis.com/auth/user.addresses.read",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      // Request additional profile fields
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // Additional fields from Google profile
          given_name: profile.given_name,
          family_name: profile.family_name,
          locale: profile.locale,
        };
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "dummy",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "dummy",
      authorization: {
        params: {
          // Request additional permissions for phone and address
          scope: "email,public_profile,user_location,user_mobile_phone",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        recaptchaToken: { label: "ReCaptcha Token", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          // Verify reCAPTCHA if token provided
          // TEMPORARILY DISABLED FOR TESTING
          /*
          if (credentials.recaptchaToken) {
            try {
              const recaptchaResponse = await fetch(
                `https://www.google.com/recaptcha/api/siteverify`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${credentials.recaptchaToken}`,
                }
              );

              const recaptchaData = await recaptchaResponse.json();

              if (!recaptchaData.success || recaptchaData.score < 0.5) {
                serverLogger.warn("reCAPTCHA verification failed");
                throw new Error("reCAPTCHA verification failed");
              }
            } catch (error) {
              serverLogger.error("reCAPTCHA error");
              // Don't block login if reCAPTCHA service is down
              // throw new Error("reCAPTCHA verification failed");
            }
          }
          */

          await connectDB();

          const user = await User.findOne({ email: credentials.email });
          if (!user) {
            throw new Error("Invalid email or password");
          }

          // Check if user is activated
          if (!user.isActivated) {
            throw new Error("AccountNotActivated");
          }

          // Check if user is active
          if (!user.isActive) {
            throw new Error("AccountDeactivated");
          }

          // Verify password
          const isPasswordValid = await user.comparePassword(
            credentials.password
          );
          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user._id?.toString() || "",
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          };
        } catch (error: any) {
          serverLogger.error("Authentication error");
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Prevent admin users from using social login
      if (account?.provider === "google" || account?.provider === "facebook") {
        await connectDB();

        // Check if this email belongs to an admin user
        const existingUser = await User.findOne({
          email: user.email,
          role: "admin",
        });

        if (existingUser) {
          return false; // Block admin users from social login
        }
      }

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user && account) {
        await connectDB();

        // Handle social login user creation/update
        if (account.provider === "google" || account.provider === "facebook") {
          let dbUser = await User.findOne({ email: user.email });

          // Fetch additional user data from Google/Facebook if access token available
          let additionalData: any = {};

          if (account.provider === "google" && account.access_token) {
            try {
              // Fetch phone numbers and addresses from Google People API
              const peopleResponse = await fetch(
                "https://people.googleapis.com/v1/people/me?personFields=phoneNumbers,addresses",
                {
                  headers: {
                    Authorization: `Bearer ${account.access_token}`,
                  },
                }
              );

              if (peopleResponse.ok) {
                const peopleData = await peopleResponse.json();

                // Extract phone number
                if (
                  peopleData.phoneNumbers &&
                  peopleData.phoneNumbers.length > 0
                ) {
                  const primaryPhone = peopleData.phoneNumbers[0].value;
                  // Parse phone number (assuming Indian format)
                  const cleanPhone = primaryPhone.replace(/\D/g, "");
                  if (cleanPhone.length === 10) {
                    additionalData.phone = cleanPhone;
                    additionalData.phoneCc = "+91";
                  } else if (cleanPhone.length > 10) {
                    additionalData.phone = cleanPhone.slice(-10);
                    additionalData.phoneCc = "+" + cleanPhone.slice(0, -10);
                  }
                }

                // Extract address
                if (peopleData.addresses && peopleData.addresses.length > 0) {
                  const primaryAddress = peopleData.addresses[0];
                  additionalData.address = {
                    line1: primaryAddress.streetAddress || "",
                    city: primaryAddress.city || "",
                    state: primaryAddress.region || "",
                    country: primaryAddress.countryCode || "IN",
                    zipcode: primaryAddress.postalCode || "",
                  };
                }
              }
            } catch (error) {
              // Silent fail - additional data is optional
            }
          }

          if (account.provider === "facebook" && account.access_token) {
            try {
              // Fetch user data from Facebook Graph API
              const fbResponse = await fetch(
                `https://graph.facebook.com/me?fields=mobile_phone,location{location{city,state,country,zip}}&access_token=${account.access_token}`
              );

              if (fbResponse.ok) {
                const fbData = await fbResponse.json();

                // Extract phone number
                if (fbData.mobile_phone) {
                  const cleanPhone = fbData.mobile_phone.replace(/\D/g, "");
                  if (cleanPhone.length === 10) {
                    additionalData.phone = cleanPhone;
                    additionalData.phoneCc = "+91";
                  } else if (cleanPhone.length > 10) {
                    additionalData.phone = cleanPhone.slice(-10);
                    additionalData.phoneCc = "+" + cleanPhone.slice(0, -10);
                  }
                }

                // Extract address from location
                if (fbData.location && fbData.location.location) {
                  const loc = fbData.location.location;
                  additionalData.address = {
                    line1: "",
                    city: loc.city || "",
                    state: loc.state || "",
                    country: loc.country || "IN",
                    zipcode: loc.zip || "",
                  };
                }
              }
            } catch (error) {
              // Silent fail - additional data is optional
            }
          }

          if (!dbUser) {
            // Create new user from social login with enhanced profile data
            const firstName =
              (profile as any)?.given_name || user.name?.split(" ")[0] || "";
            const lastName =
              (profile as any)?.family_name ||
              user.name?.split(" ").slice(1).join(" ") ||
              "";

            // Check if we have enough data to mark profile as complete
            const hasPhone = additionalData.phone && additionalData.phoneCc;
            const hasAddress =
              additionalData.address &&
              additionalData.address.line1 &&
              additionalData.address.city;
            const isProfileComplete = hasPhone && hasAddress;

            dbUser = new User({
              email: user.email,
              firstName,
              lastName,
              // Auto-populate phone if available from Google
              phone: additionalData.phone || undefined,
              phoneCc: additionalData.phoneCc || undefined,
              // Auto-populate address if available from Google
              address: additionalData.address || undefined,
              provider: account.provider,
              providerId: account.providerAccountId,
              role: "user",
              isActive: true,
              isActivated: true,
              // Mark as complete if we have all required fields
              profileCompleted: isProfileComplete,
            });

            await dbUser.save();

            // Only send profile completion email if profile is incomplete
            if (!isProfileComplete) {
              const { EmailService } = await import("@/lib/email");
              EmailService.sendProfileCompletionEmail(
                user.email || "",
                `${firstName} ${lastName}`.trim()
              ).catch((error) => {
                serverLogger.error("Profile completion email failed");
              });
            }
          } else {
            // Existing user found - update with social data and auto-populate missing fields
            let needsUpdate = false;

            // Auto-populate missing phone number from Google
            if (
              additionalData.phone &&
              additionalData.phoneCc &&
              !dbUser.phone
            ) {
              dbUser.phone = additionalData.phone;
              dbUser.phoneCc = additionalData.phoneCc;
              needsUpdate = true;
            }

            // Auto-populate missing address from Google
            if (additionalData.address && additionalData.address.line1) {
              if (!dbUser.address || !dbUser.address.line1) {
                dbUser.address = additionalData.address;
                needsUpdate = true;
              }
            }

            // Update name if better data available
            if ((profile as any)?.given_name && !dbUser.firstName) {
              dbUser.firstName = (profile as any).given_name;
              needsUpdate = true;
            }
            if ((profile as any)?.family_name && !dbUser.lastName) {
              dbUser.lastName = (profile as any).family_name;
              needsUpdate = true;
            }

            // Check if user now has a complete profile after auto-population
            const hasCompleteProfile = dbUser.profileCompleted === true;
            const hasAddress =
              dbUser.address && dbUser.address.line1 && dbUser.address.city;
            const hasPhone = dbUser.phone && dbUser.phoneCc;

            // If user has all required fields, they have a complete profile
            const isProfileActuallyComplete =
              hasCompleteProfile || (hasAddress && hasPhone);

            // Only update provider if they don't have one
            // Do NOT overwrite "credentials" provider to preserve password login
            if (!dbUser.provider) {
              dbUser.provider = account.provider;
              dbUser.providerId = account.providerAccountId;
              needsUpdate = true;
            }

            // Always ensure social login users are activated
            if (!dbUser.isActivated) {
              dbUser.isActivated = true;
              needsUpdate = true;
            }

            // Update profileCompleted status based on actual data
            if (isProfileActuallyComplete && !dbUser.profileCompleted) {
              dbUser.profileCompleted = true;
              needsUpdate = true;
            }

            // Save only if there are updates
            if (needsUpdate) {
              await dbUser.save();
            }
          }

          token.role = dbUser.role;
          token.id = dbUser._id?.toString() || "";
          token.profileCompleted = dbUser.profileCompleted;
          token.provider = account.provider;
        } else if (user) {
          // Regular credential login
          token.role = (user as any).role;
          token.id = (user as any).id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).profileCompleted =
          token.profileCompleted as boolean;
        (session.user as any).provider = token.provider as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: false, // Disable debug to reduce console noise
  logger: {
    error(code, metadata) {
      // Only log actual errors to server logs
      if (code !== "CLIENT_FETCH_ERROR" && code !== "DEBUG_ENABLED") {
        serverLogger.error("NextAuth Error:", code);
      }
    },
    warn(code) {
      // Suppress warnings for security
    },
    debug(code, metadata) {
      // Debug logging disabled
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 15 minutes
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 15 minutes
      },
    },
    nonce: {
      name: `next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};
