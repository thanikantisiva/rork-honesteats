import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MapPin, Plus, Home, Briefcase, MapPinned, Edit2, Trash2 } from 'lucide-react-native';
import { useAddresses } from '@/contexts/AddressContext';
import { Address } from '@/types';

export default function AddressesScreen() {
  const router = useRouter();
  const { addresses, selectedAddressId, selectAddress, deleteAddress } = useAddresses();

  const handleSelectAddress = async (id: string) => {
    try {
      await selectAddress(id);
    } catch (error) {
      console.error('Failed to select address:', error);
      Alert.alert('Error', 'Failed to select address');
    }
  };

  const handleDeleteAddress = (address: Address) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete ${address.nickname || address.type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(address.id);
            } catch (error) {
              console.error('Failed to delete address:', error);
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleEditAddress = (address: Address) => {
    router.push({ pathname: '/edit-address', params: { id: address.id } });
  };

  const getAddressIcon = (type: Address['type']) => {
    switch (type) {
      case 'Home':
        return Home;
      case 'Work':
        return Briefcase;
      default:
        return MapPinned;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Manage Addresses' }} />
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {addresses.length === 0 ? (
            <View style={styles.emptyState}>
              <MapPin size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Saved Addresses</Text>
              <Text style={styles.emptyText}>Add your delivery addresses for faster checkout</Text>
            </View>
          ) : (
            <View style={styles.addressList}>
              {addresses.map((address) => {
                const Icon = getAddressIcon(address.type);
                const isSelected = address.id === selectedAddressId;

                return (
                  <TouchableOpacity
                    key={address.id}
                    style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                    onPress={() => handleSelectAddress(address.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.addressHeader}>
                      <View style={styles.addressTitleRow}>
                        <Icon size={20} color={isSelected ? '#EF4444' : '#6B7280'} />
                        <Text style={[styles.addressType, isSelected && styles.addressTypeSelected]}>
                          {address.nickname || address.type}
                        </Text>
                        {isSelected && <View style={styles.selectedBadge} />}
                      </View>
                      <View style={styles.addressActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditAddress(address)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Edit2 size={18} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteAddress(address)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.addressText}>{address.address}</Text>
                    {address.landmark && (
                      <Text style={styles.addressLandmark}>Landmark: {address.landmark}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push({ pathname: '/edit-address' })}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add New Address</Text>
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  addressList: {
    padding: 16,
    gap: 12,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  addressCardSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  addressType: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  addressTypeSelected: {
    color: '#EF4444',
  },
  selectedBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginLeft: 4,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  addressLandmark: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
