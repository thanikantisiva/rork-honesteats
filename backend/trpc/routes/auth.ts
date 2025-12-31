import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDb } from '@/backend/db';

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ 
      phone: z.string(),
      otp: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log('Login attempt:', input);
      const db = await getDb();

      if (input.otp !== '1234') {
        throw new Error('Invalid OTP');
      }

      const existingUsers = await db.query<[{ id: string; phone: string; name: string; email?: string }[]]>(
        'SELECT * FROM users WHERE phone = $phone',
        { phone: input.phone }
      );

      let user;
      if (existingUsers[0] && existingUsers[0].length > 0) {
        user = existingUsers[0][0];
      } else {
        const newUser = await db.create('users', {
          phone: input.phone,
          name: 'User',
        });
        user = Array.isArray(newUser) ? newUser[0] : newUser;
      }

      return {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
        },
        token: user.id,
      };
    }),

  updateProfile: publicProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { userId, ...updates } = input;

      const updated = await db.merge(userId, updates);
      const user: any = Array.isArray(updated) ? updated[0] : updated;

      return {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
      };
    }),

  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const user: any = await db.select(input.userId);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
      };
    }),
});
