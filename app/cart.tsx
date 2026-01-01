import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Plus, Minus, Trash2 } from 'lucide-react-native';
import { useCart } from '@/contexts/CartContext';

export default function CartScreen() {
  const router = useRouter();
  const { items, addItem, removeItem, clearCart, subtotal, deliveryFee, total, restaurant } = useCart();

  const handleCheckout = () => {
    router.push('/checkout' as any);
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  };

  if (items.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Cart' }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add items from a restaurant to get started</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.back()}>
            <Text style={styles.browseButtonText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Cart',
          headerRight: () => (
            <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {restaurant && (
            <View style={styles.restaurantCard}>
              <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <Text style={styles.restaurantMeta}>
                  {restaurant.deliveryTime} • {restaurant.distance}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Items</Text>
            {items.map((item) => (
              <View key={item.menuItem.id} style={styles.cartItem}>
                <View style={styles.vegIndicator}>
                  <View
                    style={[
                      styles.vegDot,
                      { backgroundColor: item.menuItem.isVeg ? '#10B981' : '#EF4444' },
                    ]}
                  />
                </View>
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.menuItem.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.menuItem.price}</Text>
                </View>

                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => removeItem(item.menuItem.id)}
                  >
                    <Minus size={16} color="#EF4444" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => addItem(item.menuItem, item.restaurant)}
                  >
                    <Plus size={16} color="#10B981" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemTotal}>₹{item.menuItem.price * item.quantity}</Text>
              </View>
            ))}
          </View>

          <View style={styles.billSection}>
            <Text style={styles.sectionTitle}>Bill Details</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>₹{deliveryFee}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.billRow}>
              <Text style={styles.totalLabel}>To Pay</Text>
              <Text style={styles.totalValue}>₹{total}</Text>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>₹{total}</Text>
            <Text style={styles.footerTotalSub}>TOTAL</Text>
          </View>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  clearButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  restaurantInfo: {
    flex: 1,
    gap: 4,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  restaurantMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  vegIndicator: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemDetails: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  itemPrice: {
    fontSize: 12,
    color: '#6B7280',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  quantityButton: {
    padding: 6,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#111827',
    paddingHorizontal: 12,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#111827',
    minWidth: 60,
    textAlign: 'right',
  },
  billSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  billLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  billValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500' as const,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 16,
  },
  footerTotal: {
    gap: 2,
  },
  footerTotalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  footerTotalSub: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600' as const,
  },
  checkoutButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
