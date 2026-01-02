import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, CartItem, Address, Restaurant } from '@/types';
import { orderAPI, APIOrder, APIOrderItem } from '@/lib/api';
import { useAuth } from './AuthContext';
import { mockRestaurants } from '@/mocks/restaurants';

const ORDERS_STORAGE_KEY = '@orders';

export const [OrdersContext, useOrders] = createContextHook(() => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!user?.phone) return;
    
    setIsLoading(true);
    try {
      console.log('[OrdersContext] Fetching orders from API for:', user.phone);
      const response = await orderAPI.listOrders({ 
        customerPhone: user.phone,
        limit: 50 
      });
      
      console.log('[OrdersContext] Received orders:', response.orders.length);
      
      const apiOrders: Order[] = response.orders.map((apiOrder: APIOrder) => {
        const restaurant = mockRestaurants.find(r => r.id === apiOrder.restaurantId);
        
        return {
        id: apiOrder.orderId,
        restaurantId: apiOrder.restaurantId,
        restaurantName: restaurant?.name || 'Restaurant',
        restaurantImage: restaurant?.image || '',
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
      };
      });
      
      setOrders(apiOrders);
      await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(apiOrders));
    } catch (error) {
      console.error('[OrdersContext] Failed to fetch orders from API:', error);
      try {
        const stored = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
        if (stored) {
          console.log('[OrdersContext] Loading cached orders as fallback');
          const parsedOrders = JSON.parse(stored);
          setOrders(parsedOrders.map((order: Order) => ({
            ...order,
            orderDate: new Date(order.orderDate),
            estimatedDeliveryTime: order.estimatedDeliveryTime 
              ? new Date(order.estimatedDeliveryTime) 
              : undefined,
          })));
        }
      } catch (storageError) {
        console.error('[OrdersContext] Failed to load cached orders:', storageError);
      }
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

  const refreshOrders = useCallback(() => {
    return loadOrders();
  }, [loadOrders]);

  return {
    orders,
    isLoading,
    placeOrder,
    refreshOrders,
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
