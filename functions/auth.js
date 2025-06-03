const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

const router = express.Router();

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify']
}, async (accessToken, refreshToken, profile, done) => {
    // ...
}));

      process.nextTick(() => done(null, profile));
    }
  )
); // Одна закриваюча дужка для passport.use

// ➕ Routes
router.get("/discord", passport.authenticate("discord"));
router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/", // Якщо автентифікація не вдалася, перенаправляємо на головну
  }),
  (req, res) => {
    // Успішна автентифікація, req.user тепер доступний
    // Перенаправляємо на головну сторінку (або на сторінку профілю, дашборд тощо)
    res.redirect("/");
  }
);

router.get("/logout", (req, res) => {
  req.logout((err) => { // req.logout приймає callback з можливою помилкою
    if (err) {
      // Обробка помилки, якщо потрібно
      console.error("Logout error:", err);
      return res.redirect("/"); // Або на сторінку помилки
    }
    res.redirect("/");
  });
});

router.get("/user", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  // Повертаємо дані користувача, які були збережені в сесії
  res.json(req.user);
});

module.exports = router;
