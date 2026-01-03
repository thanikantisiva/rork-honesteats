import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { userAPI } from '@/lib/api';

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ 
      phone: z.string(),
      firebaseToken: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log('Login with Firebase token for:', input.phone);
      
      const userId = input.phone;
      
      try {
        const existingUser = await userAPI.getUser(userId);
        
        return {
          user: {
            id: userId,
            phone: existingUser.phone,
            name: existingUser.name,
            email: existingUser.email || null,
          },
          token: userId,
        };
      } catch {
        const newUser = await userAPI.createUser({
          phone: userId,
          name: 'User',
        });
        
        return {
          user: {
            id: userId,
            phone: newUser.phone,
            name: newUser.name,
            email: newUser.email || null,
          },
          token: userId,
        };
      }
    }),

  updateProfile: publicProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const { userId, ...updates } = input;

      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.email) updateData.email = updates.email;

      const user = await userAPI.updateUser(userId, updateData);

      return {
        id: user.phone,
        phone: user.phone,
        name: user.name,
        email: user.email || null,
      };
    }),

  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await userAPI.getUser(input.userId);

      return {
        id: user.phone,
        phone: user.phone,
        name: user.name,
        email: user.email || null,
      };
    }),
});
