import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password');
        }

        if (!user.emailVerified) {
          throw new Error('Please verify your email before logging in');
        }

        if (user.isSuspended) {
          throw new Error('Your account has been suspended');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/dashboard',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }

      // Fetch fresh user data on sign-in or update
      if (trigger === 'signIn' || trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            tier: true,
            isAdmin: true,
            isSuspended: true,
          },
        });

        if (dbUser) {
          token.tier = dbUser.tier;
          token.isAdmin = dbUser.isAdmin;
          token.isSuspended = dbUser.isSuspended;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.tier = token.tier as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Check if user is suspended
      if (user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isSuspended: true },
        });

        if (dbUser?.isSuspended) {
          return false;
        }
      }

      return true;
    },
  },
  events: {
    async signIn({ user }) {
      // Update last login for OAuth users
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

// Type declarations for next-auth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      tier: string;
      isAdmin: boolean;
    };
  }

  interface User {
    tier?: string;
    isAdmin?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    tier: string;
    isAdmin: boolean;
    isSuspended: boolean;
  }
}
