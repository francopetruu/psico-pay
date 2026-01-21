import { createDb, type Database } from "@psico-pay/db";

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    db = createDb(connectionString);
  }
  return db;
}

// For convenience, export a proxy that lazily initializes
export const lazyDb = new Proxy({} as Database, {
  get(_, prop) {
    const database = getDb();
    return Reflect.get(database, prop);
  },
});
