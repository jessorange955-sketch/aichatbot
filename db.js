const { Pool } = require("pg");

// Database configuration with fallback hierarchy for Neon DB
function getDatabaseConfig() {
  // Primary connection string options (with db_ prefix for production)
  const connectionString =
    process.env.db_POSTGRES_URL ||
    process.env.db_DATABASE_URL ||
    process.env.db_POSTGRES_URL_NON_POOLING ||
    process.env.db_DATABASE_URL_UNPOOLED ||
    // Fallback to standard Vercel/Neon variables
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (connectionString) {
    return {
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  // Fallback to individual parameters if connection string not available
  return {
    host: process.env.db_PGHOST || process.env.db_POSTGRES_HOST || process.env.POSTGRES_HOST || process.env.PGHOST,
    port: process.env.db_PGPORT || process.env.POSTGRES_PORT || process.env.PGPORT || 5432,
    database: process.env.db_PGDATABASE || process.env.db_POSTGRES_DATABASE || process.env.POSTGRES_DATABASE || process.env.PGDATABASE,
    user: process.env.db_PGUSER || process.env.db_POSTGRES_USER || process.env.POSTGRES_USER || process.env.PGUSER,
    password: process.env.db_PGPASSWORD || process.env.db_POSTGRES_PASSWORD || process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD,
    ssl: {
      rejectUnauthorized: false,
    },
  };
}

// Create connection pool
const pool = new Pool(getDatabaseConfig());

// Test connection and log configuration
pool.on("connect", (client) => {
  console.log("✅ Database connected successfully");
  console.log(`📊 Connected to: ${client.database} on ${client.host}:${client.port}`);
});

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err.message);
  console.error("🔧 Check your environment variables and database configuration");
});

// Validate database connection on startup
async function validateConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log("🔗 Database connection validated:");
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].postgres_version.split(' ')[0]}`);
    client.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection validation failed:", error.message);
    console.error("🔧 Available environment variables:");
    const dbVars = Object.keys(process.env).filter(key =>
      key.includes('POSTGRES') || key.includes('DATABASE') || key.startsWith('db_') || key.startsWith('PG')
    );
    dbVars.forEach(key => {
      const value = process.env[key];
      if (value) {
        // Mask password in logs
        const maskedValue = key.toLowerCase().includes('password') || key.toLowerCase().includes('pass')
          ? value.replace(/:[^:@]+@/, ':***@')
          : value;
        console.log(`   ${key}: ${maskedValue}`);
      }
    });
    return false;
  }
}

// SQL query helper
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Query error:", error);
    throw error;
  }
}

// Initialize database tables
async function initDatabase() {
  try {
    console.log("Initializing database...");

    // Create users table
    await query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Create sessions table
    await query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Create messages table
    await query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                session_id TEXT NOT NULL,
                sender TEXT NOT NULL,
                text TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Insert default user if not exists
    const existingUser = await query(
      "SELECT * FROM users WHERE username = $1",
      ["defaultuser"]
    );

    if (existingUser.rows.length === 0) {
      await query(
        "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
        ["defaultuser", "user1default", "admin"]
      );
      console.log("Default user created");
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

module.exports = { pool, query, initDatabase, validateConnection };
