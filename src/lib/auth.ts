import { NextAuthOptions, getServerSession as _getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { SupabaseAdapter } from '@next-auth/supabase-adapter'
import jwt from 'jsonwebtoken'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'vipaymanshalaby@gmail.com'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      // Allow all sign ins
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        // Assign admin plan to admin email, else default free
        token.plan = user.email === ADMIN_EMAIL ? 'admin' : 'free'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.plan = token.plan as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export function getServerSession() {
  return _getServerSession(authOptions)
}

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      plan: string
    }
  }

  interface User {
    id: string
    plan?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    plan: string
  }
}
