 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/functions/index.js b/functions/index.js
index 98620281ec4a6084c80cb18dba80efe606030135..8178cf9e1f36cb5d50e1b208316d1f8caeaad438 100644
--- a/functions/index.js
+++ b/functions/index.js
@@ -1,101 +1,103 @@
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
-// const userStates = {}; // This in-memory store will lose data on server restart.
+// This in-memory store will lose data on server restart.
+const userStates = {};
 
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
-    const { userId, coins: tapAmount } = req.body; // Renamed coins to tapAmount for clarity
-    if (!userId || typeof tapAmount !== "number") {
-      return res.status(400).json({ success: false, message: "Missing userId or coins (tapAmount)" });
+    const { userId, coins: tapAmount } = req.body; // optional tapAmount
+    if (!userId) {
+      return res.status(400).json({ success: false, message: "Missing userId" });
     }
+    const increment = typeof tapAmount === "number" ? tapAmount : 1;
 
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
-    userStates[userId].coins += tapAmount;
+    userStates[userId].coins += increment;
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
 
EOF
)
