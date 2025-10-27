const { Pool } = require("pg");

// Create connection pool
const pool = new Pool({
  connectionString: process.env.db_POSTGRES_URL || process.env.db_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test connection
pool.on("connect", () => {
  console.log("Database connected successfully");
});

pool.on("error", (err) => {
  console.error("Database connection error:", err);
});

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

module.exports = { pool, query, initDatabase };
