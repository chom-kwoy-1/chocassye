"use server";

import pg from "pg";

const DB_NAME = process.env.DB_NAME || "chocassye";
const DB_PASSWORD = process.env.DB_PASSWORD || "password";

const { Pool } = pg;
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: DB_NAME,
  password: DB_PASSWORD,
  statement_timeout: 10000, // 10 seconds
});
console.log(`Connected successfully to DB ${DB_NAME}`);

export async function getPool() {
  return pool;
}
