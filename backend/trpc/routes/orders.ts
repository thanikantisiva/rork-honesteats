import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDb } from '@/backend/db';

export const ordersRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      userId: z.string(),
      restaurantId: z.string(),
      restaurantName: z.string(),
      restaurantImage: z.string(),
      items: z.array(z.object({
        menuItem: z.object({
          id: z.string(),
          restaurantId: z.string(),
          name: z.string(),
          description: z.string(),
          price: z.number(),
          image: z.string().optional(),
          category: z.string(),
          isVeg: z.boolean(),
          rating: z.number().optional(),
          isAvailable: z.boolean(),
        }),
        quantity: z.number(),
      })),
      totalAmount: z.number(),
      deliveryFee: z.number(),
      deliveryAddress: z.object({
        id: z.string(),
        type: z.enum(['Home', 'Work', 'Other']),
        nickname: z.string().optional(),
        address: z.string(),
        landmark: z.string().optional(),
        coordinates: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      const estimatedDeliveryTime = new Date();
      estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 35);

      const created = await db.create('orders', {
        userId: input.userId,
        restaurantId: input.restaurantId,
        restaurantName: input.restaurantName,
        restaurantImage: input.restaurantImage,
        items: input.items,
        totalAmount: input.totalAmount,
        deliveryFee: input.deliveryFee,
        status: 'placed',
        deliveryAddress: input.deliveryAddress,
        estimatedDeliveryTime: estimatedDeliveryTime.toISOString(),
      });

      const order = Array.isArray(created) ? created[0] : created;

      return {
        id: order.id,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName,
        restaurantImage: order.restaurantImage,
        items: order.items,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        status: order.status,
        deliveryAddress: order.deliveryAddress,
        orderDate: order.orderDate,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
      };
    }),

  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();

      const orders = await db.query<[any[]]>(
        'SELECT * FROM orders WHERE userId = $userId ORDER BY orderDate DESC',
        { userId: input.userId }
      );

      return (orders[0] || []).map((order: any) => ({
        id: order.id,
        restaurantId: typeof order.restaurantId === 'string' ? order.restaurantId : order.restaurantId.id,
        restaurantName: order.restaurantName,
        restaurantImage: order.restaurantImage,
        items: order.items,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        status: order.status,
        deliveryAddress: order.deliveryAddress,
        orderDate: order.orderDate,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
      }));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const order: any = await db.select(input.id);

      if (!order) {
        throw new Error('Order not found');
      }

      return {
        id: order.id,
        restaurantId: typeof order.restaurantId === 'string' ? order.restaurantId : order.restaurantId.id,
        restaurantName: order.restaurantName,
        restaurantImage: order.restaurantImage,
        items: order.items,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        status: order.status,
        deliveryAddress: order.deliveryAddress,
        orderDate: order.orderDate,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
      };
    }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      const updated = await db.merge(input.id, {
        status: input.status,
      });

      const order = Array.isArray(updated) ? updated[0] : updated;

      return {
        id: order.id,
        status: order.status,
      };
    }),
});
