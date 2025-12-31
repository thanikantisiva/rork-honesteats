import { getDb, initializeSchema } from './db';

export async function seedRestaurants() {
  const db = await getDb();

  const restaurants = [
    {
      name: 'Spice Junction',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      cuisine: ['North Indian', 'Chinese', 'Tandoor'],
      rating: 4.3,
      totalRatings: 5200,
      deliveryTime: '30-35 min',
      deliveryFee: 30,
      minOrder: 149,
      distance: '2.1 km',
      isPureVeg: false,
      offers: ['50% off up to ₹100', 'Free delivery above ₹199'],
    },
    {
      name: 'Dosa Palace',
      image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800',
      cuisine: ['South Indian', 'Breakfast'],
      rating: 4.5,
      totalRatings: 3800,
      deliveryTime: '25-30 min',
      deliveryFee: 25,
      minOrder: 99,
      distance: '1.5 km',
      isPureVeg: true,
      offers: ['40% off up to ₹80'],
    },
    {
      name: 'Pizza Hub',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
      cuisine: ['Italian', 'Pizza', 'Fast Food'],
      rating: 4.2,
      totalRatings: 6500,
      deliveryTime: '35-40 min',
      deliveryFee: 35,
      minOrder: 199,
      distance: '3.2 km',
      isPureVeg: false,
      offers: ['Buy 1 Get 1 Free'],
    },
    {
      name: 'Biryani House',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
      cuisine: ['Biryani', 'Mughlai', 'North Indian'],
      rating: 4.4,
      totalRatings: 4200,
      deliveryTime: '40-45 min',
      deliveryFee: 40,
      minOrder: 249,
      distance: '4.0 km',
      isPureVeg: false,
      offers: ['Free dessert on orders above ₹399'],
    },
    {
      name: 'Healthy Bowl',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
      cuisine: ['Healthy', 'Salads', 'Continental'],
      rating: 4.6,
      totalRatings: 2100,
      deliveryTime: '20-25 min',
      deliveryFee: 20,
      minOrder: 149,
      distance: '1.8 km',
      isPureVeg: true,
      offers: ['20% off on first order'],
    },
    {
      name: 'Burger King',
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
      cuisine: ['Burgers', 'Fast Food', 'American'],
      rating: 4.1,
      totalRatings: 8900,
      deliveryTime: '30-35 min',
      deliveryFee: 30,
      minOrder: 149,
      distance: '2.5 km',
      isPureVeg: false,
      offers: ['2 Whoppers at ₹299'],
    },
  ];

  for (const restaurant of restaurants) {
    await db.create('restaurants', restaurant);
  }

  console.log(`Seeded ${restaurants.length} restaurants`);
}

export async function seedMenuItems(restaurantId: string) {
  const db = await getDb();

  const menuItems = [
    {
      restaurantId,
      name: 'Paneer Butter Masala',
      description: 'Rich and creamy paneer curry with butter and spices',
      price: 280,
      category: 'Main Course',
      isVeg: true,
      rating: 4.5,
      isAvailable: true,
    },
    {
      restaurantId,
      name: 'Chicken Tikka Masala',
      description: 'Grilled chicken in creamy tomato curry',
      price: 320,
      category: 'Main Course',
      isVeg: false,
      rating: 4.6,
      isAvailable: true,
    },
    {
      restaurantId,
      name: 'Garlic Naan',
      description: 'Fresh naan bread with garlic and butter',
      price: 60,
      category: 'Breads',
      isVeg: true,
      rating: 4.4,
      isAvailable: true,
    },
    {
      restaurantId,
      name: 'Veg Biryani',
      description: 'Fragrant rice with mixed vegetables and spices',
      price: 220,
      category: 'Biryani',
      isVeg: true,
      rating: 4.3,
      isAvailable: true,
    },
  ];

  for (const item of menuItems) {
    await db.create('menuItems', item);
  }

  console.log(`Seeded ${menuItems.length} menu items for restaurant ${restaurantId}`);
}

export async function runSeed() {
  try {
    await initializeSchema();
    await seedRestaurants();
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  }
}

export { initializeSchema };
