import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'emp ms',
  password: '12345',
  port: 5432,
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL successfully!"))
  .catch(err => console.error("❌ Database connection error:", err));

export default pool;
