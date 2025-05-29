// --- Firebase Configuration ---
// Цей об'єкт використовується у game.js для ініціалізації
const firebaseConfig = {
  apiKey: "AIzaSyA-5vMo5l2IuDAG6kUniaaEDUe2fWCH9BA",
  authDomain: "phonetapds.firebaseapp.com",
  projectId: "phonetapds",
  storageBucket: "phonetapds.appspot.com",
  messagingSenderId: "242188860122",
  appId: "1:242188860122:web:69ccb4f2b33dd0a0f43e3",
  measurementId: "G-Y36M3FRDFF"
};



// --- Game Configuration ---

// Capsule Image URLs
const capsuleImageURLs = {
    main: "https://i.postimg.cc/LXJkVrmF/Chat-GPT-Image-26-2025-18-53-50.png",
    diamond: "https://i.postimg.cc/5txn87Hf/Chat-GPT-Image-26-2025-18-54-36.png",
    silver: "https://i.postimg.cc/2804Pk3N/Chat-GPT-Image-26-2025-18-54-41.png",
    gold: "https://i.postimg.cc/htQD8sdQ/Chat-GPT-Image-26-2025-18-51-24.png",
    discord: "https://i.postimg.cc/Prznz767/Chat-GPT-Image-26-2025-18-48-09.png"
};

// Sound File Paths
const soundPaths = {
    tap: 'assetssfx/tap_click.mp3',
    drop: 'assetssfx/capsule_drop.mp3',
    boost: 'assetssfx/boost_activate.mp3'
};

// Energy and Tapping System
const MAX_ENERGY = 200;
const MAX_TAPS_BEFORE_COOLDOWN = 200;
const COOLDOWN_DURATION_MS = 3 * 60 * 60 * 1000; // 3 години

// Capsule Economics
const BASE_COINS_PER_TAP = 1;

const capsuleBonuses = {
    silver: 2,
    gold: 6,
    diamond: 20,
    discord: 40
};

// Capsule Drop Logic
const capsuleDropChances = {
    discord: 5,
    diamond: 10,
    gold: 15,
    silver: 70
};

// Daily Rewards Structure
const dailyRewardsConfig = [
    { day: 1, coins: 125, type: 'coins' },
    { day: 2, coins: 250, type: 'coins' },
    { day: 3, coins: 375, type: 'coins' },
    { day: 4, coins: 500, type: 'coins' },
    { day: 5, coins: 750, type: 'coins' },
    { day: 6, coins: 1000, type: 'coins' },
    { day: 7, capsule: "diamond", type: 'capsule' }
];

// Referral System Bonuses
const REFERRAL_URL_JOIN_BONUS = 25;
const REFERRAL_MANUAL_CODE_ENTER_BONUS_REFEREE = 100;
const REFERRAL_MILESTONE_BONUS_REFERRER = 100;

// Leaderboard
const LEADERBOARD_SIZE = 10;