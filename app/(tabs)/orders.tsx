import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useOrders } from '@/contexts/OrdersContext';
import React from 'react';
import { router } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { Order } from '@/types';

export default function OrdersScreen() {
  const { orders, isLoading, refreshOrders } = useOrders();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'out_for_delivery':
        return '#F59E0B';
      default:
        return '#3B82F6';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'placed':
        return 'Order Placed';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Loading orders...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No Orders Yet</Text>
        <Text style={styles.emptyText}>Your order history will appear here</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {orders.map((order) => (
          <TouchableOpacity 
            key={order.id} 
            style={styles.orderCard} 
            activeOpacity={0.7}
            onPress={() => router.push(`/order-details?orderId=${order.id}`)}
          >
            <View style={styles.orderHeader}>
              <Image source={{ uri: order.restaurantImage }} style={styles.restaurantImage} />
              <View style={styles.orderHeaderInfo}>
                <Text style={styles.restaurantName} numberOfLines={1}>
                  {order.restaurantName}
                </Text>
                <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
              </View>
            </View>

            <View style={styles.orderItems}>
              {order.items.map((item, index) => (
                <Text key={index} style={styles.itemText} numberOfLines={1}>
                  {item.quantity}x {item.menuItem.name}
                </Text>
              ))}
            </View>

            <View style={styles.orderFooter}>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(order.status) },
                  ]}
                />
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {getStatusText(order.status)}
                </Text>
              </View>
              <Text style={styles.totalAmount}>₹{order.totalAmount}</Text>
            </View>

            <View style={styles.addressContainer}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.addressText} numberOfLines={1}>
                {order.deliveryAddress.address}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  centerContainer: {
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
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  restaurantImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  orderHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderItems: {
    gap: 4,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemText: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
  bottomSpacing: {
    height: 80,
  },
});
