import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDynamoClient, TABLES, generateId } from '@/backend/db';
import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

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
      const db = getDynamoClient();

      const estimatedDeliveryTime = new Date();
      estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 35);

      const orderId = generateId();
      const order = {
        id: orderId,
        userId: input.userId,
        restaurantId: input.restaurantId,
        restaurantName: input.restaurantName,
        restaurantImage: input.restaurantImage,
        items: input.items,
        totalAmount: input.totalAmount,
        deliveryFee: input.deliveryFee,
        status: 'placed',
        deliveryAddress: input.deliveryAddress,
        orderDate: Date.now(),
        estimatedDeliveryTime: estimatedDeliveryTime.getTime(),
      };

      await db.send(new PutCommand({
        TableName: TABLES.ORDERS,
        Item: order,
      }));

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
      const db = getDynamoClient();

      const result = await db.send(new QueryCommand({
        TableName: TABLES.ORDERS,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': input.userId,
        },
      }));

      const orders = result.Items || [];
      orders.sort((a: any, b: any) => (b.orderDate || 0) - (a.orderDate || 0));

      return orders.map((order: any) => ({
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
      }));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = getDynamoClient();
      
      const result = await db.send(new GetCommand({
        TableName: TABLES.ORDERS,
        Key: { id: input.id },
      }));

      const order = result.Item;
      if (!order) {
        throw new Error('Order not found');
      }

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

  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']),
    }))
    .mutation(async ({ input }) => {
      const db = getDynamoClient();
      
      await db.send(new UpdateCommand({
        TableName: TABLES.ORDERS,
        Key: { id: input.id },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': input.status,
        },
      }));

      return {
        id: input.id,
        status: input.status,
      };
    }),
});
