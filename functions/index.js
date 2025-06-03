const path = require("path");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const authRoutes = require("./auth");

// 🔥 Firebase Admin SDK
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // 👈 створити файл через Firebase > Service Account

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 3000;

// === CORS ===
const corsOptions = {
  origin: "https://dsskord.onrender.com",
  methods: ["GET", "POST"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// === Sessions & Passport ===
app.use(
  session({
    secret: process.env.SESSION_SECRET || "replace_this_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/auth", authRoutes);

// === /tap ===
app.post("/tap", async (req, res) => {
  try {
    const { userId, coins: tapAmount } = req.body;
    if (!userId || typeof tapAmount !== "number") {
      return res.status(400).json({ success: false, message: "Missing userId or coins" });
    }

    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) {
      await userRef.set({ coins: tapAmount, capsules: [], lastClaim: 0 });
    } else {
      const current = doc.data().coins || 0;
      await userRef.update({ coins: current + tapAmount });
    }

    const updated = await userRef.get();
    return res.json({ success: true, coins: updated.data().coins });

  } catch (error) {
    console.error("Error in /tap:", error);
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

// === /claim ===
app.post("/claim", async (req, res) => {
  try {
    const { userId, reward } = req.body;
    if (!userId || typeof reward !== "number") {
      return res.status(400).json({ success: false, message: "Missing userId or reward" });
    }

    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) {
      await userRef.set({ coins: reward, capsules: [], lastClaim: Date.now() });
    } else {
      const user = doc.data();
      await userRef.update({
        coins: (user.coins || 0) + reward,
        lastClaim: Date.now(),
      });
    }

    const updated = await userRef.get();
    return res.json({
      success: true,
      coins: updated.data().coins,
      lastClaim: updated.data().lastClaim,
    });

  } catch (error) {
    console.error("Error in /claim:", error);
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

// === /balance ===
app.get("/balance", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }

    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, coins: doc.data().coins || 0 });

  } catch (error) {
    console.error("Error in /balance:", error);
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

// === /capsule ===
app.post("/capsule", async (req, res) => {
  try {
    const { userId, type } = req.body;
    if (!userId || !type) {
      return res.status(400).json({ success: false, message: "Missing userId or type" });
    }

    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) {
      await userRef.set({ coins: 0, capsules: [{ type, timestamp: Date.now() }], lastClaim: 0 });
    } else {
      const user = doc.data();
      const updatedCapsules = user.capsules || [];
      updatedCapsules.push({ type, timestamp: Date.now() });
      await userRef.update({ capsules: updatedCapsules });
    }

    const updated = await userRef.get();
    return res.json({ success: true, capsules: updated.data().capsules });

  } catch (error) {
    console.error("Error in /capsule:", error);
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

// === Catch all ===
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`🟢 Server running on http://localhost:${PORT}`);
});
