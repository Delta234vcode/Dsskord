const path = require("path");
require("dotenv").config(); // Assumes .env is in the same directory as index.js

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const authRoutes = require("./auth"); // Assuming auth.js is correctly set up

const app = express();
const PORT = process.env.PORT || 3000;

// ❗ IMPORTANT: Replace userStates with database logic (e.g., Firestore)
// const userStates = {}; // This in-memory store will lose data on server restart.

// --- Middleware ---
// Configure CORS to allow requests from your specific frontend domain on Render
const corsOptions = {
  origin: "https://dsskord.onrender.com", // 🔑 YOUR ACTUAL FRONTEND DOMAIN ON RENDER
  methods: ["GET", "POST"],
  credentials: true, // Important for sessions/cookies
};
app.use(cors(corsOptions));

app.use(express.json()); // To parse JSON request bodies
app.use(express.static(path.join(__dirname, "../public"))); // Serve static files (frontend)

// Session and Passport initialization
app.use(
  session({
    secret: process.env.SESSION_SECRET || "replace_this_super_secret_key_in_production", // 🔐 Use environment variable for secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Send cookie only over HTTPS in production
      httpOnly: true, // Helps prevent XSS
      // sameSite: 'lax', // Consider for CSRF protection, may need 'none' if frontend/backend are different sites entirely and using credentials
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Authentication routes from auth.js
app.use("/auth", authRoutes);

// ================== API ROUTES ===================
// 💡 TODO: Replace all userStates logic with database operations (e.g., Firestore)

// /tap
app.post("/tap", async (req, res) => { // Changed to async if DB operations are needed
  try {
    const { userId, coins: tapAmount } = req.body; // Renamed coins to tapAmount for clarity
    if (!userId || typeof tapAmount !== "number") {
      return res.status(400).json({ success: false, message: "Missing userId or coins (tapAmount)" });
    }

    // --- DATABASE LOGIC START ---
    // Example: Fetch user from DB, update coins, save user
    // let user = await db.collection('users').doc(userId).get();
    // if (!user.exists) {
    //   await db.collection('users').doc(userId).set({ coins: tapAmount, capsules: [], lastClaim: 0, referredBy: null });
    //   return res.json({ success: true, coins: tapAmount });
    // } else {
    //   const currentCoins = user.data().coins || 0;
    //   const newCoins = currentCoins + tapAmount;
    //   await db.collection('users').doc(userId).update({ coins: newCoins });
    //   return res.json({ success: true, coins: newCoins });
    // }
    // --- DATABASE LOGIC END ---

    // Current in-memory logic (for reference, to be replaced)
    if (!userStates[userId]) {
      userStates[userId] = { coins: 0, capsules: [], lastClaim: 0, referredBy: null };
    }
    userStates[userId].coins += tapAmount;
    return res.json({ success: true, coins: userStates[userId].coins });

  } catch (error) {
    console.error("Error in /tap:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// /claim
app.post("/claim", async (req, res) => { // Changed to async
  try {
    const { userId, reward } = req.body;
    if (!userId || typeof reward !== "number") {
      return res.status(400).json({ success: false, message: "Missing userId or reward" });
    }

    // --- DATABASE LOGIC (similar to /tap) ---
    // Fetch user, update coins and lastClaim, save user
    // ---

    // Current in-memory logic
    if (!userStates[userId]) {
      userStates[userId] = { coins: 0, capsules: [], lastClaim: 0, referredBy: null };
    }
    userStates[userId].coins += reward;
    userStates[userId].lastClaim = Date.now();
    return res.json({ success: true, coins: userStates[userId].coins, lastClaim: userStates[userId].lastClaim }); // Added lastClaim to response

  } catch (error) {
    console.error("Error in /claim:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// /balance
app.get("/balance", async (req, res) => { // Changed to async
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }

    // --- DATABASE LOGIC ---
    // Fetch user from DB and return coins
    // let userDoc = await db.collection('users').doc(userId).get();
    // if (!userDoc.exists) {
    //   return res.status(404).json({ success: false, message: "User not found" });
    // }
    // return res.json({ success: true, coins: userDoc.data().coins || 0 });
    // ---

    // Current in-memory logic
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
app.post("/capsule", async (req, res) => { // Changed to async
  try {
    const { userId, type } = req.body;
    if (!userId || !type) {
      return res.status(400).json({ success: false, message: "Missing userId or type" });
    }

    // --- DATABASE LOGIC ---
    // Fetch user, add capsule to user's capsule array/collection, save user
    // ---

    // Current in-memory logic
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

// Catch-all for serving the frontend's index.html (useful for SPAs with client-side routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production' && process.env.SESSION_SECRET === 'keyboard cat') {
    console.warn('⚠️ WARNING: Default session secret "keyboard cat" is used. Change this for production!');
  }
  console.log(`🔑 Session secret configured: ${process.env.SESSION_SECRET ? 'From ENV' : '"keyboard cat" (default - insecure!)'}`);
  console.log(`🌐 CORS configured for origin: ${corsOptions.origin}`);

});
