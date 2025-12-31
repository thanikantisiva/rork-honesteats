import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, CartItem, Address, Restaurant } from '@/types';

const ORDERS_STORAGE_KEY = '@orders';

export const [OrdersContext, useOrders] = createContextHook(() => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
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
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const placeOrder = useCallback(async (
    items: CartItem[],
    restaurant: Restaurant,
    deliveryAddress: Address,
    subtotal: number,
    deliveryFee: number
  ): Promise<Order> => {
    const order: Order = {
      id: `ORD${Date.now()}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantImage: restaurant.image,
      items: items.map(({ menuItem, quantity }) => ({ menuItem, quantity })),
      totalAmount: subtotal + deliveryFee,
      deliveryFee,
      status: 'placed',
      deliveryAddress,
      orderDate: new Date(),
      estimatedDeliveryTime: new Date(Date.now() + 40 * 60 * 1000),
    };

    const updatedOrders = [order, ...orders];
    setOrders(updatedOrders);
    
    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    
    console.log('Order placed:', order);
    
    return order;
  }, [orders]);

  return {
    orders,
    isLoading,
    placeOrder,
  };
});
