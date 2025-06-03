const path = require("path");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const authRoutes = require("./auth");

// Firestore Admin SDK
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // 💥 шлях до твого JSON ключа

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore(); // ← Тепер можемо використовувати Firestore

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: "https://dsskord.onrender.com",
  methods: ["GET", "POST"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "replace_this_super_secret_key_in_production",
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

// ========== API ==========

app.post("/tap", async (req, res) => {
  const { userId, coins } = req.body;
  if (!userId || typeof coins !== "number") return res.status(400).json({ success: false });

  const userRef = db.collection("users").doc(userId);
  const doc = await userRef.get();
  if (!doc.exists) {
    await userRef.set({ coins, capsules: [], lastClaim: 0, referredBy: null });
  } else {
    const prev = doc.data().coins || 0;
    await userRef.update({ coins: prev + coins });
  }

  const updated = await userRef.get();
  res.json({ success: true, coins: updated.data().coins });
});

app.post("/claim", async (req, res) => {
  const { userId, reward } = req.body;
  if (!userId || typeof reward !== "number") return res.status(400).json({ success: false });

  const userRef = db.collection("users").doc(userId);
  const doc = await userRef.get();
  if (!doc.exists) {
    await userRef.set({ coins: reward, lastClaim: Date.now(), capsules: [], referredBy: null });
  } else {
    const current = doc.data();
    await userRef.update({
      coins: (current.coins || 0) + reward,
      lastClaim: Date.now(),
    });
  }

  const updated = await userRef.get();
  res.json({
    success: true,
    coins: updated.data().coins,
    lastClaim: updated.data().lastClaim,
  });
});

app.get("/balance", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false });

  const doc = await db.collection("users").doc(userId).get();
  if (!doc.exists) return res.status(404).json({ success: false });

  res.json({ success: true, coins: doc.data().coins || 0 });
});

app.post("/capsule", async (req, res) => {
  const { userId, type } = req.body;
  if (!userId || !type) return res.status(400).json({ success: false });

  const userRef = db.collection("users").doc(userId);
  const doc = await userRef.get();
  if (!doc.exists) {
    await userRef.set({
      coins: 0,
      capsules: [{ type, timestamp: Date.now() }],
      lastClaim: 0,
      referredBy: null,
    });
  } else {
    const prev = doc.data().capsules || [];
    await userRef.update({
      capsules: [...prev, { type, timestamp: Date.now() }],
    });
  }

  const updated = await userRef.get();
  res.json({ success: true, capsules: updated.data().capsules });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
});
