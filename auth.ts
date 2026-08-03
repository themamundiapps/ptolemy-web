import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/** JWT session strategy (no adapter/database) -- persistence is a signed
 * cookie, sufficient for "stay signed in across visits" without standing up
 * a database, which is out of scope until the data-migration command. The
 * Google account id (`sub`) is threaded from the OAuth profile into the JWT
 * and then into the session, since that id is what keys the backend's
 * per-account chart store and rate limit. */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, profile }) {
      if (profile?.sub) token.sub = profile.sub;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
