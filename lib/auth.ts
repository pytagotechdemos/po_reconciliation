import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        // Dummy users based on PRD roles
        const users = {
          procurement: { id: "1", name: "Procurement User", role: "procurement", password: "password123" },
          warehouse: { id: "2", name: "Warehouse User", role: "warehouse", password: "password123" },
          finance: { id: "3", name: "Finance User", role: "finance", password: "password123" },
        };

        const user = users[credentials.username as keyof typeof users];
        
        if (user && user.password === credentials.password) {
          return {
            id: user.id,
            name: user.name,
            role: user.role,
          };
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "default_secret_key_for_demo_purposes_only",
};
