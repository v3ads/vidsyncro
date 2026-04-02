import { NextAuthOptions, getServerSession as _getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Add Gmail addresses here to grant full access.
// All allowed users automatically get admin plan (unlimited everything).
const ALLOWED_EMAILS: string[] = [
  'vipaymanshalaby@gmail.com',
  // 'client@gmail.com',
  // 'partner@gmail.com',
]

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      // Return false for denied users — NextAuth will redirect to the error page.
      // Do NOT return a redirect string here — it breaks JWT session creation
      // for allowed users in API routes that call getServerSession().
      if (!user.email || !ALLOWED_EMAILS.includes(user.email)) {
        return false
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.plan = 'admin'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.plan = token.plan as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
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
    picture?: string
  }
}
