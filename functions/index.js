// index.js
// --------
// Головний файл запуску сервера Express, налаштування CORS, session, Passport та API-роутів.

require("dotenv").config(); // Завантажуємо .env (якщо є локально) або беремо змінні середовища

const path = require("path");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");

// Підключаємо Firestore та admin із firebaseAdmin.js
const { db, admin } = require("./firebaseAdmin");

// Підключаємо роутери автентифікації
const authRoutes = require("./auth");

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// Налаштування CORS
// ======================
// Дозволяємо фронтенду (process.env.FRONTEND_URL) робити запити з куками
const corsOptions = {
  origin: process.env.FRONTEND_URL || "https://dsskord.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};
app.use(cors(corsOptions));

// ======================
// Middleware
// ======================
app.use(express.json()); // для application/json
// Якщо у вас є форма з enctype="application/x-www-form-urlencoded", додайте також:
// app.use(express.urlencoded({ extended: true }));

// Express static для кастомного фронтенду
// Припущення: папка public/ лежить поряд із index.js (у корені проєкту)
app.use(express.static(path.join(__dirname, "public")));

// ======================
// Налаштування сесій (довіряємо проксі на Render)
// ======================
app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "ЗАМІНИ_ЦЕЙ_ДУЖЕ_СЕКРЕТНИЙ_КЛЮЧ_У_ПРОДАКШН",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // якщо prod — лише HTTPS
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

// Ініціалізація Passport
app.use(passport.initialize());
app.use(passport.session());

// ======================
// 1) Роутери автентифікації
// ======================
app.use("/auth", authRoutes);

// ======================
// 2) Інші API-роутери
// ======================

// 2.1. /tap — “натискання” (збільшує монети в Firestore)
app.post("/tap", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }

    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    const tapRewardAmount = 1;

    if (!doc.exists) {
      console.warn(`User ${userId} not found for /tap. Creating with initial tap.`);
      await userRef.set({
        coins: tapRewardAmount,
        capsules: [],
        lastClaim: 0,
      });
      return res.json({ success: true, coins: tapRewardAmount });
    } else {
      const currentCoins = doc.data().coins || 0;
      const newCoins = currentCoins + tapRewardAmount;
      await userRef.update({ coins: newCoins });
      return res.json({ success: true, coins: newCoins });
    }
  } catch (error) {
    console.error("Error in /tap:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 2.2. /claim — видача щоденного бонусу (coins або capsule)
app.post("/claim", async (req, res) => {
  try {
    const { userId, day } = req.body;
    if (!userId || typeof day !== "number") {
      return res
        .status(400)
        .json({ success: false, message: "Missing userId or claim day" });
    }

    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userData = doc.data();
    const dailyRewardsConfig = [
      { day: 1, coins: 125, type: "coins" },
      { day: 7, capsule: "diamond", type: "capsule" },
    ];
    const rewardConfig = dailyRewardsConfig.find((r) => r.day === day);
    if (!rewardConfig) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid claim day" });
    }

    let updateData = {};
    let rewardGiven;

    if (rewardConfig.type === "coins") {
      // Для FieldValue.increment() імпортували admin у цьому файлі
      updateData.coins = admin.firestore.FieldValue.increment(
        rewardConfig.coins
      );
      rewardGiven = rewardConfig.coins;
    } else if (rewardConfig.type === "capsule") {
      updateData.capsules = admin.firestore.FieldValue.arrayUnion({
        type: rewardConfig.capsule,
        timestamp: Date.now(),
      });
      rewardGiven = rewardConfig.capsule;
    }

    // Оновлюємо дату останнього та довжину стрижки
    updateData["claim.lastClaim"] = new Date().toISOString().split("T")[0];
    updateData["claim.streak"] = day;

    await userRef.update(updateData);

    const updatedDoc = await userRef.get();
    res.json({
      success: true,
      reward: rewardGiven,
      newStreak: updatedDoc.data().claim.streak,
      coins: updatedDoc.data().coins,
    });
  } catch (error) {
    console.error("Error in /claim:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 2.3. /balance — повертає кількість монет
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
    res.json({ success: true, coins: doc.data().coins || 0 });
  } catch (error) {
    console.error("Error in /balance:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 2.4. /capsule — додає капсулу в масив capsules
app.post("/capsule", async (req, res) => {
  try {
    const { userId, type } = req.body;
    if (!userId || !type) {
      return res
        .status(400)
        .json({ success: false, message: "Missing userId or type" });
    }

    const userRef = db.collection("users").doc(userId);
    // Оновлюємо масив capsules через FieldValue.arrayUnion
    await userRef.update({
      capsules: admin.firestore.FieldValue.arrayUnion({
        type,
        timestamp: Date.now(),
      }),
    });

    const updatedDoc = await userRef.get();
    res.json({ success: true, capsules: updatedDoc.data().capsules || [] });
  } catch (error) {
    console.error("Error in /capsule:", error);
    // Якщо користувача немає, створимо з початковим масивом capsules
    if (error.code === 5) {
      try {
        await db.collection("users").doc(req.body.userId).set({
          coins: 0,
          capsules: [{ type: req.body.type, timestamp: Date.now() }],
        });
        const newUserDoc = await db.collection("users").doc(req.body.userId).get();
        return res.json({ success: true, capsules: newUserDoc.data().capsules });
      } catch (createError) {
        console.error("Error creating user during /capsule:", createError);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error during user creation" });
      }
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ======================
// 3) Обслуговування фронтенду (індексний HTML)
// ======================
// Має стояти ПІСЛЯ інших GET-маршрутів, щоб спрацьовувати на всі нерозпізнані GET-запити.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ======================
// Запуск сервера
// ======================
app.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
  console.log(
    `🔑 Session secret configured: ${
      process.env.SESSION_SECRET ? "From ENV (OK)" : '"ЗАМІНИ_ЦЕЙ_КЛЮЧ" (DEFAULT!)'
    }`
  );
  console.log(`🌐 CORS configured for origin: ${corsOptions.origin}`);
  if (
    process.env.NODE_ENV !== "production" &&
    (!process.env.SESSION_SECRET ||
      process.env.SESSION_SECRET === "ЗАМІНИ_ЦЕЙ_ДЛЯ_ПРОДАКШН")
  ) {
    console.warn(
      "⚠️ WARNING: Використовується дефолтний або відсутній SESSION_SECRET у НЕ-ПРОДАКШН середовищі."
    );
  }
});
