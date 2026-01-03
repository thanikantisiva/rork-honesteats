import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { addressAPI } from '@/lib/api';

export const addressesRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const { addresses } = await addressAPI.listAddresses(input.userId);

        return addresses.map((addr) => ({
          id: addr.addressId,
          type: (addr.label as 'Home' | 'Work' | 'Other') || 'Home',
          nickname: addr.label,
          address: addr.address,
          landmark: '',
          coordinates: {
            lat: addr.lat,
            lng: addr.lng,
          },
        }));
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
        return [];
      }
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
      const addr = await addressAPI.createAddress(input.userId, {
        label: input.nickname || input.type,
        address: input.address,
        lat: input.lat,
        lng: input.lng,
      });

      return {
        id: addr.addressId,
        type: input.type,
        nickname: addr.label,
        address: addr.address,
        landmark: input.landmark,
        coordinates: {
          lat: addr.lat,
          lng: addr.lng,
        },
      };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      type: z.enum(['Home', 'Work', 'Other']).optional(),
      nickname: z.string().optional(),
      address: z.string().optional(),
      landmark: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, userId, type, nickname, address, landmark, lat, lng } = input;

      const updateData: any = {};
      if (nickname) updateData.label = nickname;
      if (address) updateData.address = address;
      if (lat !== undefined) updateData.lat = lat;
      if (lng !== undefined) updateData.lng = lng;

      const addr = await addressAPI.updateAddress(userId, id, updateData);

      return {
        id: addr.addressId,
        type: type || 'Home',
        nickname: addr.label,
        address: addr.address,
        landmark: landmark,
        coordinates: {
          lat: addr.lat,
          lng: addr.lng,
        },
      };
    }),

  delete: publicProcedure
    .input(z.object({ 
      id: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      await addressAPI.deleteAddress(input.userId, input.id);
      return { success: true };
    }),
});
