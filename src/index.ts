import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// 1. Determine environment file
const isProd = process.env.NODE_ENV === "production";
const envFile = isProd ? ".env.prod" : ".env.local";
const envPath = path.resolve(process.cwd(), envFile);

console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🔍 Looking for environment file at: ${envPath}`);

// 2. Load environment variables
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error(`❌ Error loading ${envFile}:`, result.error);
  } else {
    console.log(`✅ Loaded environment from ${envFile}`);
  }
} else {
  console.warn(`⚠️  ${envFile} not found at ${envPath}. Relying on system environment variables.`);
}

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import noteRoutes from "./routes/noteRoutes";
import aiRoutes from "./routes/aiRoutes";

async function startServer() {
  await connectDB();

  const app = express();
  const PORT = process.env.PORT || 3000;

  // ✅ Enable CORS
  app.use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:5174", "https://aesthetic-notes-gdzdskps4-ishika1214s-projects.vercel.app"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    })
  );

  app.use(express.json());

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/notes", noteRoutes);
  app.use("/api/ai", aiRoutes);

  app.get("/", (_req, res) => {
    res.send("AestheticNotes Backend is running 🚀");
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
    console.log('🔥🔥🔥🔥🔥🔥🔥')
  });
}

startServer();