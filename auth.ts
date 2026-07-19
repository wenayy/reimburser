import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";

// JWT sessions, no database adapter: the creators table is our only user
// record, linked via authId = "<provider>:<providerAccountId>". Auth.js reads
// AUTH_GOOGLE_ID/SECRET and AUTH_TWITTER_ID/SECRET from the environment.
declare module "next-auth" {
  interface Session {
    /** stable cross-login id, e.g. "google:1234567890" */
    uid?: string;
  }
}

/** X sign-in switches on automatically once AUTH_TWITTER_ID/SECRET are set. */
export const twitterEnabled = !!process.env.AUTH_TWITTER_ID;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: twitterEnabled ? [Google, Twitter] : [Google],
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, account }) {
      if (account) token.uid = `${account.provider}:${account.providerAccountId}`;
      return token;
    },
    session({ session, token }) {
      session.uid = token.uid as string | undefined;
      return session;
    },
  },
});
