import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import React from 'react';
import { ChevronLeft, Clock, MapPin, RefreshCcw } from 'lucide-react-native';
import { orderAPI, restaurantAPI } from '@/lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAddresses } from '@/contexts/AddressContext';
import { useCart } from '@/contexts/CartContext';
import { MenuItem } from '@/types';
import { mockRestaurants } from '@/mocks/restaurants';

export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { selectedAddress } = useAddresses();
  const { addItem, clearCart } = useCart();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderAPI.getOrder(orderId!),
    enabled: !!orderId,
  });

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', order?.restaurantId],
    queryFn: () => restaurantAPI.getRestaurant(order!.restaurantId),
    enabled: !!order?.restaurantId,
  });

  const { data: menuItems } = useQuery({
    queryKey: ['menu', order?.restaurantId],
    queryFn: () => restaurantAPI.listMenuItems(order!.restaurantId),
    enabled: !!order?.restaurantId,
  });

  const reorderMutation = useMutation({
    mutationFn: async () => {
      if (!order || !menuItems || !restaurant) return;

      const mockData = mockRestaurants.find(m => m.name === restaurant.name) || mockRestaurants[0];
      const restaurantData = {
        id: restaurant.restaurantId,
        name: restaurant.name,
        image: mockData.image,
        cuisine: ['Food'],
        rating: 4.5,
        totalRatings: 100,
        deliveryTime: '30-40 mins',
        deliveryFee: 30,
        minOrder: 100,
        distance: '2 km',
        isPureVeg: false,
        offers: mockData.offers,
      };

      clearCart();

      order.items.forEach((orderItem) => {
        const menuItem = menuItems.items.find(m => m.item_id === orderItem.itemId);
        if (menuItem) {
          const item: MenuItem = {
            id: menuItem.item_id,
            restaurantId: menuItem.restaurant_id,
            name: menuItem.name,
            description: menuItem.description || '',
            price: menuItem.price,
            category: 'Food',
            isVeg: menuItem.isVeg,
            isAvailable: menuItem.isAvailable,
          };

          for (let i = 0; i < orderItem.quantity; i++) {
            addItem(item, restaurantData);
          }
        }
      });

      router.push('/cart');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return '#10B981';
      case 'CANCELLED':
        return '#EF4444';
      case 'OUT_FOR_DELIVERY':
        return '#F59E0B';
      case 'PREPARING':
        return '#8B5CF6';
      case 'CONFIRMED':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Order Placed';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'PREPARING':
        return 'Preparing';
      case 'READY':
        return 'Ready for Pickup';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorTitle}>Failed to load order</Text>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'Please try again'}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = getStatusColor(order.status);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(order.status)}
            </Text>
          </View>
          <Text style={styles.orderId}>Order #{order.orderId.slice(0, 8)}</Text>
          <View style={styles.dateContainer}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.dateText}>{formatDate(order.createdAt.toString())}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          <View style={styles.itemsCard}>
            {order.items.map((item, index) => (
              <View key={index}>
                {index > 0 && <View style={styles.itemDivider} />}
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>x{item.quantity}</Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Food Total</Text>
              <Text style={styles.billValue}>₹{order.foodTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>₹{order.deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Platform Fee</Text>
              <Text style={styles.billValue}>₹{order.platformFee.toFixed(2)}</Text>
            </View>
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <Text style={styles.billTotal}>Grand Total</Text>
              <Text style={styles.billTotalValue}>₹{order.grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {selectedAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <MapPin size={20} color="#EF4444" />
                <Text style={styles.addressTitle}>{selectedAddress.nickname || selectedAddress.type}</Text>
              </View>
              <Text style={styles.addressText}>{selectedAddress.address}</Text>
              {selectedAddress.landmark && (
                <Text style={styles.landmarkText}>Landmark: {selectedAddress.landmark}</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Restaurant ID</Text>
              <Text style={styles.infoValue}>{order.restaurantId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer Phone</Text>
              <Text style={styles.infoValue}>{order.customerPhone}</Text>
            </View>
            {order.riderId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rider ID</Text>
                <Text style={styles.infoValue}>{order.riderId}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.reorderButton,
            reorderMutation.isPending && styles.reorderButtonDisabled,
          ]}
          onPress={() => reorderMutation.mutate()}
          disabled={reorderMutation.isPending}
          activeOpacity={0.7}
        >
          <RefreshCcw size={20} color="#FFFFFF" />
          <Text style={styles.reorderButtonText}>
            {reorderMutation.isPending ? 'Adding to cart...' : 'Reorder'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  orderId: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600' as const,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: '#6B7280',
  },
  quantityBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#111827',
    minWidth: 70,
    textAlign: 'right',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  billLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  billTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  billTotalValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#EF4444',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 40,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    gap: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginLeft: 28,
  },
  landmarkText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 28,
    fontStyle: 'italic' as const,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  reorderButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  reorderButtonDisabled: {
    opacity: 0.6,
  },
  reorderButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
