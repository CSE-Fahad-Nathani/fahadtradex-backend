import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});

(async () => {
  try {
    const client = await pool.connect();

    console.log("✅ Connected to PostgreSQL");

    client.release();

  } catch (err) {

    console.error(
      "❌ PostgreSQL connection error:",
      err
    );

  }
})();

export default pool;