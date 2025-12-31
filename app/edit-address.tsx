import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { MapPin, Navigation, Home, Briefcase, MapPinned } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useAddresses } from '@/contexts/AddressContext';

type AddressType = 'Home' | 'Work' | 'Other';

export default function EditAddressScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addresses, addAddress, updateAddress } = useAddresses();

  const existingAddress = id ? addresses.find((addr) => addr.id === id) : null;

  const [addressType, setAddressType] = useState<AddressType>(existingAddress?.type || 'Home');
  const [nickname, setNickname] = useState(existingAddress?.nickname || '');
  const [address, setAddress] = useState(existingAddress?.address || '');
  const [landmark, setLandmark] = useState(existingAddress?.landmark || '');
  const [coordinates, setCoordinates] = useState(
    existingAddress?.coordinates || { lat: 0, lng: 0 }
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const addressTypes: { type: AddressType; icon: typeof Home; label: string }[] = [
    { type: 'Home', icon: Home, label: 'Home' },
    { type: 'Work', icon: Briefcase, label: 'Work' },
    { type: 'Other', icon: MapPinned, label: 'Other' },
  ];

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable location services to use this feature.'
        );
        return;
      }

      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          Alert.alert('Error', 'Geolocation is not supported by your browser');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setCoordinates({ lat: latitude, lng: longitude });

            try {
              const [result] = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
              });

              if (result) {
                const addressParts = [
                  result.name,
                  result.street,
                  result.city,
                  result.region,
                  result.postalCode,
                  result.country,
                ].filter(Boolean);
                setAddress(addressParts.join(', '));
              }
            } catch (error) {
              console.error('Reverse geocoding failed:', error);
            }
            setIsLoadingLocation(false);
          },
          (error) => {
            console.error('Geolocation error:', error);
            Alert.alert('Error', 'Failed to get your location');
            setIsLoadingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } else {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = location.coords;
        setCoordinates({ lat: latitude, lng: longitude });

        try {
          const [result] = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          if (result) {
            const addressParts = [
              result.name,
              result.street,
              result.city,
              result.region,
              result.postalCode,
              result.country,
            ].filter(Boolean);
            setAddress(addressParts.join(', '));
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
        }
        setIsLoadingLocation(false);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
      setIsLoadingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!address.trim()) {
      Alert.alert('Required', 'Please enter an address');
      return;
    }

    setIsSaving(true);
    try {
      if (existingAddress) {
        await updateAddress(existingAddress.id, {
          type: addressType,
          nickname: nickname.trim() || undefined,
          address: address.trim(),
          landmark: landmark.trim() || undefined,
          coordinates,
        });
      } else {
        await addAddress({
          type: addressType,
          nickname: nickname.trim() || undefined,
          address: address.trim(),
          landmark: landmark.trim() || undefined,
          coordinates,
        });
      }
      router.back();
    } catch (error) {
      console.error('Failed to save address:', error);
      Alert.alert('Error', 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: existingAddress ? 'Edit Address' : 'Add New Address',
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>Address Type</Text>
            <View style={styles.typeContainer}>
              {addressTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = addressType === item.type;

                return (
                  <TouchableOpacity
                    key={item.type}
                    style={[styles.typeButton, isSelected && styles.typeButtonSelected]}
                    onPress={() => setAddressType(item.type)}
                    activeOpacity={0.7}
                  >
                    <Icon size={20} color={isSelected ? '#EF4444' : '#6B7280'} />
                    <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {addressType === 'Other' && (
            <View style={styles.section}>
              <Text style={styles.label}>Nickname (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Friend's House, Gym"
                placeholderTextColor="#9CA3AF"
                value={nickname}
                onChangeText={setNickname}
              />
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Complete Address</Text>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={isLoadingLocation}
                activeOpacity={0.7}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Navigation size={16} color="#EF4444" />
                    <Text style={styles.locationButtonText}>Use Current</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="House/Flat no., Floor, Building name"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Landmark (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Near Metro Station"
              placeholderTextColor="#9CA3AF"
              value={landmark}
              onChangeText={setLandmark}
            />
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <MapPin size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Address'}
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
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  typeButtonSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  typeLabelSelected: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  locationButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#EF4444',
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
  saveButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
