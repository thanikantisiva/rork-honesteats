import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback } from 'react';
import { CartItem, MenuItem, Restaurant } from '@/types';
import * as Haptics from 'expo-haptics';

export const [CartContext, useCart] = createContextHook(() => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((menuItem: MenuItem, restaurant: Restaurant) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setItems((prev) => {
      if (prev.length > 0 && prev[0].restaurant.id !== restaurant.id) {
        return [{ menuItem, quantity: 1, restaurant }];
      }
      
      const existingIndex = prev.findIndex((item) => item.menuItem.id === menuItem.id);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      
      return [...prev, { menuItem, quantity: 1, restaurant }];
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.menuItem.id === menuItemId);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        if (updated[existingIndex].quantity > 1) {
          updated[existingIndex].quantity -= 1;
        } else {
          updated.splice(existingIndex, 1);
        }
        return updated;
      }
      
      return prev;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemQuantity = useCallback((menuItemId: string) => {
    const item = items.find((item) => item.menuItem.id === menuItemId);
    return item?.quantity || 0;
  }, [items]);

  const subtotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const deliveryFee = items.length > 0 ? items[0].restaurant.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  return {
    items,
    addItem,
    removeItem,
    clearCart,
    getItemQuantity,
    subtotal,
    deliveryFee,
    total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    restaurant: items.length > 0 ? items[0].restaurant : null,
  };
});
