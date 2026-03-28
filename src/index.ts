import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import noteRoutes from "./routes/noteRoutes";
import aiRoutes from "./routes/aiRoutes";


const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.prod"
    : ".env.local";

dotenv.config({ path: envFile });

async function startServer() {
  await connectDB();

  const app = express();
  const PORT = process.env.PORT || 3000;

  // ✅ Enable CORS
  app.use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:5174", "https://aesthetic-notes-zeta.vercel.app"],
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