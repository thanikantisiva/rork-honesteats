import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MapPin, CreditCard, Wallet } from 'lucide-react-native';
import { useCart } from '@/contexts/CartContext';
import { useOrders } from '@/contexts/OrdersContext';
import { useAddresses } from '@/contexts/AddressContext';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, total, clearCart, restaurant } = useCart();
  const { placeOrder } = useOrders();
  const { selectedAddress } = useAddresses();

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handlePlaceOrder = async () => {
    if (!restaurant) return;
    
    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please add a delivery address to continue');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const order = await placeOrder(items, restaurant, selectedAddress, subtotal, deliveryFee);
      
      clearCart();
      
      Alert.alert(
        'Order Placed!',
        `Your order #${order.id} has been placed successfully`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/orders'),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to place order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    router.replace('/(tabs)');
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Checkout' }} />
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            {selectedAddress ? (
              <TouchableOpacity 
                style={styles.addressCard} 
                activeOpacity={0.7}
                onPress={() => router.push('/addresses')}
              >
                <MapPin size={20} color="#EF4444" />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressType}>{selectedAddress.nickname || selectedAddress.type}</Text>
                  <Text style={styles.addressText}>{selectedAddress.address}</Text>
                  {selectedAddress.landmark && (
                    <Text style={styles.addressLandmark}>{selectedAddress.landmark}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.addAddressCard}
                onPress={() => router.push('/addresses')}
                activeOpacity={0.7}
              >
                <MapPin size={20} color="#6B7280" />
                <Text style={styles.addAddressText}>Add Delivery Address</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === 'cod' && styles.paymentCardSelected,
              ]}
              onPress={() => setPaymentMethod('cod')}
              activeOpacity={0.7}
            >
              <Wallet size={20} color={paymentMethod === 'cod' ? '#EF4444' : '#6B7280'} />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>Cash on Delivery</Text>
                <Text style={styles.paymentSub}>Pay with cash when order arrives</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  paymentMethod === 'cod' && styles.radioSelected,
                ]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === 'online' && styles.paymentCardSelected,
              ]}
              onPress={() => setPaymentMethod('online')}
              activeOpacity={0.7}
            >
              <CreditCard size={20} color={paymentMethod === 'online' ? '#EF4444' : '#6B7280'} />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>Online Payment</Text>
                <Text style={styles.paymentSub}>UPI, Cards, Net Banking</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  paymentMethod === 'online' && styles.radioSelected,
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bill Summary</Text>
            <View style={styles.billCard}>
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
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>₹{total}</Text>
            <Text style={styles.footerTotalSub}>TOTAL</Text>
          </View>
          <TouchableOpacity
            style={[styles.placeOrderButton, isPlacingOrder && styles.placeOrderButtonDisabled]}
            onPress={handlePlaceOrder}
            disabled={isPlacingOrder}
          >
            <Text style={styles.placeOrderButtonText}>
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </Text>
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
  content: {
    flex: 1,
  },
  section: {
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
  addressCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  addressInfo: {
    flex: 1,
    gap: 4,
  },
  addressType: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#111827',
  },
  addressText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  addressLandmark: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  paymentCardSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  paymentSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioSelected: {
    borderColor: '#EF4444',
    borderWidth: 6,
  },
  billCard: {
    gap: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
  placeOrderButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  addAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
});
