import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'test_database';

let isConnected = false;

mongoose.connection.on('error', (error) => {
  console.error('✗ MongoDB connection error:', error.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠ MongoDB disconnected. The driver will attempt to reconnect automatically.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('✓ MongoDB reconnected');
});

export const connectDatabase = async () => {
  if (isConnected) {
    console.log('✓ Using existing MongoDB connection');
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(MONGO_URL, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: process.env.VERCEL ? 15000 : 5000,
    });

    isConnected = true;
    console.log(`✓ MongoDB connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    if (process.env.VERCEL) {
      throw error;
    }
    process.exit(1);
  }
};

export default mongoose;
