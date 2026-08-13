import { MongoClient, Db } from "mongodb";

// Retrieve MongoDB URI from environment variables or secrets
const uri =
  process.env.MONGODB_URI ||
  process.env.MONGODB_URL ||
  process.env.MONGO_URI ||
  process.env.MONGO_URL ||
  process.env.DATABASE_URL ||
  process.env.MONGODB_STRING ||
  "";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient | null; db: Db | null; isConnected: boolean; error?: string }> {
  if (!uri) {
    return {
      client: null,
      db: null,
      isConnected: false,
      error: "Nenhuma string de conexão MongoDB foi configurada em process.env (MONGODB_URI).",
    };
  }

  if (cachedClient && cachedDb) {
    try {
      // Ping database to verify active connection
      await cachedDb.command({ ping: 1 });
      return { client: cachedClient, db: cachedDb, isConnected: true };
    } catch (err) {
      console.warn("MongoDB ping failed, reconnecting...", err);
      cachedClient = null;
      cachedDb = null;
    }
  }

  try {
    const client = new MongoClient(uri, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    await client.connect();

    // Default database name from URI path or default to "unileonardo_db"
    const dbName = uri.split("/").pop()?.split("?")[0] || "unileonardo_db";
    const db = client.db(dbName || "unileonardo_db");

    cachedClient = client;
    cachedDb = db;

    console.log(`[MongoDB] Connected successfully to database: ${db.databaseName}`);

    // Ensure helpful indexes for fast queries
    await Promise.allSettled([
      db.collection("users").createIndex({ email: 1 }, { unique: true, sparse: true }),
      db.collection("users").createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection("users").createIndex({ docId: 1 }),
      db.collection("activities").createIndex({ studentId: 1, timestamp: -1 }),
      db.collection("locations").createIndex({ studentId: 1, timestamp: -1 }),
      db.collection("payments").createIndex({ studentId: 1, timestamp: -1 }),
      db.collection("scholarships").createIndex({ studentId: 1, timestamp: -1 }),
      db.collection("subscriptions").createIndex({ studentId: 1, timestamp: -1 }),
    ]);

    return { client, db, isConnected: true };
  } catch (error: any) {
    console.error("[MongoDB] Connection Error:", error.message || error);
    return {
      client: null,
      db: null,
      isConnected: false,
      error: error.message || "Falha ao ligar ao servidor MongoDB.",
    };
  }
}

export function getDbConnection() {
  return { cachedClient, cachedDb };
}
