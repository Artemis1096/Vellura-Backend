import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Import routes
import AuthRoutes from "./Routes/AuthRoutes.js";
import MessageRoutes from "./Routes/MessageRoutes.js";
import ArticleRoutes from "./Routes/ArticleRoutes.js";
import FriendshipRoutes from "./Routes/FriendshipRoutes.js";
import UserRoutes from "./Routes/UserRoutes.js";
import TaskRoutes from "./Routes/TaskRoutes.js";
import MoodRoutes from "./Routes/MoodRoutes.js";

// Import middlewares and utilities
import { setupGoogleAuth } from "./Config/googleAuthConfig.js";
import connectDB from "./Config/DBConfig.js";
import { upload } from "./Config/cloudinaryConfig.js";
import { app, server } from "./socket/socket.js";
import { assignDailyTask } from "./Controllers/TaskController.js";

// Path configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
setupGoogleAuth(app);

// Database Connection
connectDB();

// ─── CUSTOM HEADER MIDDLEWARE ─────────────────────────────────────────────
// This middleware adds a header 'Access-Control-Allow-Origin: *'
// **Caution:** Using '*' is not allowed with credentials. Adjust as needed.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    return res.status(200).json({});
  }
  next();
});
// ───────────────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: "*",
    credentials: true, // Allow cookies and auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight OPTIONS requests for /api endpoints
app.options("/api", (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.sendStatus(204);
  } else {
    // Return a forbidden status for disallowed origins
    res.sendStatus(403);
  }
});

// Middleware setup
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static file serving
const musicDir = path.join(__dirname, "public/music");
const imagesDir = path.join(__dirname, "public/images");
app.use("/music", express.static(musicDir));
app.use("/images", express.static(imagesDir));

// Routes setup
app.use("/api/auth", AuthRoutes);
app.use("/api/message", MessageRoutes);
app.use("/api/articles", ArticleRoutes);
app.use("/api/friends", FriendshipRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/tasks", TaskRoutes);
app.use("/api/mood", MoodRoutes);

// API Endpoints
app.get("/", (req, res) => {
  res.send("Welcome to Mental-Health-app");
});

app.get("/songs", (req, res) => {
  fs.readdir(musicDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Error fetching songs" });

    const songs = files
      .filter((file) => file.endsWith(".mp3"))
      .map((file) => {
        const songName = path.parse(file).name;
        return {
          title: songName,
          src: `/music/${file}`,
          cover: `/images/${songName}.jpg`,
        };
      });
    res.status(200).json(songs);
  });
});

// File upload route
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.json({ imageUrl: req.file.path });
});

// Assign daily tasks when server starts
assignDailyTask();

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
