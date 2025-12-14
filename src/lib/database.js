import { MongoClient } from 'mongodb';

// Check for required environment variables
if (!process.env.MONGO_PASSWORD) {
  throw new Error('Please define the MONGO_PASSWORD environment variable inside .env.local');
}

const username = process.env.MONGO_USERNAME || 'happyfood-admin';
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const cluster = process.env.MONGO_CLUSTER || 'happyfood-cluster.rzidvqb.mongodb.net';
const dbName = process.env.MONGO_DB_NAME || 'happyfood';

const uri = `mongodb+srv://${username}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority`;

// Connection options
const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  family: 4 // Force IPv4
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Helper to get the database instance
 * @returns {Promise<import('mongodb').Db>}
 */
export async function getDatabase() {
  const client = await clientPromise;
  return client.db(dbName);
}

/**
 * Export the client promise for use in other parts of the app (e.g. NextAuth)
 */
export default clientPromise;