const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

if (!process.env.MONGO_PASSWORD) {
  console.error('❌ Error: MONGO_PASSWORD not found in .env.local');
  process.exit(1);
}

const username = process.env.MONGO_USERNAME || 'happyfood-admin';
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const cluster = process.env.MONGO_CLUSTER || 'happyfood-cluster.rzidvqb.mongodb.net';
const dbName = process.env.MONGO_DB_NAME || 'happyfood';

const uri = `mongodb+srv://${username}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority`;

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 60000,
  family: 4
};

let client;
let db;

async function connectDB() {
  if (db) return db;

  try {
    console.log('🔄 Connecting to MongoDB...');
    client = new MongoClient(uri, options);
    await client.connect();
    db = client.db(dbName);
    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
}

async function closeDB() {
  if (client) {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

module.exports = { connectDB, closeDB };
