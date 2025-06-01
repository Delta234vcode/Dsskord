const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

const router = express.Router();

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,     // <--- ВИПРАВИТИ ТУТ
      clientSecret: process.env.DISCORD_CLIENT_SECRET, // <--- ВИПРАВИТИ ТУТ
      callbackURL: process.env.DISCORD_CALLBACK_URL,  // <--- ВИПРАВИТИ ТУТ
      scope: ["identify"],
    },
    (accessToken, refreshToken, profile, done) => {
      process.nextTick(() => done(null, profile));
    }
  )
);


      scope: ["identify"],
    },
    (accessToken, refreshToken, profile, done) => {
      process.nextTick(() => done(null, profile));
    }
  )
);

// ➕ Routes
router.get("/discord", passport.authenticate("discord"));
router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/",
  }),
  (req, res) => res.redirect("/")
);

router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

router.get("/user", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  res.json(req.user);
});

module.exports = router;
