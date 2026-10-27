import "dotenv/config";
import mysql from "mysql2/promise";

const databasePort = Number(process.env.DB_PORT ?? 3306);

if (
  !Number.isSafeInteger(databasePort) ||
  databasePort < 1 ||
  databasePort > 65535
) {
  throw new Error("DB_PORT deve ser uma porta válida.");
}

if (!process.env.DB_USER) {
  throw new Error("Configure DB_USER no arquivo .env.");
}

if (!process.env.DB_NAME) {
  throw new Error("Configure DB_NAME no arquivo .env.");
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: databasePort,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
