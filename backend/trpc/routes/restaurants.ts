import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDb } from '@/backend/db';

export const restaurantsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      
      let query = 'SELECT * FROM restaurants ORDER BY rating DESC';
      const restaurants = await db.query<[any[]]>(query);

      let results = restaurants[0] || [];

      if (input?.search) {
        const searchLower = input.search.toLowerCase();
        results = results.filter((r: any) => 
          r.name.toLowerCase().includes(searchLower) ||
          r.cuisine.some((c: string) => c.toLowerCase().includes(searchLower))
        );
      }

      return results.map((r: any) => ({
        id: r.id,
        name: r.name,
        image: r.image,
        cuisine: r.cuisine,
        rating: r.rating,
        totalRatings: r.totalRatings,
        deliveryTime: r.deliveryTime,
        deliveryFee: r.deliveryFee,
        minOrder: r.minOrder,
        distance: r.distance,
        isPureVeg: r.isPureVeg,
        offers: r.offers,
      }));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const restaurant: any = await db.select(input.id);

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      return {
        id: restaurant.id,
        name: restaurant.name,
        image: restaurant.image,
        cuisine: restaurant.cuisine,
        rating: restaurant.rating,
        totalRatings: restaurant.totalRatings,
        deliveryTime: restaurant.deliveryTime,
        deliveryFee: restaurant.deliveryFee,
        minOrder: restaurant.minOrder,
        distance: restaurant.distance,
        isPureVeg: restaurant.isPureVeg,
        offers: restaurant.offers,
      };
    }),

  getMenuItems: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      const menuItems = await db.query<[any[]]>(
        'SELECT * FROM menuItems WHERE restaurantId = $restaurantId',
        { restaurantId: input.restaurantId }
      );

      return (menuItems[0] || []).map((item: any) => ({
        id: item.id,
        restaurantId: typeof item.restaurantId === 'string' ? item.restaurantId : item.restaurantId.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        category: item.category,
        isVeg: item.isVeg,
        rating: item.rating,
        isAvailable: item.isAvailable,
      }));
    }),
});
