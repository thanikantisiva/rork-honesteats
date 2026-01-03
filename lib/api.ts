const API_BASE_URL = 'https://c0iw8nlwn4.execute-api.ap-south-1.amazonaws.com/default';

export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`[API] ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log('[API] Request body:', options.body);
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log(`[API] Response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API] Error response:', errorData);
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] Response data:', data);
    return data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new APIClient(API_BASE_URL);

export interface APIUser {
  phone: string;
  name: string;
  email?: string;
  role: string;
  isActive: boolean;
  dateOfBirth?: string;
  createdAt: string;
}

export interface APIRestaurant {
  restaurant_location: string;
  restaurantId: string;
  name: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  restaurantImage?: string;
  cuisine: string[];
  createdAt?: string;
}

export interface APIMenuItem {
  restaurant_location: string;
  restaurant_id: string;
  item_id: string;
  name: string;
  price: number;
  category?: string;
  isVeg: boolean;
  isAvailable: boolean;
  description?: string;
  image?: string;
}

export interface APIAddress {
  phone: string;
  addressId: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface APIOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface APIOrder {
  orderId: string;
  customerPhone: string;
  restaurantId: string;
  items: APIOrderItem[];
  foodTotal: number;
  deliveryFee: number;
  platformFee: number;
  grandTotal: number;
  status: string;
  riderId?: string | null;
  createdAt: number;
}

export const userAPI = {
  getUser: (phone: string) => api.get<APIUser>(`/api/v1/users/${encodeURIComponent(phone)}`),
  
  createUser: (data: { phone: string; name?: string; email?: string; dateOfBirth?: string }) =>
    api.post<APIUser>('/api/v1/users', data),
  
  updateUser: (phone: string, data: { name?: string; email?: string; isActive?: boolean; dateOfBirth?: string }) =>
    api.put<APIUser>(`/api/v1/users/${encodeURIComponent(phone)}`, data),
};

export const restaurantAPI = {
  listRestaurants: () =>
    api.get<{ restaurants: APIRestaurant[]; total: number }>('/api/v1/restaurants'),
  
  getRestaurant: (restaurantId: string) =>
    api.get<APIRestaurant>(`/api/v1/restaurants/${encodeURIComponent(restaurantId)}`),
  
  listMenuItems: (restaurantId: string) =>
    api.get<{ restaurantId: string; items: APIMenuItem[]; total: number }>(
      `/api/v1/restaurants/${encodeURIComponent(restaurantId)}/menu`
    ),
  
  getMenuItem: (restaurantId: string, itemId: string) =>
    api.get<APIMenuItem>(`/api/v1/restaurants/${encodeURIComponent(restaurantId)}/menu/${encodeURIComponent(itemId)}`),
};

export const addressAPI = {
  listAddresses: (phone: string) =>
    api.get<{ phone: string; addresses: APIAddress[]; total: number }>(
      `/api/v1/users/${encodeURIComponent(phone)}/addresses`
    ),
  
  getAddress: (phone: string, addressId: string) =>
    api.get<APIAddress>(`/api/v1/users/${encodeURIComponent(phone)}/addresses/${encodeURIComponent(addressId)}`),
  
  createAddress: (phone: string, data: { label: string; address: string; lat: number; lng: number }) =>
    api.post<APIAddress>(`/api/v1/users/${encodeURIComponent(phone)}/addresses`, data),
  
  updateAddress: (
    phone: string,
    addressId: string,
    data: { label?: string; address?: string; lat?: number; lng?: number }
  ) => api.put<APIAddress>(`/api/v1/users/${encodeURIComponent(phone)}/addresses/${encodeURIComponent(addressId)}`, data),
  
  deleteAddress: (phone: string, addressId: string) =>
    api.delete<{ message: string }>(`/api/v1/users/${encodeURIComponent(phone)}/addresses/${encodeURIComponent(addressId)}`),
};

export const orderAPI = {
  getOrder: (orderId: string) => api.get<APIOrder>(`/api/v1/orders/${encodeURIComponent(orderId)}`),
  
  listOrders: (params: { customerPhone?: string; restaurantId?: string; riderId?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.customerPhone) query.append('customerPhone', params.customerPhone);
    if (params.restaurantId) query.append('restaurantId', params.restaurantId);
    if (params.riderId) query.append('riderId', params.riderId);
    if (params.limit) query.append('limit', String(params.limit));
    
    return api.get<{ orders: APIOrder[]; total: number }>(`/api/v1/orders?${query.toString()}`);
  },
  
  createOrder: (data: {
    customerPhone: string;
    restaurantId: string;
    items: APIOrderItem[];
    foodTotal: number;
    deliveryFee: number;
    platformFee: number;
    riderId?: string | null;
  }) => api.post<APIOrder>('/api/v1/orders', data),
  
  updateOrderStatus: (orderId: string, data: { status: string; riderId?: string }) =>
    api.put<APIOrder>(`/api/v1/orders/${encodeURIComponent(orderId)}/status`, data),
};
