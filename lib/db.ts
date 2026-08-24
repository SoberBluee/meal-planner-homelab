import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;

if (!host || !user || password === undefined || !database) {
  throw new Error(
    "DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME environment variables are required",
  );
}

const pool = mysql.createPool({
  host,
  port: Number(process.env.DB_PORT || 3306),
  user,
  password,
  database,
});

export const db = drizzle(pool, { schema, mode: "default" });
