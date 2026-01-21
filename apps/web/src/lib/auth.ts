import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { getDb } from "@/lib/db";
import { users } from "@psico-pay/db/schema";
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

        return {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          role: foundUser.role,
        };
      },
    }),
  ],
});
