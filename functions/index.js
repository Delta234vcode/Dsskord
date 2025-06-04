const path = require("path");
// Завантажує змінні з .env файлу, що знаходиться в тій самій директорії (functions/)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const authRoutes = require("./auth"); // Файл з логікою Passport

// Ініціалізація Firebase Admin SDK для роботи з Firestore
const admin = require("firebase-admin");
// 💥 ВАЖЛИВО: Переконайтеся, що файл serviceAccountKey.json знаходиться у директорії functions/
// і його додано до .gitignore, щоб не потрапив у репозиторій!
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore(); // Екземпляр Firestore

const app = express();
const PORT = process.env.PORT || 3000;

// Налаштування CORS
const corsOptions = {
  // 🔑 ВАЖЛИВО: Замініть на URL вашого розгорнутого фронтенду на Render
  origin: process.env.FRONTEND_URL || "https://dsskord.onrender.com",
  methods: ["GET", "POST"],
  credentials: true, // Дозволяє надсилати cookie (важливо для сесій)
};
app.use(cors(corsOptions));

// Middleware для парсингу JSON та обслуговування статичних файлів
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public"))); // Обслуговує файли з папки public/

// Налаштування для роботи Express за проксі (важливо для Render.com)
app.set('trust proxy', 1);

// Ініціалізація сесій
app.use(
  session({
    secret: process.env.SESSION_SECRET || "ЗАМІНИ_ЦЕЙ_ДУЖЕ_СЕКРЕТНИЙ_КЛЮЧ_У_ПРОДАКШН", // 🔐 Використовуйте змінну середовища!
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Надсилати cookie тільки через HTTPS у продакшн
      httpOnly: true, // Запобігає доступу до cookie через JavaScript на клієнті
      // sameSite: 'lax', // 'lax' або 'none' (якщо 'none', то secure: true обов'язково).
                         // 'lax' зазвичай підходить, якщо фронтенд і бекенд на одному домені.
    },
  })
);

// Ініціалізація Passport
app.use(passport.initialize());
app.use(passport.session());

// Маршрути автентифікації
app.use("/auth", authRoutes);

// ================== API МАРШРУТИ ===================

// /tap
app.post("/tap", async (req, res) => {
  try {
    const { userId } = req.body; // Кількість монет за тап має визначатися на сервері
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }

    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();

    // Визначаємо винагороду за тап на сервері (приклад)
    const tapRewardAmount = 1; // Або більш складна логіка на основі даних користувача

    if (!doc.exists) {
      // Створюємо користувача, якщо його немає (це має відбуватися при першому вході/реєстрації)
      // Тут можна повернути помилку або створити користувача з початковими даними
      console.warn(`User ${userId} not found for /tap. Creating with initial tap.`);
      await userRef.set({
          coins: tapRewardAmount,
          capsules: [],
          lastClaim: 0,
          // ... інші поля за замовчуванням
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

// /claim - приклад, як може виглядати отримання щоденної нагороди
app.post("/claim", async (req, res) => {
  const { userId, day } = req.body; // `day` - номер дня для отримання нагороди
  if (!userId || typeof day !== 'number') {
    return res.status(400).json({ success: false, message: "Missing userId or claim day" });
  }

  const userRef = db.collection("users").doc(userId);
  const doc = await userRef.get();

  if (!doc.exists) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const userData = doc.data();
  // TODO: Додати логіку перевірки, чи може користувач отримати нагороду за цей день
  // (наприклад, перевірка lastClaim, streak тощо)

  // Приклад визначення нагороди на сервері
  const dailyRewardsConfig = [ /* Ваша конфігурація щоденних нагород з config.js фронтенду, але має бути тут */
        { day: 1, coins: 125, type: 'coins' }, /* ... і т.д. ... */
        { day: 7, capsule: "diamond", type: 'capsule' }
  ];
  const rewardConfig = dailyRewardsConfig.find(r => r.day === day);
  if (!rewardConfig) {
    return res.status(400).json({ success: false, message: "Invalid claim day" });
  }

  let updateData = {};
  let rewardGiven;

  if (rewardConfig.type === 'coins') {
    updateData.coins = admin.firestore.FieldValue.increment(rewardConfig.coins);
    rewardGiven = rewardConfig.coins;
  } else if (rewardConfig.type === 'capsule') {
    updateData.capsules = admin.firestore.FieldValue.arrayUnion({ type: rewardConfig.capsule, timestamp: Date.now() });
    rewardGiven = rewardConfig.capsule;
  }
  updateData['claim.lastClaim'] = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  updateData['claim.streak'] = day; // Або userData.claim.streak + 1

  await userRef.update(updateData);

  const updatedDoc = await userRef.get();
  res.json({
    success: true,
    reward: rewardGiven, // Надіслати, що саме було видано
    newStreak: updatedDoc.data().claim.streak,
    coins: updatedDoc.data().coins, // Надіслати оновлений баланс
    // ... інші дані, якщо потрібно
  });
});


app.get("/balance", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, coins: doc.data().coins || 0 });
  } catch (error) {
    console.error("Error in /balance:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/capsule", async (req, res) => {
  const { userId, type } = req.body;
  if (!userId || !type) return res.status(400).json({ success: false, message: "Missing userId or type" });

  try {
    const userRef = db.collection("users").doc(userId);
    // Використовуємо arrayUnion для безпечного додавання до масиву
    await userRef.update({
      capsules: admin.firestore.FieldValue.arrayUnion({ type, timestamp: Date.now() })
    }, { merge: true }); // merge: true створить документ, якщо його немає, хоча краще мати окрему логіку створення

    const updatedDoc = await userRef.get(); // Отримати оновлений документ
    res.json({ success: true, capsules: updatedDoc.data().capsules || [] });
  } catch (error) {
    console.error("Error in /capsule:", error);
    // Якщо користувач не існує, update може видати помилку. Потрібно створювати користувача.
    // Розгляньте можливість створення користувача, якщо його немає, або повертайте відповідну помилку.
    if (error.code === 5) { // Код помилки Firestore "NOT_FOUND"
        // Спроба створити користувача з цією капсулою
        try {
            await db.collection("users").doc(userId).set({
                coins: 0, // Початкові монети
                capsules: [{ type, timestamp: Date.now() }],
                // ... інші поля за замовчуванням ...
            });
            const newUserDoc = await db.collection("users").doc(userId).get();
            return res.json({ success: true, capsules: newUserDoc.data().capsules });
        } catch (createError) {
            console.error("Error creating user during /capsule:", createError);
            return res.status(500).json({ success: false, message: "Internal server error during user creation" });
        }
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Маршрут для обслуговування фронтенду (має бути останнім серед GET маршрутів)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
  console.log(`🔑 Session secret configured: ${process.env.SESSION_SECRET ? 'From ENV (OK)' : '"replace_this..." (INSECURE DEFAULT!)'}`);
  console.log(`🌐 CORS configured for origin: ${corsOptions.origin}`);
  if (process.env.NODE_ENV !== 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "replace_this_super_secret_key_in_production")) {
    console.warn('⚠️ WARNING: Default or missing session secret is used in non-production. Set a strong SESSION_SECRET in your .env file for development and in Render environment variables for production!');
  }
});
