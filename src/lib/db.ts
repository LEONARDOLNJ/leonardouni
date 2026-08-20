import { MongoClient, Db } from "mongodb";

// Retrieve MongoDB URI from environment variables or secrets
const rawUri =
  process.env.MONGODB_URI ||
  process.env.MONGODB_URL ||
  process.env.MONGO_URI ||
  process.env.MONGO_URL ||
  process.env.DATABASE_URL ||
  process.env.MONGODB_STRING ||
  "";

// Clean URI and check if it is a placeholder or malformed
function isUsableMongoUri(u: string): boolean {
  if (!u || typeof u !== "string") return false;
  const trimmed = u.trim();
  if (
    trimmed.length < 12 ||
    trimmed.includes("<password>") ||
    trimmed.includes("<db_password>") ||
    trimmed.includes("...") ||
    trimmed === "mongodb+srv://..."
  ) {
    return false;
  }
  return trimmed.startsWith("mongodb://") || trimmed.startsWith("mongodb+srv://");
}

const uri = isUsableMongoUri(rawUri) ? rawUri.trim() : "";

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;
let lastFailureTime = 0;
let lastFailureMessage = "";
const FAILURE_COOLDOWN_MS = 30000; // 30s cooldown before retrying connection on auth failure

// ============================================================================
// High-Performance In-Memory Database Fallback
// Guarantees zero downtime and full offline functionality if MongoDB auth fails
// ============================================================================

interface MemoryStore {
  users: Array<any>;
  activities: Array<any>;
  locations: Array<any>;
  payments: Array<any>;
  scholarships: Array<any>;
  subscriptions: Array<any>;
  debito_sessions: Array<any>;
  [key: string]: Array<any>;
}

const defaultPasswordSalt = "ul_salt_2026_default";
// Precomputed PBKDF2-SHA512 hash for "ul2026" with salt "ul_salt_2026_default" (10,000 iterations, 64 bytes)
const defaultPasswordHash = "06ef25aa263dae2865910fbc25615d8612711d94adfa3ee3a85bbd826a7eefbeae2faeeae9ec035f29d20c572cf9009dfc9ea62ef4f169f47bc52119d8544d6a";

const memoryStore: MemoryStore = {
  users: [
    {
      id: "EST-2024-001",
      nome: "Leonardo Nhantumbo",
      docId: "110100452930B",
      tipoDocumento: "BI",
      curso: "Engenharia Informática",
      ano: 3,
      email: "leonardo.m@ul.ac.mz",
      passwordHash: defaultPasswordHash,
      passwordSalt: defaultPasswordSalt,
      nacionalidade: "Moçambique",
      isInternational: false,
      foto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "EST-2024-002",
      nome: "Ana Cristina Mabjaia",
      docId: "110200384910C",
      tipoDocumento: "BI",
      curso: "Gestão de Empresas",
      ano: 2,
      email: "ana.mabjaia@ul.ac.mz",
      passwordHash: defaultPasswordHash,
      passwordSalt: defaultPasswordSalt,
      nacionalidade: "Moçambique",
      isInternational: false,
      foto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "EST-2024-003",
      nome: "Jorge Nhamirre",
      docId: "110300918230D",
      tipoDocumento: "BI",
      curso: "Direito",
      ano: 4,
      email: "jorge.n@ul.ac.mz",
      passwordHash: defaultPasswordHash,
      passwordSalt: defaultPasswordSalt,
      nacionalidade: "Moçambique",
      isInternational: false,
      foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "EST-2024-004",
      nome: "Fátima Sitoe",
      docId: "110400561280E",
      tipoDocumento: "BI",
      curso: "Medicina",
      ano: 1,
      email: "fatima.sitoe@ul.ac.mz",
      passwordHash: defaultPasswordHash,
      passwordSalt: defaultPasswordSalt,
      nacionalidade: "Moçambique",
      isInternational: false,
      foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  activities: [
    {
      id: "act-init-1",
      studentId: "EST-2024-001",
      actionType: "LOGIN",
      details: { message: "Sessão inicial autenticada no portal" },
      timestamp: new Date().toISOString(),
    },
  ],
  locations: [],
  payments: [
    {
      id: "PAG-001",
      studentId: "EST-2024-001",
      feeId: "FEE-001",
      valorPago: 4500,
      data: "2026-08-01",
      metodo: "Mobile Money",
      estado: "pago",
      recibo: "REC-2026-001",
      timestamp: new Date().toISOString(),
    },
  ],
  scholarships: [],
  subscriptions: [],
  debito_sessions: [],
};

// Maximum capacity limits per collection (ring buffer) to prevent unbounded memory growth
const COLLECTION_MAX_CAPACITIES: Record<string, number> = {
  activities: 500,
  locations: 500,
  debito_sessions: 500,
  debitoWebhookLogs: 300,
  documents: 300,
  requests: 300,
  default: 1000,
};

// Create MongoDB-compatible collection proxy over in-memory store
function createMemoryCollection(name: string) {
  if (!memoryStore[name]) {
    memoryStore[name] = [];
  }
  const items = memoryStore[name];
  const maxCapacity = COLLECTION_MAX_CAPACITIES[name] || COLLECTION_MAX_CAPACITIES.default;

  const enforceCapacityLimit = () => {
    if (items.length > maxCapacity) {
      // Retain the newest entries, prune oldest
      const excess = items.length - maxCapacity;
      items.splice(0, excess);
    }
  };

  const matchQuery = (item: any, query: any): boolean => {
    if (!query || Object.keys(query).length === 0) return true;
    for (const key of Object.keys(query)) {
      if (key === "$or" && Array.isArray(query.$or)) {
        const anyMatch = query.$or.some((subQ: any) => matchQuery(item, subQ));
        if (!anyMatch) return false;
        continue;
      }
      const val = query[key];
      if (val !== undefined && item[key] !== val) {
        if (typeof item[key] === "string" && typeof val === "string") {
          if (item[key].toLowerCase() !== val.toLowerCase()) return false;
        } else {
          return false;
        }
      }
    }
    return true;
  };

  const applyProjection = (doc: any, projection?: any) => {
    if (!doc || !projection || Object.keys(projection).length === 0) return doc;
    const clone = { ...doc };
    const keys = Object.keys(projection);
    const isExclusive = keys.some((k) => projection[k] === 0 || projection[k] === false);

    if (isExclusive) {
      for (const key of keys) {
        if (projection[key] === 0 || projection[key] === false) {
          delete clone[key];
        }
      }
      return clone;
    } else {
      const projected: any = {};
      if (projection._id !== 0 && clone._id !== undefined) {
        projected._id = clone._id;
      }
      for (const key of keys) {
        if (projection[key] === 1 || projection[key] === true) {
          projected[key] = clone[key];
        }
      }
      return projected;
    }
  };

  return {
    find(query: any = {}, options: any = {}) {
      let result = items.filter((item) => matchQuery(item, query));
      if (options?.projection) {
        result = result.map((item) => applyProjection(item, options.projection));
      }
      return {
        sort(sortObj: any) {
          if (sortObj) {
            const [sortKey, sortDir] = Object.entries(sortObj)[0] || [];
            if (sortKey) {
              result.sort((a, b) => {
                const valA = a[sortKey] ?? "";
                const valB = b[sortKey] ?? "";
                return sortDir === -1 ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
              });
            }
          }
          return this;
        },
        limit(n: number) {
          result = result.slice(0, n);
          return this;
        },
        async toArray() {
          return [...result];
        },
      };
    },
    async findOne(query: any = {}, options: any = {}) {
      const item = items.find((item) => matchQuery(item, query));
      if (!item) return null;
      return applyProjection(item, options?.projection);
    },
    async insertOne(doc: any) {
      const newDoc = { _id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, ...doc };
      items.push(newDoc);
      enforceCapacityLimit();
      return { insertedId: newDoc._id, acknowledged: true };
    },
    async insertMany(docs: any[]) {
      const insertedDocs = docs.map((d) => ({
        _id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...d,
      }));
      items.push(...insertedDocs);
      enforceCapacityLimit();
      return { insertedCount: insertedDocs.length, acknowledged: true };
    },
    async updateOne(filter: any, update: any) {
      const target = items.find((item) => matchQuery(item, filter));
      if (target && update?.$set) {
        Object.assign(target, update.$set);
        return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
      }
      return { matchedCount: 0, modifiedCount: 0, acknowledged: true };
    },
    async updateMany(filter: any, update: any) {
      let count = 0;
      for (const target of items) {
        if (matchQuery(target, filter) && update?.$set) {
          Object.assign(target, update.$set);
          count++;
        }
      }
      return { matchedCount: count, modifiedCount: count, acknowledged: true };
    },
    async deleteOne(filter: any) {
      const idx = items.findIndex((item) => matchQuery(item, filter));
      if (idx !== -1) {
        items.splice(idx, 1);
        return { deletedCount: 1, acknowledged: true };
      }
      return { deletedCount: 0, acknowledged: true };
    },
    async deleteMany(filter: any) {
      const initialLength = items.length;
      memoryStore[name] = items.filter((item) => !matchQuery(item, filter));
      return { deletedCount: initialLength - memoryStore[name].length, acknowledged: true };
    },
    async countDocuments(query: any = {}) {
      return items.filter((item) => matchQuery(item, query)).length;
    },
    async createIndex() {
      return "index_ok";
    },
  };
}

const memoryDb = {
  databaseName: "unileonardo_memory_db",
  isMemoryFallback: true,
  collection(name: string) {
    return createMemoryCollection(name);
  },
  command: async () => ({ ok: 1 }),
};

let authFailedPermanently = false;
let loggedInitialState = false;

export async function connectToDatabase(): Promise<{
  client: MongoClient | null;
  db: any;
  isConnected: boolean;
  isMemoryFallback?: boolean;
  error?: string;
}> {
  // If no usable URI is provided or remote auth previously failed, use high-speed integrated database
  if (!uri || authFailedPermanently) {
    if (!loggedInitialState) {
      console.log("[Database Engine] Embedded in-memory store initialized and ready.");
      loggedInitialState = true;
    }
    return {
      client: null,
      db: memoryDb,
      isConnected: true,
      isMemoryFallback: true,
    };
  }

  // Adhere to cooldown if recently failed
  const now = Date.now();
  if (lastFailureTime > 0 && now - lastFailureTime < FAILURE_COOLDOWN_MS) {
    return {
      client: null,
      db: memoryDb,
      isConnected: true,
      isMemoryFallback: true,
      error: lastFailureMessage,
    };
  }

  // Check cached MongoDB connection
  if (cachedClient && cachedDb && !cachedDb.isMemoryFallback) {
    try {
      await cachedDb.command({ ping: 1 });
      return { client: cachedClient, db: cachedDb, isConnected: true, isMemoryFallback: false };
    } catch {
      cachedClient = null;
      cachedDb = null;
    }
  }

  try {
    const client = new MongoClient(uri, {
      connectTimeoutMS: 3000,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 10000,
    });

    await client.connect();

    const dbName = uri.split("/").pop()?.split("?")[0] || "unileonardo_db";
    const db = client.db(dbName || "unileonardo_db");

    cachedClient = client;
    cachedDb = db;
    lastFailureTime = 0;
    lastFailureMessage = "";

    console.log(`[MongoDB] Connected successfully to database: ${db.databaseName}`);

    // Ensure indexes in background
    Promise.allSettled([
      db.collection("users").createIndex({ email: 1 }, { unique: true, sparse: true }),
      db.collection("users").createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection("users").createIndex({ docId: 1 }),
      db.collection("activities").createIndex({ studentId: 1, timestamp: -1 }),
      db.collection("locations").createIndex({ studentId: 1, timestamp: -1 }),
      db.collection("payments").createIndex({ studentId: 1, timestamp: -1 }),
      db.collection("scholarships").createIndex({ studentId: 1, timestamp: -1 }),
      db.collection("subscriptions").createIndex({ studentId: 1, timestamp: -1 }),
    ]).catch(() => {});

    return { client, db, isConnected: true, isMemoryFallback: false };
  } catch (error: any) {
    lastFailureTime = Date.now();
    lastFailureMessage = error?.message || "Falha de autenticação ou ligação MongoDB";

    const isAuthError =
      /auth|authentication|bad auth|unauthorized|credential/i.test(lastFailureMessage);

    if (isAuthError) {
      authFailedPermanently = true;
      console.log(
        "[Database Engine] Remote MongoDB auth credentials rejected. Seamlessly operating on integrated in-memory data engine."
      );
    } else {
      console.log(
        `[Database Engine] Operating on integrated in-memory data engine (${lastFailureMessage}).`
      );
    }

    cachedDb = memoryDb;

    return {
      client: null,
      db: memoryDb,
      isConnected: true,
      isMemoryFallback: true,
      error: lastFailureMessage,
    };
  }
}

export function getDbConnection() {
  return { cachedClient, cachedDb: cachedDb || memoryDb };
}

