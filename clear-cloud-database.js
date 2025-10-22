const { Pool } = require('pg');
const mongoose = require('mongoose');

// Check which database type to clear
const hasMongoDb = process.env.MONGODB_URI || process.env.MONGO_URL;
const hasPostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL;

async function clearPostgreSQLDatabase() {
  console.log('🔵 Clearing PostgreSQL cloud database...');
  
  const pool = new Pool({
    connectionString: hasPostgres
  });

  try {
    // Get all table names
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log('📋 Found PostgreSQL tables:', tables);
    
    if (tables.length === 0) {
      console.log('✅ PostgreSQL database is already empty');
      return;
    }
    
    // Disable foreign key checks temporarily
    await pool.query('SET session_replication_role = replica;');
    
    // Clear all tables
    for (const table of tables) {
      try {
        await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        console.log(`✅ Cleared PostgreSQL table: ${table}`);
      } catch (error) {
        console.log(`⚠️ Could not clear ${table}:`, error.message);
      }
    }
    
    // Re-enable foreign key checks
    await pool.query('SET session_replication_role = DEFAULT;');
    
    console.log('✅ PostgreSQL cloud database completely cleared!');
    
  } catch (error) {
    console.error('❌ Error clearing PostgreSQL database:', error);
  } finally {
    await pool.end();
  }
}

async function clearMongoDBDatabase() {
  console.log('🟢 Clearing MongoDB cloud database...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(hasMongoDb, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Found MongoDB collections:', collections.map(c => c.name));
    
    if (collections.length === 0) {
      console.log('✅ MongoDB database is already empty');
      return;
    }
    
    // Clear all collections
    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection.name).deleteMany({});
        console.log(`✅ Cleared MongoDB collection: ${collection.name}`);
      } catch (error) {
        console.log(`⚠️ Could not clear ${collection.name}:`, error.message);
      }
    }
    
    console.log('✅ MongoDB cloud database completely cleared!');
    
  } catch (error) {
    console.error('❌ Error clearing MongoDB database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

async function clearCloudDatabase() {
  console.log('🌐 Starting cloud database clearing process...');
  console.log('');
  
  if (hasMongoDb) {
    console.log('🔍 Detected MongoDB connection');
    console.log('📍 MongoDB URI:', hasMongoDb.replace(/\/\/.*@/, '//***:***@'));
    await clearMongoDBDatabase();
  } else if (hasPostgres) {
    console.log('🔍 Detected PostgreSQL connection');
    console.log('📍 PostgreSQL URL:', hasPostgres.replace(/\/\/.*@/, '//***:***@'));
    await clearPostgreSQLDatabase();
  } else {
    console.log('❌ No cloud database connection detected');
    console.log('');
    console.log('💡 To clear cloud databases, set one of these environment variables:');
    console.log('   - MONGODB_URI (for MongoDB Atlas)');
    console.log('   - POSTGRES_URL (for PostgreSQL)');
    console.log('   - DATABASE_URL (for PostgreSQL)');
    console.log('');
    console.log('🔧 Example usage:');
    console.log('   MONGODB_URI="mongodb+srv://..." node clear-cloud-db.js');
    console.log('   POSTGRES_URL="postgresql://..." node clear-cloud-db.js');
    return;
  }
  
  console.log('');
  console.log('🎉 Cloud database clearing complete!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Deploy your application');
  console.log('   2. Fresh database will be created with owner only');
  console.log('   3. Login with: owner / owner123');
  console.log('   4. Create shops and users manually');
}

// Run the clearing process
clearCloudDatabase().catch(console.error);
