import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Global connection cache interface for better type safety
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached = (global as any).mongoose as MongooseCache;

if (!cached) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export default async function connectDB(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if none exists
  if (!cached.promise) {
    if (!MONGODB_URI) {
      throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local"
      );
    }

    // Connection options for better performance
    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    try {
      cached.promise = mongoose.connect(MONGODB_URI, options);
    } catch (error) {
      cached.promise = null;
      if (process.env.NODE_ENV !== "production") {
        console.error("MongoDB connection error:", error);
      }
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    if (process.env.NODE_ENV !== "production") {
      console.error("MongoDB connection failed:", error);
    }
    throw error;
  }
}
