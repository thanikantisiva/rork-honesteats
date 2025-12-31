import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDb } from '@/backend/db';

export const addressesRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      const addresses = await db.query<[any[]]>(
        'SELECT * FROM addresses WHERE userId = $userId ORDER BY createdAt DESC',
        { userId: input.userId }
      );

      return (addresses[0] || []).map((addr: any) => ({
        id: addr.id,
        type: addr.type,
        nickname: addr.nickname,
        address: addr.address,
        landmark: addr.landmark,
        coordinates: {
          lat: addr.lat,
          lng: addr.lng,
        },
      }));
    }),

  create: publicProcedure
    .input(z.object({
      userId: z.string(),
      type: z.enum(['Home', 'Work', 'Other']),
      nickname: z.string().optional(),
      address: z.string(),
      landmark: z.string().optional(),
      lat: z.number(),
      lng: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      const created = await db.create('addresses', {
        userId: input.userId,
        type: input.type,
        nickname: input.nickname,
        address: input.address,
        landmark: input.landmark,
        lat: input.lat,
        lng: input.lng,
      });

      const addr = Array.isArray(created) ? created[0] : created;

      return {
        id: addr.id,
        type: addr.type,
        nickname: addr.nickname,
        address: addr.address,
        landmark: addr.landmark,
        coordinates: {
          lat: addr.lat,
          lng: addr.lng,
        },
      };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      type: z.enum(['Home', 'Work', 'Other']).optional(),
      nickname: z.string().optional(),
      address: z.string().optional(),
      landmark: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...updates } = input;

      const updated = await db.merge(id, updates);
      const addr = Array.isArray(updated) ? updated[0] : updated;

      return {
        id: addr.id,
        type: addr.type,
        nickname: addr.nickname,
        address: addr.address,
        landmark: addr.landmark,
        coordinates: {
          lat: addr.lat,
          lng: addr.lng,
        },
      };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(input.id);
      return { success: true };
    }),
});
