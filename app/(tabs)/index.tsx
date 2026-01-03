import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Image, Modal, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, Star, Clock, ChevronDown, Plus } from 'lucide-react-native';
import { Restaurant } from '@/types';
import { useAddresses } from '@/contexts/AddressContext';
import { trpc } from '@/lib/trpc';

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const router = useRouter();
  const { addresses, selectedAddress, selectAddress } = useAddresses();

  const restaurantsQuery = trpc.restaurants.list.useQuery({ search });
  const restaurants = restaurantsQuery.data || [];

  const handleRestaurantPress = (restaurant: Restaurant) => {
    router.push(`/restaurant/${restaurant.id}` as any);
  };

  const handleAddressSelect = async (addressId: string) => {
    await selectAddress(addressId);
    setShowAddressModal(false);
  };

  const handleAddNewAddress = () => {
    setShowAddressModal(false);
    router.push('/edit-address' as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.locationContainer}
          onPress={() => setShowAddressModal(true)}
          activeOpacity={0.7}
        >
          <MapPin size={20} color="#EF4444" />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Deliver to</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationText} numberOfLines={1}>
                {selectedAddress ? (
                  selectedAddress.nickname || selectedAddress.type
                ) : (
                  'Select delivery address'
                )}
              </Text>
              <ChevronDown size={16} color="#111827" />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for restaurants or cuisines"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>All Restaurants</Text>

        {restaurantsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#EF4444" />
            <Text style={styles.loadingText}>Loading restaurants...</Text>
          </View>
        ) : (
          <View style={styles.restaurantList}>
            {restaurants.map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              style={styles.restaurantCard}
              onPress={() => handleRestaurantPress(restaurant)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
              
              {restaurant.offers && restaurant.offers.length > 0 && (
                <View style={styles.offerBadge}>
                  <Text style={styles.offerText}>{restaurant.offers[0]}</Text>
                </View>
              )}

              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName} numberOfLines={1}>
                  {restaurant.name}
                </Text>
                
                <View style={styles.metaRow}>
                  <View style={styles.ratingContainer}>
                    <Star size={12} color="#FFFFFF" fill="#10B981" />
                    <Text style={styles.rating}>{restaurant.rating}</Text>
                  </View>
                  <Text style={styles.metaText}>•</Text>
                  <Clock size={12} color="#6B7280" />
                  <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
                </View>

                <Text style={styles.cuisine} numberOfLines={1}>
                  {restaurant.cuisine.join(', ')}
                </Text>

                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryText}>
                    ₹{restaurant.deliveryFee} delivery • {restaurant.distance}
                  </Text>
                  {restaurant.isPureVeg && (
                    <View style={styles.vegBadge}>
                      <View style={styles.vegDot} />
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowAddressModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Delivery Address</Text>
            </View>

            <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false}>
              {addresses.map((address) => {
                const isSelected = address.id === selectedAddress?.id;
                return (
                  <TouchableOpacity
                    key={address.id}
                    style={[styles.addressItem, isSelected && styles.addressItemSelected]}
                    onPress={() => handleAddressSelect(address.id)}
                    activeOpacity={0.7}
                  >
                    <MapPin size={18} color={isSelected ? '#EF4444' : '#6B7280'} />
                    <View style={styles.addressItemContent}>
                      <Text style={[styles.addressItemTitle, isSelected && styles.addressItemTitleSelected]}>
                        {address.nickname || address.type}
                      </Text>
                      <Text style={styles.addressItemText} numberOfLines={2}>
                        {address.address}
                      </Text>
                    </View>
                    {isSelected && <View style={styles.selectedIndicator} />}
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={handleAddNewAddress}
                activeOpacity={0.7}
              >
                <Plus size={20} color="#EF4444" />
                <Text style={styles.addAddressText}>Add New Address</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    flex: 1,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  restaurantList: {
    gap: 16,
    paddingHorizontal: 16,
  },
  restaurantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  restaurantImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  offerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  offerText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#EF4444',
  },
  restaurantInfo: {
    padding: 16,
    gap: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  cuisine: {
    fontSize: 14,
    color: '#6B7280',
  },
  deliveryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  deliveryText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  vegBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  bottomSpacing: {
    height: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  addressList: {
    padding: 16,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  addressItemSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  addressItemContent: {
    flex: 1,
    gap: 4,
  },
  addressItemTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#111827',
  },
  addressItemTitleSelected: {
    color: '#EF4444',
  },
  addressItemText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#EF4444',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
