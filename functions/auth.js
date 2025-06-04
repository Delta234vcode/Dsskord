const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
// const admin = require("firebase-admin"); // Цей рядок можна видалити, якщо admin більше ніде не використовується напряму
const { db } = require("./firebaseAdmin"); // Імпортуємо db з нашого модуля

const router = express.Router();

// Ці функції тепер важливі для правильної роботи сесій з базою даних
passport.serializeUser((user, done) => {
  // Зберігаємо лише Discord ID користувача в сесії
  // `user` тут - це об'єкт profile, отриманий від Discord
  console.log('AUTH.JS: Serializing user ID:', user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  // За Discord ID отримуємо дані користувача з нашої бази даних (Firestore)
  try {
    console.log('AUTH.JS: Deserializing user ID:', id);
    const userRef = db.collection('users').doc(id);
    const doc = await userRef.get();
    if (doc.exists) {
      // Повертаємо дані користувача з Firestore (або комбінацію, якщо потрібно)
      // Важливо, щоб об'єкт, який повертається, був тим, що очікує ваш req.user
      done(null, { id: doc.id, ...doc.data(), discordProfile: doc.data().discordProfile || {} }); // Додаємо discordProfile, якщо він є
    } else {
      // Користувача немає в нашій БД, хоча він пройшов OAuth. Це не мало б статися,
      // якщо ми створюємо запис в БД після успішного OAuth.
      // Можна повернути помилку або null.
      console.warn(`AUTH.JS: User with ID ${id} not found in Firestore during deserialization.`);
      done(null, false); // Або done(new Error('User not found in DB'));
    }
  } catch (error) {
    console.error('AUTH.JS: Error deserializing user:', error);
    done(error);
  }
});

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK_URL,
      scope: ["identify", "email"], // Додамо 'email' для прикладу, якщо потрібно
    },
    async (accessToken, refreshToken, profile, done) => {
      // Ця функція викликається після успішної автентифікації з Discord
      // `profile` містить дані користувача від Discord
      console.log('AUTH.JS: Discord profile received:', profile.username, profile.id);
      try {
        const userRef = db.collection('users').doc(profile.id);
        const doc = await userRef.get();

        if (!doc.exists) {
          // Користувача немає в нашій базі, створюємо новий запис
          console.log(`AUTH.JS: User ${profile.id} not found. Creating new user.`);
          const newUser = {
            username: profile.username,
            discordId: profile.id, // Зберігаємо Discord ID
            email: profile.email, // Якщо запитували scope 'email'
            avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
            coins: 0, // Початкові значення
            capsules: [],
            lastClaim: null,
            claim: { streak: 0, lastClaim: null }, // Додано структуру для щоденних нагород
            referrals: { code: profile.id.substring(0,7).toUpperCase(), invitedBy: null, activatedCount: 0 }, // Генеруємо простий реф. код
            taps: { count: 0, hourlyRate: 1, lastTap: null }, // Початкові значення для тапів
            discordProfile: profile // Зберігаємо весь профіль Discord для довідки (опціонально)
          };
          await userRef.set(newUser);
          return done(null, newUser); // Передаємо створеного користувача (або тільки профіль, якщо так налаштовано serializeUser)
        } else {
          // Користувач вже існує, можливо, оновимо деякі дані
          console.log(`AUTH.JS: User ${profile.id} found. Updating profile info.`);
          await userRef.update({
            username: profile.username,
            email: profile.email,
            avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
            discordProfile: profile // Оновлюємо профіль Discord
          });
          // Повертаємо дані користувача з нашої БД (або профіль Discord, залежно від логіки serializeUser)
          return done(null, {id: doc.id, ...doc.data(), discordProfile: profile });
        }
      } catch (error) {
        console.error('AUTH.JS: Error in DiscordStrategy verify callback:', error);
        return done(error);
      }
    }
  )
);

// Маршрути
router.get("/discord", passport.authenticate("discord")); // Ініціює автентифікацію з Discord

router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/?authError=true", // Перенаправлення у випадку помилки (можна додати параметр)
    // successRedirect: "/" // Можна вказати тут, або обробити в наступному middleware
  }),
  (req, res) => {
    // Цей блок виконується після успішної автентифікації
    // req.user тепер доступний і сесія встановлена
    console.log('AUTH.JS: Successful callback, req.user:', req.user ? req.user.id : 'undefined');
    console.log('AUTH.JS: Session after callback:', req.session);
    res.redirect(process.env.FRONTEND_URL || "/"); // Перенаправляємо на головну сторінку фронтенду
  }
);

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("AUTH.JS: Logout error:", err);
      return next(err); // Передаємо помилку далі для обробки
    }
    req.session.destroy((destroyErr) => { // Явно знищуємо сесію
        if (destroyErr) {
            console.error("AUTH.JS: Session destruction error during logout:", destroyErr);
            // Можна продовжити перенаправлення, навіть якщо сесію не вдалося знищити
        }
        console.log("AUTH.JS: User logged out, session destroyed.");
        res.clearCookie('connect.sid'); // Очищуємо cookie на стороні клієнта (назва cookie може відрізнятися)
        res.redirect(process.env.FRONTEND_URL || "/"); // Перенаправляємо на головну
    });
  });
});

router.get("/user", (req, res) => {
  if (req.isAuthenticated()) { // Кращий спосіб перевірки
    // Повертаємо дані користувача з сесії (які були десеріалізовані)
    console.log('AUTH.JS: /user endpoint hit, user is authenticated:', req.user.id);
    res.json(req.user); // req.user тут - це те, що повернув deserializeUser
  } else {
    console.log('AUTH.JS: /user endpoint hit, user NOT authenticated.');
    res.status(401).json({ error: "Not authenticated" });
  }
});

module.exports = router;
