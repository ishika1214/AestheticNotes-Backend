import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://admin:admin123@localhost:27017/aestheticnotes?authSource=admin";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "aestheticnotes"
    });

    console.log("MongoDB connected successfully 🚀");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};