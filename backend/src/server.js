import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import notepadRoutes from "./routes/notepadRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import superadminRoutes from "./routes/superadminRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Digital Notepad backend is running.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/notepads", notepadRoutes);
app.use("/api/superadmins", superadminRoutes);

app.listen(PORT, () => {
  console.log(
    `Digital Notepad API running on http://localhost:${PORT}`
  );
});