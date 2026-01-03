import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { orderAPI } from '@/lib/api';

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
      const estimatedDeliveryTime = new Date();
      estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 35);

      const foodTotal = input.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
      const platformFee = 5;

      const order = await orderAPI.createOrder({
        customerPhone: input.userId,
        restaurantId: input.restaurantId,
        items: input.items.map(item => ({
          itemId: item.menuItem.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.menuItem.price,
        })),
        foodTotal,
        deliveryFee: input.deliveryFee,
        platformFee,
      });

      return {
        id: order.orderId,
        restaurantId: order.restaurantId,
        restaurantName: input.restaurantName,
        restaurantImage: input.restaurantImage,
        items: input.items,
        totalAmount: order.grandTotal,
        deliveryFee: order.deliveryFee,
        status: order.status,
        deliveryAddress: input.deliveryAddress,
        orderDate: order.createdAt,
        estimatedDeliveryTime: estimatedDeliveryTime.getTime(),
      };
    }),

  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const { orders } = await orderAPI.listOrders({ 
        customerPhone: input.userId,
        limit: 50,
      });

      return orders
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .map((order) => ({
          id: order.orderId,
          restaurantId: order.restaurantId,
          restaurantName: 'Restaurant',
          restaurantImage: '',
          items: order.items.map(item => ({
            menuItem: {
              id: item.itemId,
              restaurantId: order.restaurantId,
              name: item.name,
              description: '',
              price: item.price,
              image: '',
              category: 'Main Course',
              isVeg: false,
              rating: 4.5,
              isAvailable: true,
            },
            quantity: item.quantity,
          })),
          totalAmount: order.grandTotal,
          deliveryFee: order.deliveryFee,
          status: order.status,
          deliveryAddress: {
            id: '1',
            type: 'Home' as const,
            address: 'Delivery Address',
            coordinates: { lat: 0, lng: 0 },
          },
          orderDate: order.createdAt,
          estimatedDeliveryTime: order.createdAt + 35 * 60 * 1000,
        }));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const order = await orderAPI.getOrder(input.id);

      return {
        id: order.orderId,
        restaurantId: order.restaurantId,
        restaurantName: 'Restaurant',
        restaurantImage: '',
        items: order.items.map(item => ({
          menuItem: {
            id: item.itemId,
            restaurantId: order.restaurantId,
            name: item.name,
            description: '',
            price: item.price,
            image: '',
            category: 'Main Course',
            isVeg: false,
            rating: 4.5,
            isAvailable: true,
          },
          quantity: item.quantity,
        })),
        totalAmount: order.grandTotal,
        deliveryFee: order.deliveryFee,
        status: order.status,
        deliveryAddress: {
          id: '1',
          type: 'Home' as const,
          address: 'Delivery Address',
          coordinates: { lat: 0, lng: 0 },
        },
        orderDate: order.createdAt,
        estimatedDeliveryTime: order.createdAt + 35 * 60 * 1000,
      };
    }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']),
    }))
    .mutation(async ({ input }) => {
      const statusMap: Record<string, string> = {
        'placed': 'PENDING',
        'confirmed': 'CONFIRMED',
        'preparing': 'PREPARING',
        'out_for_delivery': 'OUT_FOR_DELIVERY',
        'delivered': 'DELIVERED',
        'cancelled': 'CANCELLED',
      };

      await orderAPI.updateOrderStatus(input.id, {
        status: statusMap[input.status] || 'PENDING',
      });

      return {
        id: input.id,
        status: input.status,
      };
    }),
});
