import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Address } from '@/types';
import { addressAPI, APIAddress } from '@/lib/api';
import { useAuth } from './AuthContext';

const SELECTED_ADDRESS_KEY = '@selected_address';

export const [AddressContext, useAddresses] = createContextHook(() => {
  const { user } = useAuth();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId) || addresses[0];

  return {
    addresses,
    selectedAddress,
    selectedAddressId,
    isLoading,
    addAddress,
    updateAddress,
    deleteAddress,
    selectAddress,
  };
});
