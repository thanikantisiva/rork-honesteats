import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { restaurantAPI } from '@/lib/api';

export const restaurantsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const { restaurants } = await restaurantAPI.listRestaurants();

      let results = restaurants;

      if (input?.search) {
        const searchLower = input.search.toLowerCase();
        results = results.filter((r) => 
          r.name.toLowerCase().includes(searchLower) ||
          r.cuisine.some((c: string) => c.toLowerCase().includes(searchLower))
        );
      }

      return results.map((r) => ({
        id: r.restaurantId,
        name: r.name,
        image: r.restaurantImage || '',
        cuisine: r.cuisine,
        rating: 4.5,
        totalRatings: 100,
        deliveryTime: '30-40 min',
        deliveryFee: 50,
        minOrder: 0,
        distance: '2.5 km',
        isPureVeg: false,
        offers: [],
      }));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const restaurant = await restaurantAPI.getRestaurant(input.id);

      return {
        id: restaurant.restaurantId,
        name: restaurant.name,
        image: restaurant.restaurantImage || '',
        cuisine: restaurant.cuisine,
        rating: 4.5,
        totalRatings: 100,
        deliveryTime: '30-40 min',
        deliveryFee: 50,
        minOrder: 0,
        distance: '2.5 km',
        isPureVeg: false,
        offers: [],
      };
    }),

  getMenuItems: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      const { items } = await restaurantAPI.listMenuItems(input.restaurantId);

      return items.map((item) => ({
        id: item.item_id,
        restaurantId: item.restaurant_id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        image: item.image || '',
        category: item.category || 'Main Course',
        isVeg: item.isVeg,
        rating: 4.5,
        isAvailable: item.isAvailable,
      }));
    }),
});
