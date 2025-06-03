if (window !== window.parent) {
  document.body.classList.add("discord-mode");
}

// --- Firebase Instances (to be initialized) ---
let db;
let auth; // Firebase auth instance
let functions;

// --- Game State Variables ---
let taps = 0;
let coins = 0;
let playerUID = null; // UID користувача з Discord (головний ідентифікатор)
let energy = typeof MAX_ENERGY !== 'undefined' ? MAX_ENERGY : 200;

let nextTapAvailableTime = null;
let ownedCapsules = [];
let cooldownIntervalId = null;
let currentDailyClaimStep = 0;
let activatedReferralsCount = 0;
let currentUserData = {}; // Дані користувача з Firestore

let currentLocale = 'en';

// --- DOM Elements ---
// (Залишаємо ваші оголошення DOM-елементів тут, вони виглядають коректно)
const languageModal = document.getElementById('languageModal');
const appContainer = document.querySelector('.app-container');
const tapCapsuleElement = document.getElementById('tapCapsule');
const energyValueElement = document.getElementById('energyValue');
const maxEnergyDisplayElement = document.getElementById('maxEnergyDisplay');
const coinsDisplay = document.getElementById('coinsDisplay');
const rankDisplay = document.getElementById('rankDisplay');
const cooldownTimerDisplay = document.getElementById('cooldownTimerDisplay');
const messageBox = document.getElementById('messageBox');
const capsuleListDisplay = document.getElementById('capsuleList');
const passiveIncomeDisplay = document.getElementById('passiveIncomeDisplay');
const passiveRateDisplayOnTapScreen = document.getElementById('passive-rate');
const leaderboardDisplay = document.getElementById('leaderboardDisplay');
const capsuleDropModal = document.getElementById('capsuleDropModal');
const droppedCapsuleImage = document.getElementById('droppedCapsuleImage');
const droppedCapsuleInfo = document.getElementById('droppedCapsuleInfo');
const droppedCapsuleQuote = document.getElementById('droppedCapsuleQuote');
const droppedCapsuleBonus = document.getElementById('droppedCapsuleBonus');
const closeDropModalButton = document.getElementById('closeDropModalButton');
const dailyClaimStatus = document.getElementById('dailyClaimStatus');
const claimDailyRewardButton = document.getElementById('claimDailyRewardButton');
const dailyClaimGrid = document.getElementById('dailyClaimGrid');
const playerInviteCodeDisplay = document.getElementById('playerInviteCodeDisplay');
const copyInviteCodeButton = document.getElementById('copyInviteCodeButton');
const enterReferralCodeInput = document.getElementById('enterReferralCodeInput');
const confirmReferralCodeButton = document.getElementById('confirmReferralCodeButton');
const referralStatusMessage = document.getElementById('referralStatusMessage');
const enterReferralCodeSection = document.getElementById('enterReferralCodeSection');
const activatedReferralsCountDisplay = document.getElementById('activatedReferralsCount');


// --- Sound Initialization ---
let tapSound, dropSound, boostSound;
const soundErrorFlags = { tap: false, drop: false, boost: false };

function initializeSounds() {
    // Перевірка, чи soundPaths визначено (з config.js)
    if (typeof soundPaths === 'undefined') {
        console.error("soundPaths is not defined. Make sure config.js is loaded.");
        // Позначити всі звуки як помилкові, щоб уникнути подальших проблем
        soundErrorFlags.tap = true;
        soundErrorFlags.drop = true;
        soundErrorFlags.boost = true;
        showCustomMessage("Sound configuration missing!", 3000);
        return;
    }
    tapSound = initSound(soundPaths.tap, 'tap');
    dropSound = initSound(soundPaths.drop, 'drop');
    boostSound = initSound(soundPaths.boost, 'boost');
}

function initSound(path, soundName) {
    try {
        const audio = new Audio(path);
        audio.onerror = (e) => {
            console.warn(`Error event on audio element for ${soundName} (${path}). Source: ${audio.currentSrc || 'not set'}. Error:`, e);
            if (!soundErrorFlags[soundName]) {
                if (typeof t === 'function') showCustomMessage(t(currentLocale, "message_audio_load_error_template", {soundName: soundName}), 3500);
                soundErrorFlags[soundName] = true;
            }
        };
        return audio;
    } catch (e) {
        console.warn(`Could not create Audio object for ${soundName} (${path}). Sounds will be disabled for it.`, e);
        soundErrorFlags[soundName] = true;
        return { play: () => Promise.reject(new Error('Dummy audio')), pause: () => {}, currentTime: 0 };
    }
}

// --- Firebase Setup ---
function initializeFirebase() {
    if (typeof firebase === 'undefined' || typeof firebaseConfig === 'undefined') {
        console.error("Firebase SDK or firebaseConfig is not defined. Make sure Firebase SDK and config.js are loaded before game.js.");
        showCustomMessage("FATAL ERROR: Firebase components missing.", 10000);
        return false;
    }
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        } else {
            firebase.app();
        }
        auth = firebase.auth(); // Firebase Auth instance
        db = firebase.firestore();
        functions = firebase.functions();
        console.log("Firebase Initialized");
        return true;
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        showCustomMessage(`FATAL ERROR: ${error.message}`, 10000);
        return false;
    }
}

// --- Helper function to handle fetch responses ---
// (Ваша функція handleApiResponse виглядає добре, залишаємо її)
function handleApiResponse(response) {
    if (!response.ok) {
        return response.text().then(text => {
            try {
                const err = JSON.parse(text);
                throw new Error(err.message || `Server error: ${response.status}`);
            } catch (e) {
                throw new Error(`Server returned an invalid response. Status: ${response.status}`);
            }
        });
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        throw new Error("Received an unexpected response format from the server.");
    }
}

// --- Core Game Functions ---
// (Ваші функції playAudio, showCustomMessage, showCapsuleDropModal, getTapReward, showTapFeedback, updateUIDisplay, updateCooldownTimer - виглядають добре, залишаємо їх з невеликими правками для узгодженості)
function playAudio(soundInstance, soundName) {
    if (soundErrorFlags[soundName]) return;
    if (soundInstance && typeof soundInstance.play === 'function') {
        soundInstance.currentTime = 0;
        const playPromise = soundInstance.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (!soundErrorFlags[soundName]) {
                    console.warn(`Error playing ${soundName} sound (path: ${soundPaths[soundName]}):`, error);
                    if (error.name !== 'NotSupportedError' && error.name !== 'AbortError') {
                        if (typeof t === 'function') showCustomMessage(t(currentLocale, "message_audio_play_error_template", {soundName: soundName}), 3000);
                    }
                    soundErrorFlags[soundName] = true;
                }
            });
        }
    } else {
       if (!soundErrorFlags[soundName]) {
            console.warn(`Sound object for "${soundName}" is invalid or missing play method.`);
            soundErrorFlags[soundName] = true;
       }
    }
}

function showCustomMessage(message, duration = 3000) {
    if (messageBox) {
        messageBox.textContent = message; messageBox.classList.add('show');
        setTimeout(() => { messageBox.classList.remove('show'); }, duration);
    }
}

async function showCapsuleDropModal(type) {
    if (!capsuleDropModal) return;
    droppedCapsuleImage.src = capsuleImageURLs[type] || capsuleImageURLs.main;
    droppedCapsuleImage.alt = `${type} Capsule`;
    if (typeof t === 'function') {
        droppedCapsuleInfo.textContent = t(currentLocale, "capsule_drop_title_template", {type: t(currentLocale, `capsule_${type}`).toUpperCase() });
        droppedCapsuleBonus.textContent = t(currentLocale, "capsule_drop_bonus_template_raw", {value: capsuleBonuses[type]});
    }
    droppedCapsuleQuote.textContent = "A mysterious energy emanates from it...";
    capsuleDropModal.classList.add('visible');
}
if(closeDropModalButton) closeDropModalButton.addEventListener('click', () => capsuleDropModal.classList.remove('visible'));
if(capsuleDropModal) capsuleDropModal.addEventListener('click', (event) => { if (event.target === capsuleDropModal) capsuleDropModal.classList.remove('visible'); });


function getTapReward() {
    let tapReward = (typeof BASE_COINS_PER_TAP !== 'undefined' ? BASE_COINS_PER_TAP : 1);
    if (typeof capsuleBonuses === 'undefined') {
        console.warn("capsuleBonuses is not defined. Tap reward might be incorrect.");
        return tapReward;
    }
    ownedCapsules.forEach(capType => {
        tapReward += capsuleBonuses[capType] || 0;
    });
    return tapReward;
}

function showTapFeedback() {
    const currentTapReward = getTapReward();
    const feedbackEl = document.createElement('span');
    feedbackEl.className = 'tap-feedback';
    feedbackEl.textContent = `+${currentTapReward}`;
    if (tapCapsuleElement) tapCapsuleElement.appendChild(feedbackEl);
    setTimeout(() => {
        feedbackEl.remove();
    }, 780);
}

function updateUIDisplay() {
    if(energyValueElement) energyValueElement.textContent = energy;
    if(maxEnergyDisplayElement) maxEnergyDisplayElement.textContent = (typeof MAX_ENERGY !== 'undefined' ? MAX_ENERGY : 200);
    if(coinsDisplay) coinsDisplay.textContent = coins.toLocaleString();
    updateRankDisplay();

    const capsuleImgElement = tapCapsuleElement ? tapCapsuleElement.querySelector('.tap-capsule-img') : null;
    if (capsuleImgElement) {
        if (energy <= 0 && nextTapAvailableTime && Date.now() < nextTapAvailableTime) {
            capsuleImgElement.style.filter = 'grayscale(100%) brightness(0.5)';
            if (capsuleImgElement.style.animationName !== 'none') capsuleImgElement.style.animation = 'none';
        } else {
            capsuleImgElement.style.filter = '';
            if (capsuleImgElement.style.animationName === 'none') capsuleImgElement.style.animation = 'glowPulsePunk 2.5s infinite ease-in-out';
        }
    }
}

function updateCooldownTimer() {
    if (!cooldownTimerDisplay) return;
    if (!nextTapAvailableTime || Date.now() >= nextTapAvailableTime) {
        cooldownTimerDisplay.textContent = '';
        if (cooldownIntervalId) clearInterval(cooldownIntervalId); cooldownIntervalId = null;
        if (energy === 0 && taps >= (typeof MAX_TAPS_BEFORE_COOLDOWN !== 'undefined' ? MAX_TAPS_BEFORE_COOLDOWN : 200)) {
            energy = (typeof MAX_ENERGY !== 'undefined' ? MAX_ENERGY : 200);
            taps = 0;
            nextTapAvailableTime = null;
            if (typeof t === 'function') showCustomMessage(t(currentLocale, "message_energy_recharged"));
        }
        updateUIDisplay(); return;
    }
    const remainingMs = nextTapAvailableTime - Date.now();
    const h = Math.floor(remainingMs / 3600000);
    const m = Math.floor((remainingMs % 3600000) / 60000);
    const s = Math.floor((remainingMs % 60000) / 1000);
    if (typeof t === 'function') cooldownTimerDisplay.textContent = `${t(currentLocale, "cooldown_timer_prefix")}: ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function handleTapInteraction() {
    // Перевіряємо, чи playerUID встановлено (тобто користувач залогінений через Discord)
    if (!playerUID) {
        if (typeof t === 'function') showCustomMessage(t(currentLocale, 'message_user_not_authenticated_tap'), 3000); // Потрібно додати цей ключ в локалізацію
        // Можна також показати модальне вікно з пропозицією залогінитися або перенаправити на /auth/discord
        // window.location.href = "/auth/discord"; // Як варіант
        return;
    }

    if (energy <= 0) {
        if (typeof t === 'function') showCustomMessage(t(currentLocale, "message_energy_depleted_recharging"), 3000);
        return;
    }

    // Змінено URL на відносний, щоб використовувати той самий хост, що й фронтенд
    fetch("/tap", { // Якщо ваш API на тому ж сервері, що й фронтенд
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Передаємо playerUID, отриманий від /auth/user
        body: JSON.stringify({ userId: playerUID })
    })
    .then(handleApiResponse)
    .then(data => {
        console.log("✅ TAP success:", data);

        energy--;
        taps++;

        const currentTapReward = getTapReward();
        coins += currentTapReward;

        showTapFeedback();
        playAudio(tapSound, 'tap');
        if (navigator.vibrate) try { navigator.vibrate(30); } catch(e) { console.warn("Vibration error", e); }

        const capsuleImg = tapCapsuleElement.querySelector('.tap-capsule-img');
        if (capsuleImg) {
            capsuleImg.style.transform = 'scale(0.96) rotate(1deg)';
            setTimeout(() => { capsuleImg.style.transform = null; }, 80);
        }

        if (taps >= (typeof MAX_TAPS_BEFORE_COOLDOWN !== 'undefined' ? MAX_TAPS_BEFORE_COOLDOWN : 200)) {
            energy = 0;
            // Перевірка, чи capsuleDropChances визначено
            if (typeof capsuleDropChances === 'undefined') {
                console.error("capsuleDropChances is not defined. Cannot determine capsule drop.");
                return;
            }
            const roll = Math.random() * 100;
            let droppedType = 'silver'; // Default
            if (roll < capsuleDropChances.discord) droppedType = 'discord';
            else if (roll < capsuleDropChances.discord + capsuleDropChances.diamond) droppedType = 'diamond';
            else if (roll < capsuleDropChances.discord + capsuleDropChances.diamond + capsuleDropChances.gold) droppedType = 'gold';

            const newOwnedCapsules = [...ownedCapsules, droppedType];
            updateUserCapsulesAndHourlyRate(newOwnedCapsules);

            playAudio(dropSound, 'drop');
            if (navigator.vibrate) try { navigator.vibrate([100, 30, 100]); } catch(e) { console.warn("Vibration error", e); }
            showCapsuleDropModal(droppedType);

            const cooldownMs = (typeof COOLDOWN_DURATION_MS !== 'undefined' ? COOLDOWN_DURATION_MS : (3 * 60 * 60 * 1000));
            nextTapAvailableTime = Date.now() + cooldownMs;
            if (typeof t === 'function') showCustomMessage(t(currentLocale, "message_tap_limit_cooldown_template", {hours: cooldownMs / 3600000}));
            if (cooldownIntervalId) clearInterval(cooldownIntervalId);
            cooldownIntervalId = setInterval(updateCooldownTimer, 1000);
            updateCooldownTimer();
            checkReferralActivation();
        }
        updateUIDisplay();
    })
    .catch(err => {
        console.error("❌ TAP error:", err);
        showCustomMessage(`Tap Error: ${err.message}`, 4000);
    });

    updateUIDisplay(); // Можливо, варто викликати тільки після успішного запиту
}
if (tapCapsuleElement) tapCapsuleElement.addEventListener('click', handleTapInteraction);


// (Інші ваші функції, такі як updateUserCapsulesAndHourlyRate, calculatePassiveIncome, updateInventoryDisplay, applyPassiveIncome, generatePlayerUID, initializeReferralSystem, обробники кнопок рефералів, щоденних нагород, навігації, updateRankDisplay, updateLeaderboard, renderLeaderboard, scheduleLeaderboardReset - залишаємо, але вони мають використовувати playerUID, отриманий від /auth/user, і currentUserData, завантажені з Firestore через setupUserDocument(playerUID))

// ПРИКЛАД: Модифікований updateUserCapsulesAndHourlyRate
async function updateUserCapsulesAndHourlyRate(newCapsulesArray) {
    if (!playerUID || !db) { // Перевіряємо і db
        console.warn("Cannot update capsules: playerUID or DB not set.");
        return;
    }
    let newHourlyRate = (typeof BASE_COINS_PER_TAP !== 'undefined' ? BASE_COINS_PER_TAP : 1);
    if (typeof capsuleBonuses === 'undefined') {
         console.warn("capsuleBonuses not defined, hourly rate may be incorrect.");
    } else {
        newCapsulesArray.forEach(capType => {
            newHourlyRate += capsuleBonuses[capType] || 0;
        });
    }

    try {
        await db.collection('users').doc(playerUID).update({
            ownedCapsules: newCapsulesArray,
            'taps.hourlyRate': newHourlyRate
        });
        console.log("User capsules and hourlyRate updated in Firestore.");
    } catch (error) {
        console.error("Error updating user capsules/hourlyRate in Firestore:", error);
    }
}
// Те саме для applyPassiveIncome, handleClaimDailyReward, confirmReferralCodeButton listener

// --- Setup user data listener (ключова функція для завантаження даних) ---
function setupUserDocument(currentPayerUID) { // Приймає UID від Discord
    if (!db) {
        console.error("Firestore (db) is not initialized. Cannot setup user document.");
        return;
    }
    if (!currentPayerUID) {
        console.error("playerUID is not set. Cannot setup user document.");
        return;
    }

    const userRef = db.collection('users').doc(currentPayerUID);
    userRef.onSnapshot(doc => {
        const isInitialLoad = !currentUserData.hasOwnProperty('balance');

        if (doc.exists) {
            console.log("Received user data from Firestore for UID:", currentPayerUID, doc.data());
            currentUserData = doc.data();
            // Оновлюємо глобальні змінні стану гри з Firestore
            coins = currentUserData.balance || 0;
            ownedCapsules = currentUserData.ownedCapsules || [];
            // taps = currentUserData.taps?.count || 0; // Кількість тапів краще обробляти локально або через backend
            // currentDailyClaimStep та інші дані, що залежать від Firestore
        } else {
            console.log("No user document for UID:", currentPayerUID, "Creating one...");
            const myReferralCode = localStorage.getItem("phonetap_referralCode") || generatePlayerUID_local(); // Використовуємо локальну генерацію, якщо це для Firestore
            currentUserData = { // Встановлюємо початкові дані для currentUserData
                username: `AGENT-${currentPayerUID.substring(0, 4)}`,
                balance: 0,
                ownedCapsules: [],
                claim: { streak: 0, lastClaim: null },
                referrals: { code: myReferralCode, invitedBy: null, activatedCount: 0 },
                taps: { count: 0, hourlyRate: (typeof BASE_COINS_PER_TAP !== 'undefined' ? BASE_COINS_PER_TAP : 1), lastTap: null }
            };
            coins = 0; // Оновлюємо глобальні змінні
            ownedCapsules = [];

            userRef.set(currentUserData)
                   .catch(error => console.error("Error creating user document:", error));
        }

        // Ініціалізуємо ігрову логіку ТІЛЬКИ ПІСЛЯ отримання/створення даних
        if (isInitialLoad) {
            initializeGameLogic();
        } else { // Якщо не перший раз, просто оновлюємо UI, так як initializeGameLogic вже була викликана
            updateUIDisplay();
            updateInventoryDisplay();
            checkDailyClaimAvailability();
            // тощо, якщо потрібно оновити інші частини UI
        }


    }, error => {
        console.error("Error with Firestore snapshot for UID:", currentPayerUID, error);
        // Можливо, тут варто показати повідомлення користувачу
        // і спробувати анонімний вхід, якщо основний потік не спрацював.
        // Але це ускладнить логіку, якщо основна автентифікація через Discord.
    });
}

// Локальна генерація UID для реферального коду, якщо playerUID ще не отримано
function generatePlayerUID_local() {
    let uid = localStorage.getItem("phonetap_referralCode");
    if (!uid) { uid = Math.random().toString(36).substring(2, 9).toUpperCase(); localStorage.setItem("phonetap_referralCode", uid); }
    return uid;
}


// --- Ініціалізація гри ---
function initializeGameLogic() {
    console.log("🚀 Initializing game logic for user:", playerUID);
    if (!playerUID) {
        console.warn("initializeGameLogic called without playerUID. User might not be authenticated.");
        // Тут можна або нічого не робити, або показати повідомлення про необхідність входу
        if (typeof t === 'function') showCustomMessage(t(currentLocale, 'message_login_for_full_features'), 3000); // Додати ключ
        return;
    }

    // Ці функції тепер будуть використовувати currentUserData, заповнене з Firestore
    initializeReferralSystem();
    updateLeaderboard();
    scheduleLeaderboardReset(); // Якщо вона потрібна

    // Логіка перезарядки на основі даних з Firestore
    if (currentUserData.taps?.lastTap) {
        const serverLastTapTime = currentUserData.taps.lastTap.seconds ? currentUserData.taps.lastTap.toDate().getTime() : currentUserData.taps.lastTap;
        const cooldownMs = (typeof COOLDOWN_DURATION_MS !== 'undefined' ? COOLDOWN_DURATION_MS : (3 * 60 * 60 * 1000));
        if (Date.now() < serverLastTapTime + cooldownMs) {
            nextTapAvailableTime = serverLastTapTime + cooldownMs;
            energy = 0;
            taps = (typeof MAX_TAPS_BEFORE_COOLDOWN !== 'undefined' ? MAX_TAPS_BEFORE_COOLDOWN : 200);
            if (!cooldownIntervalId) cooldownIntervalId = setInterval(updateCooldownTimer, 1000);
            updateCooldownTimer(); // Оновити таймер одразу
        }
    }

    // Оновлення UI після завантаження всіх даних
    updateUIDisplay();
    updateInventoryDisplay();
    checkDailyClaimAvailability(); // Ця функція також має використовувати currentUserData

    // Якщо вкладка запрошень активна
    if (document.querySelector('.nav-button.active[data-tab="inviteTab"]')) {
       if(playerInviteCodeDisplay && currentUserData.referrals) playerInviteCodeDisplay.value = currentUserData.referrals?.code || playerUID;
       const manuallyReferredBy = currentUserData.referrals?.invitedBy;
       if (manuallyReferredBy) {
            if(enterReferralCodeSection) enterReferralCodeSection.classList.add('hidden');
            if(referralStatusMessage && typeof t === 'function') referralStatusMessage.textContent = t(currentLocale, "referral_status_success_template", {value: manuallyReferredBy});
       }
       if(activatedReferralsCountDisplay && currentUserData.referrals) activatedReferralsCountDisplay.textContent = currentUserData.referrals.activatedCount || 0;
    }
    if (typeof translatePage === 'function') translatePage(); // Переклад сторінки
}

// --- Старт додатку ---
function startApp() {
    initializeSounds(); // Ініціалізуємо звуки
    // Ініціалізуємо Firebase. Це асинхронно встановить `auth` та `db`.
    if (!initializeFirebase()) {
        // Якщо Firebase не ініціалізовано, гра не може працювати належним чином
        return;
    }

    // Перевіряємо, чи користувач вже залогінений через наш Discord OAuth бекенд
    fetch("/auth/user")
      .then(handleApiResponse) // Використовуємо ваш обробник
      .then(user => { // `user` тут - це об'єкт користувача з вашого Discord бекенду
        console.log("✅ Logged in via /auth/user:", user.username, "(ID:", user.id + ")");
        playerUID = user.id; // Встановлюємо глобальний playerUID

        // Тепер, коли ми маємо playerUID від Discord, налаштовуємо документ Firestore для цього UID
        setupUserDocument(playerUID);
        // initializeGameLogic() тепер буде викликана всередині setupUserDocument після завантаження даних
      })
      .catch(err => {
        console.warn("❌ User not authenticated via /auth/user:", err.message);
        // Користувач не залогінений через Discord
        // Тут можна або нічого не робити (гравець не зможе грати),
        // або показати кнопку "Login with Discord",
        // або спробувати Firebase Anonymous signIn для якогось обмеженого функціоналу
        // (але це ускладнить логіку, якщо основна гра вимагає Discord UID).
        // Наразі, просто покажемо повідомлення.
        if (typeof t === 'function') showCustomMessage(t(currentLocale, 'message_please_login_discord'), 5000); // Додати ключ локалізації
        // Можна сховати ігровий контейнер і показати кнопку логіну
        if(appContainer) appContainer.style.display = 'none'; // Наприклад
        // document.getElementById('loginButton').style.display = 'block'; // Якщо у вас є кнопка логіну
      });

    // Обробники для статичних частин UI
    if (tapCapsuleElement && tapCapsuleElement.querySelector('.tap-capsule-img')) {
        tapCapsuleElement.querySelector('.tap-capsule-img').addEventListener('contextmenu', e => e.preventDefault());
    }
    if (typeof translatePage === 'function') translatePage(); // Початковий переклад статичних елементів
}


// --- Ініціалізація після завантаження DOM та вибору мови ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof setLanguage !== 'function' || typeof translatePage !== 'function' || typeof t !== 'function') {
        console.error("Localization functions are not defined. Make sure localization.js and config.js are loaded correctly before game.js.");
        if (languageModal) languageModal.innerHTML = "<h2>CRITICAL ERROR: Localization missing.</h2>";
        return;
    }

    // Обробник вибору мови - один раз
    document.querySelectorAll('.language-button').forEach(button => {
        button.addEventListener('click', () => {
            const selectedLang = button.getAttribute('data-lang');
            if (languageModal) languageModal.style.display = 'none';
            if (appContainer) appContainer.style.display = 'flex'; // Показуємо контейнер гри

            setLanguage(selectedLang); // Встановлюємо мову
            startApp(); // Запускаємо основну логіку додатку ПІСЛЯ вибору мови
        });
    });

    // Перевірка, чи мова вже збережена, щоб пропустити модальне вікно
    const savedLocale = localStorage.getItem('phonetap_locale');
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'ru')) {
        if (languageModal) languageModal.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
        setLanguage(savedLocale);
        startApp(); // Запускаємо додаток, якщо мова вже вибрана
    } else {
        // Мова не вибрана, показуємо модальне вікно
        if (languageModal) languageModal.style.display = 'flex'; // Переконайтеся, що модальне вікно видиме
        if (appContainer) appContainer.style.display = 'none'; // Ховаємо контейнер гри
        if (typeof translatePage === 'function') translatePage(); // Можна перекласти саме модальне вікно
    }
});

// Переконайтеся, що всі функції, на які посилаються DOM-елементи (наприклад, handleClaimDailyReward, handleTapInteraction), визначені вище.
// Я залишив ваші визначення функцій, які виглядають логічно, вище цього блоку.
// Потрібно буде ретельно протестувати всю логіку після цих змін.
