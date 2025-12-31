import { runSeed } from './seed';

async function migrate() {
  console.log('Starting migration...');
  
  try {
    console.log('Seeding data...');
    await runSeed();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

migrate().catch(console.error);
