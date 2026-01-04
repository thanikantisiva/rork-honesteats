import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Address } from '@/types';
import { addressAPI, APIAddress } from '@/lib/api';
import { useAuth } from './AuthContext';

const SELECTED_ADDRESS_KEY = '@selected_address';
const LOCATION_PROMPTED_KEY = '@location_prompted';

export const [AddressContext, useAddresses] = createContextHook(() => {
  const { user } = useAuth();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadSelectedAddress();
  }, []);

  const loadAddresses = useCallback(async () => {
    if (!user?.phone) return;
    
    setIsLoading(true);
    try {
      const response = await addressAPI.listAddresses(user.phone);
      const mappedAddresses: Address[] = response.addresses.map((apiAddr: APIAddress) => ({
        id: apiAddr.addressId,
        type: apiAddr.label as 'Home' | 'Work' | 'Other',
        nickname: apiAddr.label,
        address: apiAddr.address,
        landmark: undefined,
        coordinates: {
          lat: apiAddr.lat,
          lng: apiAddr.lng,
        },
      }));
      setAddresses(mappedAddresses);
    } catch (error) {
      console.error('Failed to load addresses:', error);
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.phone]);

  useEffect(() => {
    if (user?.phone) {
      loadAddresses();
    }
  }, [user?.phone, loadAddresses]);

  const loadSelectedAddress = async () => {
    try {
      const storedSelectedId = await AsyncStorage.getItem(SELECTED_ADDRESS_KEY);
      if (storedSelectedId) {
        setSelectedAddressId(storedSelectedId);
      }
    } catch (error) {
      console.error('Failed to load selected address:', error);
    }
  };

  const addAddress = async (address: Omit<Address, 'id'>) => {
    if (!user?.phone) throw new Error('User not authenticated');

    const result = await addressAPI.createAddress(user.phone, {
      label: address.nickname || address.type,
      address: address.address,
      lat: address.coordinates.lat,
      lng: address.coordinates.lng,
    });

    await loadAddresses();

    if (addresses.length === 0) {
      await selectAddress(result.addressId);
    }

    return result;
  };

  const updateAddress = async (id: string, updates: Partial<Omit<Address, 'id'>>) => {
    if (!user?.phone) throw new Error('User not authenticated');

    await addressAPI.updateAddress(user.phone, id, {
      label: updates.nickname || updates.type,
      address: updates.address,
      lat: updates.coordinates?.lat,
      lng: updates.coordinates?.lng,
    });

    await loadAddresses();
  };

  const deleteAddress = async (id: string) => {
    if (!user?.phone) throw new Error('User not authenticated');

    await addressAPI.deleteAddress(user.phone, id);

    if (selectedAddressId === id) {
      const remainingAddresses = addresses.filter((addr) => addr.id !== id);
      const newSelectedId = remainingAddresses.length > 0 ? remainingAddresses[0].id : null;
      await selectAddress(newSelectedId);
    }

    await loadAddresses();
  };

  const selectAddress = async (id: string | null) => {
    try {
      if (id) {
        await AsyncStorage.setItem(SELECTED_ADDRESS_KEY, id);
      } else {
        await AsyncStorage.removeItem(SELECTED_ADDRESS_KEY);
      }
      setSelectedAddressId(id);
    } catch (error) {
      console.error('Failed to select address:', error);
      throw error;
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<{ lat: number; lng: number; address?: string } | null> => {
    try {
      const hasPermission = await requestLocationPermission();
      
      if (!hasPermission) {
        return null;
      }

      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            resolve(null);
            return;
          }

          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
                const address = result
                  ? [result.name, result.street, result.city, result.region, result.postalCode, result.country]
                      .filter(Boolean)
                      .join(', ')
                  : undefined;
                resolve({ lat: latitude, lng: longitude, address });
              } catch {
                resolve({ lat: latitude, lng: longitude });
              }
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        });
      } else {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const { latitude, longitude } = location.coords;
        
        try {
          const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
          const address = result
            ? [result.name, result.street, result.city, result.region, result.postalCode, result.country]
                .filter(Boolean)
                .join(', ')
            : undefined;
          return { lat: latitude, lng: longitude, address };
        } catch {
          return { lat: latitude, lng: longitude };
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const promptForLocation = useCallback(async () => {
    // Check if we've already prompted
    const hasPrompted = await AsyncStorage.getItem(LOCATION_PROMPTED_KEY);
    if (hasPrompted) return;

    // Only prompt if user has no addresses
    if (addresses.length > 0) return;

    Alert.alert(
      'Enable Location',
      'Allow us to detect your location for a better delivery experience?',
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: async () => {
            await AsyncStorage.setItem(LOCATION_PROMPTED_KEY, 'true');
          },
        },
        {
          text: 'Enable',
          onPress: async () => {
            await AsyncStorage.setItem(LOCATION_PROMPTED_KEY, 'true');
            const location = await getCurrentLocation();
            if (location) {
              setCurrentLocation(location);
            }
          },
        },
      ]
    );
  }, [addresses.length]);

  useEffect(() => {
    if (user?.phone && addresses.length === 0 && !isLoading) {
      promptForLocation();
    }
  }, [user?.phone, addresses.length, isLoading, promptForLocation]);

  const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId) || addresses[0];

  return {
    addresses,
    selectedAddress,
    selectedAddressId,
    isLoading,
    currentLocation,
    addAddress,
    updateAddress,
    deleteAddress,
    selectAddress,
    getCurrentLocation,
  };
});
