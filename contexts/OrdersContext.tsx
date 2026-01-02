import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, CartItem, Address, Restaurant } from '@/types';
import { orderAPI, APIOrder, APIOrderItem } from '@/lib/api';
import { useAuth } from './AuthContext';

const ORDERS_STORAGE_KEY = '@orders';

export const [OrdersContext, useOrders] = createContextHook(() => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!user?.phone) return;
    
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        const parsedOrders = JSON.parse(stored);
        setOrders(parsedOrders.map((order: Order) => ({
          ...order,
          orderDate: new Date(order.orderDate),
          estimatedDeliveryTime: order.estimatedDeliveryTime 
            ? new Date(order.estimatedDeliveryTime) 
            : undefined,
        })));
      }
      
      try {
        const response = await orderAPI.listOrders({ 
          customerPhone: user.phone,
          limit: 50 
        });
        
        const apiOrders: Order[] = response.orders.map((apiOrder: APIOrder) => ({
          id: apiOrder.orderId,
          restaurantId: apiOrder.restaurantId,
          restaurantName: 'Restaurant',
          restaurantImage: '',
          items: apiOrder.items.map((item: APIOrderItem) => ({
            menuItem: {
              id: item.itemId,
              restaurantId: apiOrder.restaurantId,
              name: item.name,
              description: '',
              price: item.price,
              category: '',
              isVeg: false,
              isAvailable: true,
            },
            quantity: item.quantity,
          })),
          totalAmount: apiOrder.grandTotal,
          deliveryFee: apiOrder.deliveryFee,
          status: mapAPIStatusToOrderStatus(apiOrder.status),
          deliveryAddress: {
            id: 'temp',
            type: 'Home',
            address: '',
            coordinates: { lat: 0, lng: 0 },
          },
          orderDate: new Date(apiOrder.createdAt),
          estimatedDeliveryTime: undefined,
        }));
        
        if (apiOrders.length > 0) {
          setOrders(apiOrders);
          await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(apiOrders));
        }
      } catch (error) {
        console.error('Failed to fetch orders from API:', error);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.phone]);

  useEffect(() => {
    if (user?.phone) {
      loadOrders();
    } else {
      setIsLoading(false);
    }
  }, [user?.phone, loadOrders]);

  const placeOrder = useCallback(async (
    items: CartItem[],
    restaurant: Restaurant,
    deliveryAddress: Address,
    subtotal: number,
    deliveryFee: number
  ): Promise<Order> => {
    if (!user?.phone) {
      throw new Error('User not authenticated');
    }

    try {
      const apiOrderItems: APIOrderItem[] = items.map(({ menuItem, quantity }) => ({
        itemId: menuItem.id,
        name: menuItem.name,
        quantity,
        price: menuItem.price,
      }));

      const apiOrder = await orderAPI.createOrder({
        customerPhone: user.phone,
        restaurantId: restaurant.id,
        items: apiOrderItems,
        foodTotal: subtotal,
        deliveryFee,
        platformFee: 0,
      });

      const order: Order = {
        id: apiOrder.orderId,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantImage: restaurant.image,
        items: items.map(({ menuItem, quantity }) => ({ menuItem, quantity })),
        totalAmount: apiOrder.grandTotal,
        deliveryFee: apiOrder.deliveryFee,
        status: mapAPIStatusToOrderStatus(apiOrder.status),
        deliveryAddress,
        orderDate: new Date(apiOrder.createdAt),
        estimatedDeliveryTime: new Date(Date.now() + 40 * 60 * 1000),
      };

      const updatedOrders = [order, ...orders];
      setOrders(updatedOrders);
      
      await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
      
      console.log('Order placed:', order);
      
      return order;
    } catch (error) {
      console.error('Failed to place order:', error);
      throw error;
    }
  }, [orders, user?.phone]);

  return {
    orders,
    isLoading,
    placeOrder,
  };
});

function mapAPIStatusToOrderStatus(apiStatus: string): Order['status'] {
  const statusMap: Record<string, Order['status']> = {
    'PENDING': 'placed',
    'CONFIRMED': 'confirmed',
    'PREPARING': 'preparing',
    'READY': 'preparing',
    'OUT_FOR_DELIVERY': 'out_for_delivery',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled',
  };
  return statusMap[apiStatus] || 'placed';
}
