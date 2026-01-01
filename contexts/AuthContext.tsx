import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { trpc } from '@/lib/trpc';

const USER_STORAGE_KEY = '@user';
const TOKEN_STORAGE_KEY = '@token';

export const [AuthContext, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = trpc.auth.login.useMutation();
  const updateProfileMutation = trpc.auth.updateProfile.useMutation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem(USER_STORAGE_KEY),
        AsyncStorage.getItem(TOKEN_STORAGE_KEY),
      ]);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedToken) {
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithFirebase = async (phone: string, firebaseToken: string): Promise<boolean> => {
    console.log('Firebase login attempt:', { phone });
    
    try {
      const result = await loginMutation.mutateAsync({ 
        phone, 
        firebaseToken 
      });
      
      const newUser: User = {
        id: String(result.user.id),
        phone: String(result.user.phone),
        name: String(result.user.name),
        email: result.user.email as string | undefined,
      };
      
      await Promise.all([
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser)),
        AsyncStorage.setItem(TOKEN_STORAGE_KEY, String(result.token)),
      ]);
      
      setUser(newUser);
      setToken(String(result.token));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem(USER_STORAGE_KEY),
      AsyncStorage.removeItem(TOKEN_STORAGE_KEY),
    ]);
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const result = await updateProfileMutation.mutateAsync({
        userId: user.id,
        name: updates.name,
        email: updates.email,
      });
      
      const updatedUser: User = {
        id: String(result.id),
        phone: result.phone,
        name: result.name,
        email: result.email,
      };
      
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    loginWithFirebase,
    logout,
    updateProfile,
  };
});
