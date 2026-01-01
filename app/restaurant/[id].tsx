import { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Star, Clock, MapPin, Plus, Minus, ShoppingCart } from 'lucide-react-native';
import { mockRestaurants, getRestaurantMenu } from '@/mocks/restaurants';
import { useCart } from '@/contexts/CartContext';
import { MenuItem } from '@/types';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem, removeItem, getItemQuantity, itemCount, total, restaurant: cartRestaurant } = useCart();

  const restaurant = mockRestaurants.find((r) => r.id === id);
  const menuItems = getRestaurantMenu(id || '');

  const groupedMenu = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    menuItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [menuItems]);

  if (!restaurant) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Restaurant not found</Text>
      </View>
    );
  }

  const handleAddItem = (item: MenuItem) => {
    if (cartRestaurant && cartRestaurant.id !== restaurant.id) {
      return;
    }
    addItem(item, restaurant);
  };

  const handleRemoveItem = (item: MenuItem) => {
    removeItem(item.id);
  };

  const handleViewCart = () => {
    router.push('/cart' as any);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: restaurant.name,
          headerBackTitle: 'Back',
        }}
      />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Image source={{ uri: restaurant.image }} style={styles.headerImage} />

          <View style={styles.infoSection}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.cuisine}>{restaurant.cuisine.join(', ')}</Text>

            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Star size={16} color="#FFFFFF" fill="#10B981" />
                <Text style={styles.ratingText}>
                  {restaurant.rating} ({restaurant.totalRatings}+)
                </Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.metaText}>{restaurant.distance}</Text>
              </View>
            </View>

            {restaurant.offers && restaurant.offers.length > 0 && (
              <View style={styles.offersContainer}>
                {restaurant.offers.map((offer, index) => (
                  <View key={index} style={styles.offerCard}>
                    <Text style={styles.offerText}>{offer}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.menuTitle}>Menu</Text>
            {Object.entries(groupedMenu).map(([category, items]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {items.map((item) => {
                  const quantity = getItemQuantity(item.id);
                  const isDisabled = cartRestaurant && cartRestaurant.id !== restaurant.id;

                  return (
                    <View key={item.id} style={styles.menuItem}>
                      <View style={styles.menuItemInfo}>
                        <View style={styles.vegIndicator}>
                          <View
                            style={[
                              styles.vegDot,
                              { backgroundColor: item.isVeg ? '#10B981' : '#EF4444' },
                            ]}
                          />
                        </View>
                        <View style={styles.menuItemDetails}>
                          <Text style={styles.menuItemName}>{item.name}</Text>
                          {item.description && (
                            <Text style={styles.menuItemDescription} numberOfLines={2}>
                              {item.description}
                            </Text>
                          )}
                          <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                        </View>
                      </View>

                      {item.image && (
                        <Image source={{ uri: item.image }} style={styles.menuItemImage} />
                      )}

                      <View style={styles.addButtonContainer}>
                        {quantity === 0 ? (
                          <TouchableOpacity
                            style={[styles.addButton, isDisabled && styles.addButtonDisabled]}
                            onPress={() => handleAddItem(item)}
                            disabled={isDisabled || false}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.addButtonText}>ADD</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.quantityControl}>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => handleRemoveItem(item)}
                            >
                              <Minus size={16} color="#EF4444" />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{quantity}</Text>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => handleAddItem(item)}
                            >
                              <Plus size={16} color="#10B981" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {itemCount > 0 && (
          <TouchableOpacity
            style={styles.cartButton}
            onPress={handleViewCart}
            activeOpacity={0.9}
          >
            <View style={styles.cartButtonContent}>
              <View style={styles.cartButtonLeft}>
                <ShoppingCart size={20} color="#FFFFFF" />
                <Text style={styles.cartItemCount}>{itemCount}</Text>
              </View>
              <Text style={styles.cartButtonText}>View Cart</Text>
              <Text style={styles.cartButtonTotal}>₹{total}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </>
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
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#E5E7EB',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
  },
  cuisine: {
    fontSize: 14,
    color: '#6B7280',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  offersContainer: {
    gap: 8,
    marginTop: 4,
  },
  offerCard: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  offerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  menuSection: {
    marginTop: 8,
    gap: 8,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  categorySection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  menuItemInfo: {
    flex: 1,
    flexDirection: 'row',
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
  menuItemDetails: {
    flex: 1,
    gap: 4,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  menuItemPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#111827',
    marginTop: 4,
  },
  menuItemImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#EF4444',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  quantityButton: {
    padding: 8,
    backgroundColor: '#F9FAFB',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#111827',
    paddingHorizontal: 16,
  },
  bottomSpacing: {
    height: 100,
  },
  cartButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#10B981',
    margin: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cartButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cartButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartItemCount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  cartButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  cartButtonTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
