import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { rateLimit } from "@/lib/rate-limit";
import { findOrCreateOAuthUser, verifyPassword } from "@/services/userService";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        // Slow down password guessing: 10 attempts per email per 10 minutes.
        if (!rateLimit(`login:${parsed.data.email.toLowerCase()}`, 10, 10 * 60_000)) return null;
        const user = await verifyPassword(parsed.data.email, parsed.data.password);
        return user ? { id: user.id, email: user.email, name: user.name } : null;
      },
    }),
    ...(googleEnabled ? [Google] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const dbUser = await findOrCreateOAuthUser({ email: user.email, name: user.name });
        user.id = dbUser.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
  },
});

export const isGoogleEnabled = googleEnabled;

/** Returns the signed-in user's id or null. Use in every API route (anti-IDOR). */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
