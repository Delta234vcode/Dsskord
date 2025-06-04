// auth.js
// -------
// Маршрути для аутентифікації через Discord (Passport-Discord)

const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const { db } = require("./firebaseAdmin"); // беремо Firestore з firebaseAdmin.js

const router = express.Router();

// ======================
// 1) Serialize / Deserialize
// ======================
passport.serializeUser((user, done) => {
  console.log("AUTH.JS: Serializing user ID:", user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("AUTH.JS: Deserializing user ID:", id);
    const userRef = db.collection("users").doc(id);
    const doc = await userRef.get();
    if (doc.exists) {
      const data = doc.data();
      done(null, { id: doc.id, ...data, discordProfile: data.discordProfile || {} });
    } else {
      console.warn(`AUTH.JS: User with ID ${id} not found in Firestore during deserialization.`);
      done(null, false);
    }
  } catch (error) {
    console.error("AUTH.JS: Error deserializing user:", error);
    done(error);
  }
});

// ======================
// 2) Налаштування DiscordStrategy
// ======================
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK_URL,
      scope: ["identify", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("AUTH.JS: Discord profile received:", profile.username, profile.id);
      try {
        const userRef = db.collection("users").doc(profile.id);
        const doc = await userRef.get();

        if (!doc.exists) {
          console.log(`AUTH.JS: User ${profile.id} not found. Creating new user.`);
          const newUser = {
            username: profile.username,
            discordId: profile.id,
            email: profile.email || null,
            avatar: profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
              : null,
            coins: 0,
            capsules: [],
            lastClaim: null,
            claim: { streak: 0, lastClaim: null },
            referrals: {
              code: profile.id.substring(0, 7).toUpperCase(),
              invitedBy: null,
              activatedCount: 0,
            },
            taps: { count: 0, hourlyRate: 1, lastTap: null },
            discordProfile: profile,
          };
          await userRef.set(newUser);
          // Повертаємо повністю створеного користувача
          return done(null, { id: profile.id, ...newUser });
        } else {
          console.log(`AUTH.JS: User ${profile.id} found. Updating profile info.`);
          // Оновлюємо лише ті поля, які можуть змінитися
          await userRef.update({
            username: profile.username,
            email: profile.email || null,
            avatar: profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
              : null,
            discordProfile: profile,
          });
          const updatedData = (await userRef.get()).data();
          return done(null, { id: doc.id, ...updatedData });
        }
      } catch (error) {
        console.error("AUTH.JS: Error in DiscordStrategy verify callback:", error);
        return done(error);
      }
    }
  )
);

// ======================
// 3) Роутер для аутентифікації
// ======================

// Запускаємо OAuth2-потік
router.get("/discord", passport.authenticate("discord"));

// Callback-роут від Discord
router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/?authError=true",
  }),
  (req, res) => {
    console.log(
      "AUTH.JS: Successful callback, req.user:",
      req.user ? req.user.id : "undefined"
    );
    console.log("AUTH.JS: Session after callback:", req.session);
    // Після успішної веріфікації перенаправляємо на FRONTEND_URL або на корінь
    res.redirect(process.env.FRONTEND_URL || "/");
  }
);

// Вихід (logout)
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("AUTH.JS: Logout error:", err);
      return next(err);
    }
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error("AUTH.JS: Session destruction error during logout:", destroyErr);
      }
      console.log("AUTH.JS: User logged out, session destroyed.");
      res.clearCookie("connect.sid");
      res.redirect(process.env.FRONTEND_URL || "/");
    });
  });
});

// Ендпоінт для отримання інформації про поточного користувача
router.get("/user", (req, res) => {
  if (req.isAuthenticated()) {
    console.log("AUTH.JS: /user endpoint hit, user is authenticated:", req.user.id);
    res.json(req.user);
  } else {
    console.log("AUTH.JS: /user endpoint hit, user NOT authenticated.");
    res.status(401).json({ error: "Not authenticated" });
  }
});

module.exports = router;
