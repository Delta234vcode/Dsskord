const path = require("path");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const authRoutes = require("./auth");

const app = express(); // ✅ створення app
const PORT = process.env.PORT || 3000;

const userStates = {};


// Middleware (один раз, зверху!)
app.use(cors({
  origin: "https://phonetapds.web.app", // змінити на свій домен
  methods: ["GET", "POST"],
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
// Ініціалізація сесій та passport
app.use(session({
  secret: "keyboard cat", // 🔐 обов'язково заміни у продакшн
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Авторизація через Discord
app.use("/auth", authRoutes);

// ================== ROUTES ===================

// /tap
app.post("/tap", (req, res) => {
  try {
    const { userId, coins } = req.body;
    if (!userId || typeof coins !== "number") {
      return res.status(400).json({ success: false, message: "Missing userId or coins" });
    }

    if (!userStates[userId]) {
      userStates[userId] = { coins: 0, capsules: [], lastClaim: 0, referredBy: null };
    }

    userStates[userId].coins += coins;
    return res.json({ success: true, coins: userStates[userId].coins });
  } catch (error) {
    console.error("Error in /tap:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// /claim
app.post("/claim", (req, res) => {
  try {
    const { userId, reward } = req.body;
    if (!userId || typeof reward !== "number") {
      return res.status(400).json({ success: false, message: "Missing userId or reward" });
    }

    if (!userStates[userId]) {
      userStates[userId] = { coins: 0, capsules: [], lastClaim: 0, referredBy: null };
    }

    userStates[userId].coins += reward;
    userStates[userId].lastClaim = Date.now();

    return res.json({ success: true, coins: userStates[userId].coins });
  } catch (error) {
    console.error("Error in /claim:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// /balance
app.get("/balance", (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }

    const user = userStates[userId];
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, coins: user.coins });
  } catch (error) {
    console.error("Error in /balance:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// /capsule
app.post("/capsule", (req, res) => {
  try {
    const { userId, type } = req.body;
    if (!userId || !type) {
      return res.status(400).json({ success: false, message: "Missing userId or type" });
    }

    if (!userStates[userId]) {
      userStates[userId] = { coins: 0, capsules: [], lastClaim: 0, referredBy: null };
    }

    userStates[userId].capsules.push({ type, timestamp: Date.now() });

    return res.json({ success: true, capsules: userStates[userId].capsules });
  } catch (error) {
    console.error("Error in /capsule:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Головна сторінка
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
});
