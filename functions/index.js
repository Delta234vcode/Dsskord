const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "https://phonetapds.web.app", // або твій хостинг
  methods: ["GET", "POST"],
}));
app.use(express.json());

const userStates = {}; // Просте зберігання в RAM

// 🟢 TAP endpoint
app.post("/tap", (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const reward = Math.floor(Math.random() * 5) + 1;
    if (!userStates[userId]) userStates[userId] = { coins: 0, capsules: [] };

    userStates[userId].coins += reward;
    res.json({ success: true, coins: reward, newBalance: userStates[userId].coins });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal error", error: error.message });
  }
});

// 🎁 Daily Claim endpoint
app.post("/claim", (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const reward = 25;
    if (!userStates[userId]) userStates[userId] = { coins: 0, capsules: [] };

    userStates[userId].coins += reward;
    res.json({ success: true, coins: reward, newBalance: userStates[userId].coins });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal error", error: error.message });
  }
});

// 💰 Balance get
app.get("/balance/:uid", (req, res) => {
  try {
    const uid = req.params.uid;
    if (!userStates[uid]) userStates[uid] = { coins: 0, capsules: [] };

    res.json({ success: true, coins: userStates[uid].coins });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal error", error: error.message });
  }
});

// 💰 Balance add
app.post("/balance/:uid", (req, res) => {
  try {
    const uid = req.params.uid;
    const { coins } = req.body;
    if (!coins) return res.status(400).json({ success: false, message: "Missing coins value" });

    if (!userStates[uid]) userStates[uid] = { coins: 0, capsules: [] };
    userStates[uid].coins += coins;

    res.json({ success: true, newBalance: userStates[uid].coins });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal error", error: error.message });
  }
});

// 📦 Capsule add
app.post("/capsule/:uid", (req, res) => {
  try {
    const uid = req.params.uid;
    const { type } = req.body;
    if (!type) return res.status(400).json({ success: false, message: "Missing capsule type" });

    if (!userStates[uid]) userStates[uid] = { coins: 0, capsules: [] };
    userStates[uid].capsules.push({ type, added: Date.now() });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal error", error: error.message });
  }
});

// 📦 Capsule get
app.get("/capsule/:uid", (req, res) => {
  try {
    const uid = req.params.uid;
    if (!userStates[uid]) userStates[uid] = { coins: 0, capsules: [] };

    res.json({ success: true, capsules: userStates[uid].capsules });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal error", error: error.message });
  }
});

// 🟢 Server launch
app.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
});
