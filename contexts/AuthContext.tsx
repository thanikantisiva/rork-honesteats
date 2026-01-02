import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { userAPI } from '@/lib/api';

const USER_STORAGE_KEY = '@user';
const TOKEN_STORAGE_KEY = '@token';

export const [AuthContext, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const loginWithFirebase = async (phone: string, firebaseToken: string, testMode: boolean = false): Promise<boolean> => {
    console.log('Firebase login attempt:', { phone, testMode });
    
    try {
      if (testMode) {
        console.log('[MOCK] Creating mock user');
        const userId = `user-${phone.replace(/\+/g, '')}`;
        const newUser: User = {
          id: userId,
          phone: phone,
          name: 'Test User',
          email: undefined,
        };
        
        console.log('[MOCK] Saving mock user to AsyncStorage...');
        await Promise.all([
          AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser)),
          AsyncStorage.setItem(TOKEN_STORAGE_KEY, userId),
        ]);
        console.log('[MOCK] Mock user saved to AsyncStorage');
        
        setUser(newUser);
        setToken(userId);
        console.log('[MOCK] Login completed successfully');
        return true;
      }
      
      console.log('Checking if user exists...');
      let apiUser;
      try {
        apiUser = await userAPI.getUser(phone);
        console.log('User found:', apiUser);
      } catch {
        console.log('User not found, creating new user...');
        apiUser = await userAPI.createUser({ phone, name: 'User' });
        console.log('User created:', apiUser);
      }
      
      const newUser: User = {
        id: phone,
        phone: apiUser.phone,
        name: apiUser.name,
        email: apiUser.email,
      };
      
      console.log('Saving user to AsyncStorage...');
      await Promise.all([
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser)),
        AsyncStorage.setItem(TOKEN_STORAGE_KEY, phone),
      ]);
      console.log('User saved to AsyncStorage');
      
      setUser(newUser);
      setToken(phone);
      console.log('Login completed successfully');
      return true;
    } catch (error: any) {
      console.error('Login failed with error:', error);
      console.error('Error message:', error?.message);
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
      const result = await userAPI.updateUser(user.phone, {
        name: updates.name,
        email: updates.email,
      });
      
      const updatedUser: User = {
        id: user.phone,
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
