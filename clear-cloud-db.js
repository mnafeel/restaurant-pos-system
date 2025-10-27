const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:restaurant123@localhost:5432/restaurant_pos'
});

async function clearAllCloudData() {
  console.log('3️⃣ Clearing cloud PostgreSQL database...');
  
  try {
    // Get all table names
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log('📋 Found tables:', tables);
    
    // Disable foreign key checks temporarily
    await pool.query('SET session_replication_role = replica;');
    
    // Clear all tables
    for (const table of tables) {
      try {
        await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        console.log(`✅ Cleared table: ${table}`);
      } catch (error) {
        console.log(`⚠️ Could not clear ${table}:`, error.message);
      }
    }
    
    // Re-enable foreign key checks
    await pool.query('SET session_replication_role = DEFAULT;');
    
    console.log('✅ Cloud database completely cleared!');
    
  } catch (error) {
    console.error('❌ Error clearing cloud database:', error);
  } finally {
    await pool.end();
  }
}

clearAllCloudData();

