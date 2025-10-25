import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // FacebookProvider({
    //   clientId: process.env.FACEBOOK_CLIENT_ID!,
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    // }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email });
        if (!user) {
          return null;
        }

        // Check if user is active and activated
        if (!user.isActive || !user.isActivated) {
          return null;
        }

        // Check if user is admin (prevent admin login through social auth)
        if (user.role === "admin") {
          return null;
        }

        const isPasswordValid = await user.comparePassword(
          credentials.password
        );
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id?.toString() || '',
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        };
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

          if (!dbUser) {
            // Create new user from social login
            const nameParts = user.name?.split(" ") || ["", ""];
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            dbUser = new User({
              email: user.email,
              firstName,
              lastName,
              provider: account.provider,
              providerId: account.providerAccountId,
              role: "user",
              isActive: true,
              isActivated: true, // Social login users are auto-activated
              profileCompleted: false, // They need to complete profile for checkout
            });

            await dbUser.save();

            // Send profile completion email for new social login users
            const { EmailService } = await import("@/lib/email");
            EmailService.sendProfileCompletionEmail(
              user.email || '',
              `${firstName} ${lastName}`.trim()
            ).catch((error) => {
              console.error("Profile completion email failed:", error);
            });
          } else {
            // Existing user found - link social login to existing account
            // Check if user already has a complete profile from manual registration
            const hasCompleteProfile = dbUser.profileCompleted === true;
            const hasAddress = dbUser.address && dbUser.address.line1 && dbUser.address.city;
            const hasPhone = dbUser.phone && dbUser.phoneCc;
            
            // If user has all required fields, they have a complete profile
            const isProfileActuallyComplete = hasCompleteProfile || (hasAddress && hasPhone);
            
            // Only update provider if they don't have one, or it's credentials
            if (!dbUser.provider || dbUser.provider === "credentials") {
              // Link social account to existing credential account
              dbUser.provider = account.provider;
              dbUser.providerId = account.providerAccountId;
              dbUser.isActivated = true; // Auto-activate if they had an account
              
              // CRITICAL: Preserve profileCompleted status for manually registered users
              // Don't reset it to false if they already completed their profile
              if (isProfileActuallyComplete) {
                dbUser.profileCompleted = true;
              }
              
              await dbUser.save();
            }
          }

          token.role = dbUser.role;
          token.id = dbUser._id?.toString() || '';
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
      // Only log actual errors, not warnings
      if (code !== 'CLIENT_FETCH_ERROR' && code !== 'DEBUG_ENABLED') {
        console.error("NextAuth Error:", code, metadata);
      }
    },
    warn(code) {
      // Suppress debug warnings in development
      if (code !== 'DEBUG_ENABLED') {
        console.warn("NextAuth Warning:", code);
      }
    },
    debug(code, metadata) {
      // Disable debug logging completely
      // if (process.env.NODE_ENV === "development") {
      //   console.log("NextAuth Debug:", code, metadata);
      // }
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
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15 // 15 minutes
      }
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15 // 15 minutes
      }
    },
    nonce: {
      name: `next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
};
