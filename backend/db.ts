import { Surreal } from 'surrealdb';

let db: Surreal | null = null;
let isConnecting = false;

export async function getDb(): Promise<Surreal> {
  if (db) {
    try {
      await db.ping();
      return db;
    } catch {
      console.log('Database connection lost, reconnecting...');
      db = null;
    }
  }

  if (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return getDb();
  }

  isConnecting = true;

  try {
    const endpoint = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
    const namespace = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
    const token = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

    if (!endpoint || !namespace || !token) {
      throw new Error('Database configuration missing');
    }

    db = new Surreal();
    
    await db.connect(endpoint);
    await db.use({ namespace, database: 'main' });
    await db.authenticate(token);

    console.log('Database connected successfully');
    return db;
  } finally {
    isConnecting = false;
  }
}

export async function initializeSchema() {
  const db = await getDb();

  await db.query(`
    DEFINE TABLE IF NOT EXISTS users SCHEMAFULL;
    DEFINE FIELD IF NOT EXISTS phone ON users TYPE string;
    DEFINE FIELD IF NOT EXISTS name ON users TYPE string;
    DEFINE FIELD IF NOT EXISTS email ON users TYPE option<string>;
    DEFINE FIELD IF NOT EXISTS createdAt ON users TYPE datetime DEFAULT time::now();
    DEFINE INDEX IF NOT EXISTS phoneIndex ON users COLUMNS phone UNIQUE;

    DEFINE TABLE IF NOT EXISTS restaurants SCHEMAFULL;
    DEFINE FIELD IF NOT EXISTS name ON restaurants TYPE string;
    DEFINE FIELD IF NOT EXISTS image ON restaurants TYPE string;
    DEFINE FIELD IF NOT EXISTS cuisine ON restaurants TYPE array<string>;
    DEFINE FIELD IF NOT EXISTS rating ON restaurants TYPE number;
    DEFINE FIELD IF NOT EXISTS totalRatings ON restaurants TYPE number;
    DEFINE FIELD IF NOT EXISTS deliveryTime ON restaurants TYPE string;
    DEFINE FIELD IF NOT EXISTS deliveryFee ON restaurants TYPE number;
    DEFINE FIELD IF NOT EXISTS minOrder ON restaurants TYPE number;
    DEFINE FIELD IF NOT EXISTS distance ON restaurants TYPE string;
    DEFINE FIELD IF NOT EXISTS isPureVeg ON restaurants TYPE bool;
    DEFINE FIELD IF NOT EXISTS offers ON restaurants TYPE option<array<string>>;
    DEFINE FIELD IF NOT EXISTS createdAt ON restaurants TYPE datetime DEFAULT time::now();

    DEFINE TABLE IF NOT EXISTS menuItems SCHEMAFULL;
    DEFINE FIELD IF NOT EXISTS restaurantId ON menuItems TYPE record<restaurants>;
    DEFINE FIELD IF NOT EXISTS name ON menuItems TYPE string;
    DEFINE FIELD IF NOT EXISTS description ON menuItems TYPE string;
    DEFINE FIELD IF NOT EXISTS price ON menuItems TYPE number;
    DEFINE FIELD IF NOT EXISTS image ON menuItems TYPE option<string>;
    DEFINE FIELD IF NOT EXISTS category ON menuItems TYPE string;
    DEFINE FIELD IF NOT EXISTS isVeg ON menuItems TYPE bool;
    DEFINE FIELD IF NOT EXISTS rating ON menuItems TYPE option<number>;
    DEFINE FIELD IF NOT EXISTS isAvailable ON menuItems TYPE bool DEFAULT true;
    DEFINE FIELD IF NOT EXISTS createdAt ON menuItems TYPE datetime DEFAULT time::now();

    DEFINE TABLE IF NOT EXISTS addresses SCHEMAFULL;
    DEFINE FIELD IF NOT EXISTS userId ON addresses TYPE record<users>;
    DEFINE FIELD IF NOT EXISTS type ON addresses TYPE string ASSERT $value IN ['Home', 'Work', 'Other'];
    DEFINE FIELD IF NOT EXISTS nickname ON addresses TYPE option<string>;
    DEFINE FIELD IF NOT EXISTS address ON addresses TYPE string;
    DEFINE FIELD IF NOT EXISTS landmark ON addresses TYPE option<string>;
    DEFINE FIELD IF NOT EXISTS lat ON addresses TYPE number;
    DEFINE FIELD IF NOT EXISTS lng ON addresses TYPE number;
    DEFINE FIELD IF NOT EXISTS createdAt ON addresses TYPE datetime DEFAULT time::now();

    DEFINE TABLE IF NOT EXISTS orders SCHEMAFULL;
    DEFINE FIELD IF NOT EXISTS userId ON orders TYPE record<users>;
    DEFINE FIELD IF NOT EXISTS restaurantId ON orders TYPE record<restaurants>;
    DEFINE FIELD IF NOT EXISTS restaurantName ON orders TYPE string;
    DEFINE FIELD IF NOT EXISTS restaurantImage ON orders TYPE string;
    DEFINE FIELD IF NOT EXISTS items ON orders TYPE array<object>;
    DEFINE FIELD IF NOT EXISTS totalAmount ON orders TYPE number;
    DEFINE FIELD IF NOT EXISTS deliveryFee ON orders TYPE number;
    DEFINE FIELD IF NOT EXISTS status ON orders TYPE string DEFAULT 'placed';
    DEFINE FIELD IF NOT EXISTS deliveryAddress ON orders TYPE object;
    DEFINE FIELD IF NOT EXISTS orderDate ON orders TYPE datetime DEFAULT time::now();
    DEFINE FIELD IF NOT EXISTS estimatedDeliveryTime ON orders TYPE option<datetime>;
  `);

  console.log('Database schema initialized');
}
