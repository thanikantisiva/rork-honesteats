export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  cuisine: string[];
  rating: number;
  totalRatings: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  distance: string;
  isPureVeg: boolean;
  offers?: string[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  isVeg: boolean;
  rating?: number;
  isAvailable: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  restaurant: Restaurant;
}

export interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  nickname?: string;
  address: string;
  landmark?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  items: {
    menuItem: MenuItem;
    quantity: number;
  }[];
  totalAmount: number;
  deliveryFee: number;
  status: 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryAddress: Address;
  orderDate: Date;
  estimatedDeliveryTime?: Date;
}
