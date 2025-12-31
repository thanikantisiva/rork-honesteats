import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Address } from '@/types';
import { trpc } from '@/lib/trpc';
import { useAuth } from './AuthContext';

const SELECTED_ADDRESS_KEY = '@selected_address';

export const [AddressContext, useAddresses] = createContextHook(() => {
  const { user } = useAuth();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const addressesQuery = trpc.addresses.list.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  );

  const createMutation = trpc.addresses.create.useMutation({
    onSuccess: () => {
      addressesQuery.refetch();
    },
  });

  const updateMutation = trpc.addresses.update.useMutation({
    onSuccess: () => {
      addressesQuery.refetch();
    },
  });

  const deleteMutation = trpc.addresses.delete.useMutation({
    onSuccess: () => {
      addressesQuery.refetch();
    },
  });

  useEffect(() => {
    loadSelectedAddress();
  }, []);

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
    if (!user?.id) throw new Error('User not authenticated');

    const result = await createMutation.mutateAsync({
      userId: user.id,
      type: address.type,
      nickname: address.nickname,
      address: address.address,
      landmark: address.landmark,
      lat: address.coordinates.lat,
      lng: address.coordinates.lng,
    });

    const addresses = addressesQuery.data || [];
    if (addresses.length === 0) {
      await selectAddress(String(result.id));
    }

    return result;
  };

  const updateAddress = async (id: string, updates: Partial<Omit<Address, 'id'>>) => {
    await updateMutation.mutateAsync({
      id,
      type: updates.type,
      nickname: updates.nickname,
      address: updates.address,
      landmark: updates.landmark,
      lat: updates.coordinates?.lat,
      lng: updates.coordinates?.lng,
    });
  };

  const deleteAddress = async (id: string) => {
    await deleteMutation.mutateAsync({ id });

    if (selectedAddressId === id) {
      const addresses = addressesQuery.data || [];
      const remainingAddresses = addresses.filter((addr) => addr.id !== id);
      const newSelectedId = remainingAddresses.length > 0 ? remainingAddresses[0].id : null;
      await selectAddress(newSelectedId);
    }
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

  const addresses = addressesQuery.data || [];
  const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId) || addresses[0];

  return {
    addresses,
    selectedAddress,
    selectedAddressId,
    isLoading: addressesQuery.isLoading,
    addAddress,
    updateAddress,
    deleteAddress,
    selectAddress,
  };
});
