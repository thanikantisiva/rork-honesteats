import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDynamoClient, TABLES } from '@/backend/db';
import { GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

export const restaurantsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = getDynamoClient();
      
      const result = await db.send(new ScanCommand({
        TableName: TABLES.RESTAURANTS,
      }));

      let results = result.Items || [];

      if (input?.search) {
        const searchLower = input.search.toLowerCase();
        results = results.filter((r: any) => 
          r.name.toLowerCase().includes(searchLower) ||
          r.cuisine.some((c: string) => c.toLowerCase().includes(searchLower))
        );
      }

      results.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));

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
      const db = getDynamoClient();
      
      const result = await db.send(new GetCommand({
        TableName: TABLES.RESTAURANTS,
        Key: { id: input.id },
      }));

      const restaurant = result.Item;
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
      const db = getDynamoClient();
      
      const result = await db.send(new QueryCommand({
        TableName: TABLES.MENU_ITEMS,
        IndexName: 'restaurantId-index',
        KeyConditionExpression: 'restaurantId = :restaurantId',
        ExpressionAttributeValues: {
          ':restaurantId': input.restaurantId,
        },
      }));

      return (result.Items || []).map((item: any) => ({
        id: item.id,
        restaurantId: item.restaurantId,
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
