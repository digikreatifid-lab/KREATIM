import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Prisma imports) shared by middleware and the
 * full server config in `src/auth.ts`.
 */
export const authConfig = {
  // Self-hosted on a VPS behind a reverse proxy (PRD §4), so trust the Host header.
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;
      const isProtected = pathname.startsWith("/dashboard");
      if (isProtected) return isLoggedIn;
      if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      return true;
    },
    session({ session, token }) {
      if (token.uid && session.user) session.user.id = token.uid as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
