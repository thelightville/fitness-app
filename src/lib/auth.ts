import NextAuth, { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './db';
import { UserRole } from '@prisma/client';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  trustHost: process.env.NODE_ENV === 'production',
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { trainer: { select: { active: true, approvedAt: true } } },
        });

        if (!user?.password || (user.role === UserRole.TRAINER && (!user.trainer?.active || !user.trainer.approvedAt))) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          trainerApprovalEpoch: user.trainer?.approvedAt?.getTime(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.trainerApprovalEpoch = user.trainerApprovalEpoch;
      }
      if (typeof token.id !== 'string') return null;
      const current = await prisma.user.findUnique({
        where: { id: token.id },
        select: { role: true, trainer: { select: { active: true, approvedAt: true } } },
      });
      if (!current || current.role !== token.role) return null;
      if (current.role === UserRole.TRAINER && (!current.trainer?.active || !current.trainer.approvedAt ||
          current.trainer.approvedAt.getTime() !== token.trainerApprovalEpoch)) return null;
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
