import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { getDb } from "@/lib/db";
import { users, therapists, oauthTokens } from "@psico-pay/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events.readonly",
          ].join(" "),
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const db = getDb();
        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (user.length === 0) {
          return null;
        }

        const foundUser = user[0];

        if (!foundUser.isActive) {
          return null;
        }

        const passwordMatch = await compare(password, foundUser.passwordHash);
        if (!passwordMatch) {
          return null;
        }

        // Update last login
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, foundUser.id));

        // Check if user has an associated therapist
        const therapist = await db
          .select()
          .from(therapists)
          .where(eq(therapists.userId, foundUser.id))
          .limit(1);

        return {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          role: foundUser.role,
          therapistId: therapist.length > 0 ? therapist[0].id : undefined,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      // For Google OAuth, create or update therapist record
      if (account?.provider === "google" && profile?.email) {
        const db = getDb();

        try {
          // Check if therapist already exists with this Google ID
          let existingTherapist = await db
            .select()
            .from(therapists)
            .where(eq(therapists.googleId, profile.sub as string))
            .limit(1);

          if (existingTherapist.length === 0) {
            // Check if therapist exists with this email (might have been created via credentials)
            existingTherapist = await db
              .select()
              .from(therapists)
              .where(eq(therapists.email, profile.email))
              .limit(1);
          }

          if (existingTherapist.length === 0) {
            // Create new therapist
            const [newTherapist] = await db
              .insert(therapists)
              .values({
                googleId: profile.sub as string,
                email: profile.email,
                name: profile.name || profile.email.split("@")[0],
                profilePictureUrl: profile.picture as string | undefined,
                lastLoginAt: new Date(),
              })
              .returning();

            // Store OAuth tokens
            if (account.access_token && account.refresh_token) {
              await db.insert(oauthTokens).values({
                therapistId: newTherapist.id,
                provider: "google",
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                expiresAt: new Date(Date.now() + (account.expires_in || 3600) * 1000),
                scope: account.scope || null,
              });
            }
          } else {
            // Update existing therapist
            const therapist = existingTherapist[0];
            await db
              .update(therapists)
              .set({
                googleId: profile.sub as string,
                name: profile.name || therapist.name,
                profilePictureUrl: profile.picture as string | undefined,
                lastLoginAt: new Date(),
              })
              .where(eq(therapists.id, therapist.id));

            // Update or create OAuth tokens
            if (account.access_token && account.refresh_token) {
              await db
                .insert(oauthTokens)
                .values({
                  therapistId: therapist.id,
                  provider: "google",
                  accessToken: account.access_token,
                  refreshToken: account.refresh_token,
                  expiresAt: new Date(Date.now() + (account.expires_in || 3600) * 1000),
                  scope: account.scope || null,
                })
                .onConflictDoUpdate({
                  target: [oauthTokens.therapistId, oauthTokens.provider],
                  set: {
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    expiresAt: new Date(Date.now() + (account.expires_in || 3600) * 1000),
                    scope: account.scope || null,
                    updatedAt: new Date(),
                  },
                });
            }
          }
        } catch (error) {
          console.error("Error in Google sign in callback:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account, profile }) {
      // On initial sign in with credentials
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.therapistId = (user as { therapistId?: string }).therapistId;
      }

      // On initial sign in with Google OAuth
      if (account?.provider === "google" && profile?.email) {
        const db = getDb();
        const therapist = await db
          .select()
          .from(therapists)
          .where(eq(therapists.googleId, profile.sub as string))
          .limit(1);

        if (therapist.length > 0) {
          token.therapistId = therapist[0].id;
          token.role = "therapist";
          token.id = therapist[0].id; // Use therapist ID as user ID for OAuth users
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.therapistId = token.therapistId as string | undefined;
      }
      return session;
    },
  },
});
