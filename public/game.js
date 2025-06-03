if (window !== window.parent) {
  document.body.classList.add("discord-mode");
}

// --- Firebase Instances (to be initialized) ---
let db;
let auth; // Firebase auth instance
// let functions; // firebase.functions() не використовується, можна прибрати, якщо не плануєте клієнтські виклики функцій

// --- Game State Variables ---
let taps = 0;
let coins = 0;
let playerUID = null; // UID користувача з Discord (головний ідентифікатор)
let energy = typeof MAX_ENERGY !== 'undefined' ? MAX_ENERGY : 200;

let nextTapAvailableTime = null;
let ownedCapsules = [];
let cooldownIntervalId = null;
let currentDailyClaimStep = 0;
// let activatedReferralsCount = 0; // Це значення краще брати з currentUserData
let currentUserData = {}; // Дані користувача з Firestore

// currentLocale буде визначено та експортовано з localization.js
// let currentLocale = 'en'; // ВИДАЛІТЬ ЦЕЙ РЯДОК, якщо currentLocale визначається в localization.js

// --- DOM Elements ---
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
    if (typeof soundPaths === 'undefined') {
        console.error("soundPaths is not defined. Make sure config.js is loaded and defines it.");
        soundErrorFlags.tap = true; soundErrorFlags.drop = true; soundErrorFlags.boost = true;
        if (typeof showCustomMessage === "function") showCustomMessage("Sound configuration missing!", 3000);
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
                if (typeof t === 'function' && typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, "message_audio_load_error_template", {soundName: soundName}), 3500);
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
        console.error("Firebase SDK or firebaseConfig is not defined. Make sure Firebase SDK (v8) and config.js are loaded before game.js.");
        if (typeof showCustomMessage === "function") showCustomMessage("FATAL ERROR: Firebase components missing.", 10000);
        return false;
    }
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        } else {
            firebase.app();
        }
        auth = firebase.auth(); // Firebase Auth instance (може бути потрібен для правил безпеки Firestore або анонімного режиму)
        db = firebase.firestore();
        // functions = firebase.functions(); // Розкоментуйте, якщо будете використовувати клієнтські виклики Firebase Functions
        console.log("Firebase Initialized");
        return true;
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        if (typeof showCustomMessage === "function") showCustomMessage(`FATAL ERROR: ${error.message}`, 10000);
        return false;
    }
}

// --- Helper function to handle fetch responses ---
function handleApiResponse(response) {
    if (!response.ok) {
        return response.text().then(text => {
            try {
                const err = JSON.parse(text);
                throw new Error(err.message || `Server error: ${response.status}`);
            } catch (e) {
                throw new Error(`Server returned an invalid response. Status: ${response.status}. Body: ${text}`);
            }
        });
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        // Якщо відповідь успішна, але не JSON, можливо, це перенаправлення або інший тип відповіді.
        // Для /auth/user ми очікуємо JSON. Для інших – можливо, ні.
        // Якщо очікується JSON, то це помилка.
        console.warn("Received an unexpected (non-JSON) response format from the server for a successful request.");
        return response.text().then(text => { // Повернемо текст, щоб можна було його проаналізувати
            if (text) throw new Error("Received an unexpected response format from the server (expected JSON).");
            return {}; // Або повернути порожній об'єкт, якщо відповідь порожня
        });
    }
}

// --- Core Game Functions ---
// (Ваші функції playAudio, showCustomMessage, showCapsuleDropModal, getTapReward, showTapFeedback, updateUIDisplay, updateCooldownTimer)
// ... (вони потребують доступу до currentLocale, t, конфігураційних змінних, DOM елементів)
// Переконайтеся, що всі ці залежності доступні та ініціалізовані перед викликом цих функцій.

function playAudio(soundInstance, soundName) {
    if (!soundInstance || typeof soundInstance.play !== 'function' || soundErrorFlags[soundName]) return;
    soundInstance.currentTime = 0;
    const playPromise = soundInstance.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            if (!soundErrorFlags[soundName]) {
                console.warn(`Error playing ${soundName} sound (path: ${soundPaths?.[soundName]}):`, error);
                if (error.name !== 'NotSupportedError' && error.name !== 'AbortError') {
                    if (typeof t === 'function' && typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, "message_audio_play_error_template", {soundName: soundName}), 3000);
                }
                soundErrorFlags[soundName] = true;
            }
        });
    }
}

function showCustomMessage(message, duration = 3000) {
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.classList.add('show');
        setTimeout(() => { messageBox.classList.remove('show'); }, duration);
    } else {
        console.warn("messageBox element not found, cannot show message:", message);
    }
}

async function showCapsuleDropModal(type) {
    if (!capsuleDropModal || typeof t !== 'function' || typeof capsuleImageURLs === 'undefined' || typeof capsuleBonuses === 'undefined') {
        console.warn("Cannot show capsule drop modal, required elements or configs missing.");
        return;
    }
    if(droppedCapsuleImage) {
        droppedCapsuleImage.src = capsuleImageURLs[type] || capsuleImageURLs.main;
        droppedCapsuleImage.alt = `${type} Capsule`;
    }
    if(droppedCapsuleInfo) droppedCapsuleInfo.textContent = t(currentLocale, "capsule_drop_title_template", {type: t(currentLocale, `capsule_${type}`).toUpperCase() });
    if(droppedCapsuleBonus) droppedCapsuleBonus.textContent = t(currentLocale, "capsule_drop_bonus_template_raw", {value: capsuleBonuses[type]});
    if(droppedCapsuleQuote) droppedCapsuleQuote.textContent = "A mysterious energy emanates from it..."; // Можна теж локалізувати
    capsuleDropModal.classList.add('visible');
}
// Обробники для модального вікна капсули (краще додати після DOMContentLoaded)

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
    if (tapCapsuleElement) {
        tapCapsuleElement.appendChild(feedbackEl);
        setTimeout(() => { feedbackEl.remove();}, 780);
    }
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
            if (capsuleImgElement.style.animationName === 'none' || !capsuleImgElement.style.animationName) { // Перевірка, чи анімація не встановлена
                capsuleImgElement.style.animation = 'glowPulsePunk 2.5s infinite ease-in-out';
            }
        }
    }
}


function updateCooldownTimer() {
    if (!cooldownTimerDisplay) return;
    if (!nextTapAvailableTime || Date.now() >= nextTapAvailableTime) {
        cooldownTimerDisplay.textContent = '';
        if (cooldownIntervalId) { clearInterval(cooldownIntervalId); cooldownIntervalId = null; }
        if (energy === 0 && taps >= (typeof MAX_TAPS_BEFORE_COOLDOWN !== 'undefined' ? MAX_TAPS_BEFORE_COOLDOWN : 200)) {
            energy = (typeof MAX_ENERGY !== 'undefined' ? MAX_ENERGY : 200);
            taps = 0;
            nextTapAvailableTime = null;
            if (typeof t === 'function' && typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, "message_energy_recharged"));
        }
        updateUIDisplay();
        return;
    }
    const remainingMs = nextTapAvailableTime - Date.now();
    const h = Math.floor(remainingMs / 3600000);
    const m = Math.floor((remainingMs % 3600000) / 60000);
    const s = Math.floor((remainingMs % 60000) / 1000);
    if (typeof t === 'function') cooldownTimerDisplay.textContent = `${t(currentLocale, "cooldown_timer_prefix")}: ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}


function handleTapInteraction() {
    if (!playerUID) { // Основна перевірка - чи є Discord UID
        if (typeof t === 'function' && typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, 'message_user_not_authenticated_tap'), 3000);
        console.warn("Tap attempt without playerUID (Discord auth).");
        // Можна запропонувати перейти на /auth/discord
        // Наприклад, додати кнопку "Login with Discord", яка робить window.location.href = '/auth/discord';
        return;
    }

    if (energy <= 0) {
        if (typeof t === 'function' && typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, "message_energy_depleted_recharging"), 3000);
        return;
    }

    // URL до вашого бекенду на Render
    const tapApiUrl = "/tap"; // Якщо фронтенд та бекенд на одному домені, можна використовувати відносний шлях

    fetch(tapApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: playerUID }) // Надсилаємо Discord UID
    })
    .then(handleApiResponse)
    .then(data => {
        if (data && data.success) {
            console.log("✅ TAP success:", data);
            energy--;
            taps++; // Локальний лічильник тапів для перезарядки

            const currentTapReward = getTapReward();
            coins = data.coins; // Отримуємо актуальний баланс з сервера

            showTapFeedback();
            playAudio(tapSound, 'tap');
            if (navigator.vibrate) try { navigator.vibrate(30); } catch(e) { console.warn("Vibration error", e); }

            const capsuleImg = tapCapsuleElement ? tapCapsuleElement.querySelector('.tap-capsule-img') : null;
            if (capsuleImg) {
                capsuleImg.style.transform = 'scale(0.96) rotate(1deg)';
                setTimeout(() => { capsuleImg.style.transform = ''; }, 80);
            }

            const maxTaps = (typeof MAX_TAPS_BEFORE_COOLDOWN !== 'undefined' ? MAX_TAPS_BEFORE_COOLDOWN : 200);
            if (taps >= maxTaps) {
                energy = 0;
                if (typeof capsuleDropChances === 'undefined' || typeof capsuleBonuses === 'undefined' || typeof capsuleImageURLs === 'undefined') {
                    console.error("Capsule configuration (chances, bonuses, or URLs) is missing.");
                    // Не скидаємо taps і не починаємо кулдаун, якщо конфігурація неповна
                } else {
                    const roll = Math.random() * 100;
                    let droppedType = 'silver';
                    if (roll < capsuleDropChances.discord) droppedType = 'discord';
                    else if (roll < capsuleDropChances.discord + capsuleDropChances.diamond) droppedType = 'diamond';
                    else if (roll < capsuleDropChances.discord + capsuleDropChances.diamond + capsuleDropChances.gold) droppedType = 'gold';

                    // Оновлюємо капсули локально ТА відправляємо на сервер (або сервер сам це робить)
                    // Наразі ваш бекенд не обробляє додавання капсул при /tap
                    const newOwnedCapsules = [...ownedCapsules, droppedType];
                    updateUserCapsulesAndHourlyRate(newOwnedCapsules); // Оновлює Firestore

                    playAudio(dropSound, 'drop');
                    if (navigator.vibrate) try { navigator.vibrate([100, 30, 100]); } catch(e) { console.warn("Vibration error", e); }
                    showCapsuleDropModal(droppedType);

                    const cooldownMs = (typeof COOLDOWN_DURATION_MS !== 'undefined' ? COOLDOWN_DURATION_MS : (3 * 60 * 60 * 1000));
                    nextTapAvailableTime = Date.now() + cooldownMs;
                    if (typeof t === 'function' && typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, "message_tap_limit_cooldown_template", {hours: cooldownMs / 3600000}));
                    if (cooldownIntervalId) clearInterval(cooldownIntervalId);
                    cooldownIntervalId = setInterval(updateCooldownTimer, 1000);
                    updateCooldownTimer(); // Оновити таймер одразу
                    checkReferralActivation(); // Якщо ця логіка потрібна тут
                }
            }
            updateUIDisplay();
        } else {
            // Обробка, якщо data.success не true (навіть якщо запит був ok)
            console.error("❌ TAP logical error on server:", data?.message || "Unknown server error");
            if (typeof showCustomMessage === "function") showCustomMessage(data?.message || "Tap processing error.", 4000);
        }
    })
    .catch(err => {
        console.error("❌ TAP fetch error:", err);
        if (typeof showCustomMessage === "function") showCustomMessage(`Tap Error: ${err.message}`, 4000);
        // Тут можна додати логіку для відновлення стану, якщо тап не вдався
    });
    // updateUIDisplay(); // Краще викликати після успішного оновлення даних
}


async function updateUserCapsulesAndHourlyRate(newCapsulesArray) {
    if (!playerUID || !db) {
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
            'taps.hourlyRate': newHourlyRate // Переконайтеся, що структура в Firestore це підтримує
        });
        console.log("User capsules and hourlyRate updated in Firestore.");
        // Оновлюємо локальні дані після успішного запису в БД
        ownedCapsules = newCapsulesArray;
        updateInventoryDisplay(); // Оновити відображення інвентарю
    } catch (error) {
        console.error("Error updating user capsules/hourlyRate in Firestore:", error);
    }
}

function calculatePassiveIncome() {
    let totalPassive = 0;
    if (typeof capsuleBonuses === 'undefined') return 0;
    ownedCapsules.forEach(capsuleType => totalPassive += capsuleBonuses[capsuleType] || 0);
    return totalPassive;
}

function updateInventoryDisplay() {
    if (!capsuleListDisplay || !passiveIncomeDisplay || !passiveRateDisplayOnTapScreen || typeof t !== 'function') return;
    capsuleListDisplay.innerHTML = '';
    const counts = ownedCapsules.reduce((acc, cap) => { acc[cap] = (acc[cap] || 0) + 1; return acc; }, {});
    const totalPassive = calculatePassiveIncome();
    if (Object.keys(counts).length === 0) {
        capsuleListDisplay.innerHTML = `<p class="text-gray-400 font-mono">${t(currentLocale, "no_capsules_message")}</p>`;
    } else {
        for (const [type, count] of Object.entries(counts)) {
            const li = document.createElement('div'); li.className = 'inventory-item';
            if (typeof capsuleImageURLs !== 'undefined' && typeof capsuleBonuses !== 'undefined') {
                 li.innerHTML = `<img src="${capsuleImageURLs[type]}" alt="${type} capsule" onerror="this.onerror=null; this.src='https://placehold.co/40x40/0A0A1A/FF00FF?text=ERR&font=Share+Tech+Mono'; this.alt='Error loading ${type} image';"><span class="flex-grow font-mono">${t(currentLocale, `capsule_${type}`).toUpperCase()} CAPSULE x ${count}</span><span class="text-sm font-mono" style="color: var(--acid-green);">+${(capsuleBonuses[type] || 0) * count} C/HR</span>`;
            } else {
                li.textContent = `${type.toUpperCase()} x ${count}`; // Fallback
            }
            capsuleListDisplay.appendChild(li);
        }
    }
    passiveIncomeDisplay.textContent = totalPassive.toLocaleString();
    passiveRateDisplayOnTapScreen.innerHTML = t(currentLocale, "passive_income_rate_display_template", {value: totalPassive.toLocaleString()});
}


async function applyPassiveIncome() {
    if (!playerUID || !db) return;
    const hourlyBonus = calculatePassiveIncome();
    if (hourlyBonus > 0) {
        try {
            await db.collection('users').doc(playerUID).update({
                balance: firebase.firestore.FieldValue.increment(hourlyBonus)
            });
            // Не оновлюємо `coins` напряму, бо `onSnapshot` має це зробити
            if (typeof t === 'function' && typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, "message_passive_income_received_template", {value: hourlyBonus.toLocaleString()}), 4000);
        } catch (error) {
            console.error("Error applying passive income:", error);
        }
    }
}
// setInterval(applyPassiveIncome, 3600000); // Запускати після ініціалізації гри

function generatePlayerUID_local() { // Перейменовано, щоб уникнути плутанини
    let uid = localStorage.getItem("phonetap_referralCode");
    if (!uid) { uid = Math.random().toString(36).substring(2, 9).toUpperCase(); localStorage.setItem("phonetap_referralCode", uid); }
    return uid;
}

// Ця функція має бути викликана ПІСЛЯ того, як currentUserData завантажено
function initializeReferralSystem() {
    if (!playerUID || typeof t !== 'function' || typeof currentUserData.referrals === 'undefined') {
        console.warn("Cannot initialize referral system: playerUID, localization, or currentUserData.referrals missing.");
        return;
    }

    const myReferralCode = currentUserData.referrals.code || playerUID; // Використовуємо код з Firestore або UID
    if(playerInviteCodeDisplay) playerInviteCodeDisplay.value = myReferralCode;

    // Обробка бонусу за перехід по URL - ТІЛЬКИ якщо користувач ще не був запрошений
    const urlParams = new URLSearchParams(window.location.search);
    const refIdFromURL = urlParams.get('ref');
    if (refIdFromURL && refIdFromURL !== myReferralCode && !currentUserData.referrals.invitedBy && !localStorage.getItem(`refUrlBonusClaimed_${playerUID}`)) {
       if (db) {
            db.collection('users').doc(playerUID).update({
                balance: firebase.firestore.FieldValue.increment(typeof REFERRAL_URL_JOIN_BONUS !== 'undefined' ? REFERRAL_URL_JOIN_BONUS : 0),
                'referrals.invitedBy': refIdFromURL // Записуємо, хто запросив
            })
            .then(() => {
                if (typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, "message_referral_bonus_url_template", {value: refIdFromURL}), 4000);
                localStorage.setItem(`refUrlBonusClaimed_${playerUID}`, "true");
                // Після оновлення Firestore, onSnapshot має оновити currentUserData і UI
            })
            .catch(e => console.error("Error giving URL referral bonus:", e));
       }
    }

    // Відображення статусу реферала
    const manuallyReferredBy = currentUserData.referrals.invitedBy;
    if (manuallyReferredBy) {
        if(enterReferralCodeSection) enterReferralCodeSection.classList.add('hidden');
        if(referralStatusMessage) referralStatusMessage.textContent = t(currentLocale, "referral_status_success_template", {value: manuallyReferredBy});
    } else {
        if(enterReferralCodeSection) enterReferralCodeSection.classList.remove('hidden');
        if(referralStatusMessage) referralStatusMessage.textContent = '';
    }

    const currentActivatedReferrals = currentUserData.referrals.activatedCount || 0;
    if(activatedReferralsCountDisplay) activatedReferralsCountDisplay.textContent = currentActivatedReferrals;
}

// --- Обробники подій для кнопок (краще додати після DOMContentLoaded) ---

function checkReferralActivation() {
    if (!playerUID || typeof currentUserData.referrals === 'undefined' || typeof t !== 'function') return;

    const actualReferrer = currentUserData.referrals.invitedBy;
    const tapsCount = currentUserData.taps?.count || 0; // Беремо з Firestore або локально, якщо синхронізовано
    const maxTaps = (typeof MAX_TAPS_BEFORE_COOLDOWN !== 'undefined' ? MAX_TAPS_BEFORE_COOLDOWN : 200);

    if (actualReferrer && tapsCount >= maxTaps && !localStorage.getItem(`referralMilestoneNotifiedFor_${actualReferrer}_by_${playerUID}`)) {
        localStorage.setItem(`referralMilestoneNotifiedFor_${actualReferrer}_by_${playerUID}`, 'true');
        if (typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, "message_referral_milestone_referrer_template", {value: actualReferrer}), 4000);
        console.log(`REFERRAL SYSTEM: Referee (UID: ${playerUID}) reached ${maxTaps} taps. Referrer ${actualReferrer} should get +${typeof REFERRAL_MILESTONE_BONUS_REFERRER !== 'undefined' ? REFERRAL_MILESTONE_BONUS_REFERRER : 0} coins. (Backend needed for actual reward).`);
        // Тут потрібен виклик на бекенд, щоб нарахувати бонус рефереру
    }
}


function renderDailyRewardsGrid() {
    if (!dailyClaimGrid || typeof currentUserData.claim === 'undefined' || typeof t !== 'function' || typeof dailyRewardsConfig === 'undefined') return;
    dailyClaimGrid.innerHTML = '';
    const lastClaimDate = currentUserData.claim.lastClaim ? (currentUserData.claim.lastClaim.seconds ? new Date(currentUserData.claim.lastClaim.toDate()).toISOString().split('T')[0] : currentUserData.claim.lastClaim.toString()) : null;
    const todayDateString = new Date().toISOString().split('T')[0];
    let currentCompletedStep = currentUserData.claim.streak || 0;

    let actualNextClaimableDayVisual = currentCompletedStep + 1;
    if (currentCompletedStep === 7 && lastClaimDate !== todayDateString) { // Якщо 7 днів пройдено і сьогодні ще не клеймили
        actualNextClaimableDayVisual = 1; // Починаємо новий цикл з 1-го дня
    } else if (actualNextClaimableDayVisual > 7) {
         actualNextClaimableDayVisual = 1;
    }


    dailyRewardsConfig.forEach(reward => {
        const itemEl = document.createElement('div'); itemEl.className = 'daily-reward-item';
        let rewardTextKey = reward.type === 'coins' ? "daily_reward_text_coins_template" : "daily_reward_text_capsule_template";
        let rewardValue = reward.type === 'coins' ? reward.coins : t(currentLocale, `capsule_${reward.capsule}`).toUpperCase();
        itemEl.innerHTML = `<div class="day">${t(currentLocale,'daily_claim')} ${reward.day}</div><div class="reward">${t(currentLocale, rewardTextKey, {value: rewardValue})}</div>`;

        if (reward.day <= currentCompletedStep && !(currentCompletedStep === 7 && reward.day === actualNextClaimableDayVisual)) { // Якщо 7 днів пройдено, то попередні дні не мають бути "claimed" для нового циклу
             itemEl.classList.add('claimed');
        }
        if (reward.day === actualNextClaimableDayVisual && lastClaimDate !== todayDateString) {
            itemEl.classList.add('available-to-claim');
        }
        dailyClaimGrid.appendChild(itemEl);
    });
}

function checkDailyClaimAvailability() {
    if (!claimDailyRewardButton || !dailyClaimStatus || typeof currentUserData.claim === 'undefined' || typeof t !== 'function' || typeof dailyRewardsConfig === 'undefined') return;

    const lastClaimTimestamp = currentUserData.claim.lastClaim;
    const lastClaimDate = lastClaimTimestamp ? (lastClaimTimestamp.seconds ? new Date(lastClaimTimestamp.toDate()).toISOString().split('T')[0] : lastClaimTimestamp.toString()) : null;
    const todayDateString = new Date().toISOString().split('T')[0];
    currentDailyClaimStep = currentUserData.claim.streak || 0;

    renderDailyRewardsGrid();

    if (lastClaimDate !== todayDateString) {
        claimDailyRewardButton.disabled = false;
        let nextRewardDayToDisplay = currentDailyClaimStep + 1;
        if (nextRewardDayToDisplay > 7) nextRewardDayToDisplay = 1; // Новий цикл

        const rewardInfo = dailyRewardsConfig[(nextRewardDayToDisplay - 1)]; // %7 не потрібен, якщо nextRewardDayToDisplay вже 1
        let rewardText = rewardInfo.type === 'coins' ? t(currentLocale, "daily_reward_text_coins_template", {value: rewardInfo.coins}) : t(currentLocale, "daily_reward_text_capsule_template", {value: t(currentLocale, `capsule_${rewardInfo.capsule}`).toUpperCase()});

        dailyClaimStatus.textContent = t(currentLocale, "daily_cache_available_message_template", {day: nextRewardDayToDisplay, reward_text: rewardText});
        claimDailyRewardButton.textContent = t(currentLocale, "daily_cache_button_claim_template", {day: nextRewardDayToDisplay});
    } else {
        claimDailyRewardButton.disabled = true;
        dailyClaimStatus.textContent = t(currentLocale, "daily_cache_claimed_today_message");
        let claimedDayForButton = currentDailyClaimStep;
        // if (claimedDayForButton === 0 && lastClaimDate === todayDateString) { claimedDayForButton = 7; } // Це може бути нелогічним, якщо стрік 0
        claimDailyRewardButton.textContent = (claimedDayForButton === 0 || claimedDayForButton > 7) ? t(currentLocale, "daily_cache_button_claimed_na") : t(currentLocale, "daily_cache_button_claimed_template", {day: claimedDayForButton});
    }
}


function handleClaimDailyReward() {
    if (!playerUID || !db) {
         if(typeof showCustomMessage === "function") showCustomMessage("Login or wait for DB init.", 3000);
         return;
    }
    if(claimDailyRewardButton) claimDailyRewardButton.disabled = true;

    // URL до вашого бекенду на Render
    const claimApiUrl = "/claim"; // Якщо фронтенд та бекенд на одному домені

    // Визначаємо, яка нагорода має бути
    let newStreak = (currentUserData.claim?.streak || 0) + 1;
    if (newStreak > 7) newStreak = 1; // Початок нового циклу
    const rewardConfig = dailyRewardsConfig[newStreak - 1];

    // Тіло запиту для бекенду - бекенд має сам визначити нагороду на основі userId та свого стану
    // Але оскільки ваш поточний бекенд очікує `reward` в тілі, ми симулюємо це,
    // хоча краще б бекенд сам визначав нагороду.
    let rewardToSendToBackend;
    if (rewardConfig.type === 'coins') {
        rewardToSendToBackend = rewardConfig.coins;
    } else {
        rewardToSendToBackend = rewardConfig.capsule; // Надсилаємо тип капсули як рядок
    }

    fetch(claimApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: playerUID, reward: rewardToSendToBackend, day: newStreak }) // Надсилаємо день для логіки на бекенді (опціонально)
    })
    .then(handleApiResponse)
    .then(data => {
        if (data && data.success) {
            // Дані (coins, ownedCapsules, currentUserData.claim) мають оновитися через onSnapshot з Firestore,
            // тому тут ми просто показуємо повідомлення.
            // Бекенд має оновити дані в Firestore.

            let rewardMessage = "";
            if (rewardConfig.type === 'coins') {
               rewardMessage = t(currentLocale, "message_daily_reward_coins_template", {value: rewardConfig.coins, day: newStreak});
            } else if (rewardConfig.type === 'capsule') {
               rewardMessage = t(currentLocale, "message_daily_reward_capsule_template", {value: t(currentLocale, `capsule_${rewardConfig.capsule}`).toUpperCase(), day: newStreak});
            }
            if (typeof showCustomMessage === "function") showCustomMessage(rewardMessage, 4000);
            // checkDailyClaimAvailability() та updateUIDisplay() будуть викликані через onSnapshot
        } else {
             if (typeof showCustomMessage === "function") showCustomMessage(data.message || "Claim failed on server.", 4000);
             if(claimDailyRewardButton) claimDailyRewardButton.disabled = false;
        }
    })
    .catch(error => {
        console.error("Error claiming daily reward:", error);
        if (typeof showCustomMessage === "function") showCustomMessage(`Claim Error: ${error.message}`, 4000);
        if(claimDailyRewardButton) claimDailyRewardButton.disabled = false;
    });
}

function updateRankDisplay() {
    if (!rankDisplay || typeof currentUserData.username === 'undefined' || !playerUID || typeof t !== 'function') return;
    const username = currentUserData.username || `AGENT-${playerUID.substring(0,4)}`;
    let leaderboard = [];
    try {
        leaderboard = JSON.parse(localStorage.getItem('phonetap_leaderboard_cache')) || [];
    } catch (e) {
        console.warn("Could not parse leaderboard cache.");
    }
    const userRankIndex = leaderboard.findIndex(p => p.name === username);

    if (userRankIndex !== -1) {
        rankDisplay.textContent = `${userRankIndex + 1}`;
    } else {
        rankDisplay.textContent = leaderboard.length >= (typeof LEADERBOARD_SIZE !== 'undefined' ? LEADERBOARD_SIZE : 10) ? "10+" : "N/A";
    }
}


function updateLeaderboard() {
    if (!db || typeof LEADERBOARD_SIZE === 'undefined' || typeof t !== 'function') return;
    db.collection('users').orderBy('balance', 'desc').limit(LEADERBOARD_SIZE).get()
        .then(snapshot => {
            const leaderboardData = [];
            snapshot.forEach(doc => {
                leaderboardData.push({ name: doc.data().username || `AGENT-${doc.id.substring(0,4)}`, coins: doc.data().balance || 0 });
            });
            localStorage.setItem('phonetap_leaderboard_cache', JSON.stringify(leaderboardData));
            renderLeaderboard(leaderboardData);
            updateRankDisplay();
        })
        .catch(error => console.error("Error fetching leaderboard:", error));
}

function renderLeaderboard(data) {
    if(!leaderboardDisplay || typeof t !== 'function') return;
    leaderboardDisplay.innerHTML = (data && data.length) ? '' : `<p class="text-gray-400 font-mono">${t(currentLocale, "leaderboard_empty_message")}</p>`;
    if(data) data.forEach((player, index) => {
        const entry = document.createElement('div');
        entry.className = 'list-item flex justify-between items-center font-mono';

        const rankSpan = document.createElement('span');
        rankSpan.textContent = `#${index + 1} ${player.name || 'Unnamed Agent'}`; // Додано fallback для імені
        const coinsSpan = document.createElement('span');
        coinsSpan.style.color = 'var(--acid-green)';
        coinsSpan.textContent = `${(player.coins || 0).toLocaleString()} ${t(currentLocale, "coins_suffix")}`;

        entry.appendChild(rankSpan);
        entry.appendChild(coinsSpan);
        leaderboardDisplay.appendChild(entry);
    });
}

function scheduleLeaderboardReset() { /* TODO: Implement actual reset logic if needed, e.g., via Firebase Functions */ }

// --- Ініціалізація гри (головна логіка) ---
function initializeGameLogic() {
    console.log("🚀 Initializing game logic for user:", playerUID, "with data:", currentUserData);
    if (!playerUID) {
        console.warn("initializeGameLogic called without playerUID. User might not be authenticated via Discord backend.");
        if (typeof t === 'function' && typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, 'message_login_for_full_features'), 3000);
        return;
    }
     if (typeof currentUserData === 'undefined' || Object.keys(currentUserData).length === 0) {
        console.warn("initializeGameLogic called but currentUserData is not populated. Waiting for Firestore data.");
        // Можливо, варто показати завантажувач або просто нічого не робити, поки дані не прийдуть
        return;
    }

    initializeReferralSystem(); // Має використовувати currentUserData
    updateLeaderboard();
    scheduleLeaderboardReset();

    // Логіка перезарядки на основі даних з Firestore
    if (currentUserData.taps?.lastTap) {
        const serverLastTapTime = currentUserData.taps.lastTap.seconds ? currentUserData.taps.lastTap.toDate().getTime() : Number(currentUserData.taps.lastTap);
        const cooldownMs = (typeof COOLDOWN_DURATION_MS !== 'undefined' ? COOLDOWN_DURATION_MS : (3 * 60 * 60 * 1000));
        if (Date.now() < serverLastTapTime + cooldownMs) {
            nextTapAvailableTime = serverLastTapTime + cooldownMs;
            energy = 0;
            taps = (typeof MAX_TAPS_BEFORE_COOLDOWN !== 'undefined' ? MAX_TAPS_BEFORE_COOLDOWN : 200); // Встановлюємо, що всі тапи використані
            if (cooldownIntervalId) clearInterval(cooldownIntervalId); // Очистити попередній, якщо є
            cooldownIntervalId = setInterval(updateCooldownTimer, 1000);
            updateCooldownTimer(); // Оновити таймер одразу
        }
    }

    updateUIDisplay();
    updateInventoryDisplay();
    checkDailyClaimAvailability();

    if (document.querySelector('.nav-button.active[data-tab="inviteTab"]') && playerInviteCodeDisplay && currentUserData.referrals && typeof t === 'function') {
       playerInviteCodeDisplay.value = currentUserData.referrals.code || playerUID;
       const manuallyReferredBy = currentUserData.referrals.invitedBy;
       if (manuallyReferredBy) {
            if(enterReferralCodeSection) enterReferralCodeSection.classList.add('hidden');
            if(referralStatusMessage) referralStatusMessage.textContent = t(currentLocale, "referral_status_success_template", {value: manuallyReferredBy});
       } else {
            if(enterReferralCodeSection) enterReferralCodeSection.classList.remove('hidden');
            if(referralStatusMessage) referralStatusMessage.textContent = '';
       }
       if(activatedReferralsCountDisplay) activatedReferralsCountDisplay.textContent = currentUserData.referrals.activatedCount || 0;
    }

    if (typeof translatePage === 'function') translatePage();
    console.log("✅ Game logic initialized.");
}

// --- Старт додатку ---
function startApp() {
    console.log("Starting app...");
    initializeSounds();

    if (!initializeFirebase()) {
        console.error("Firebase initialization failed. App cannot start.");
        return;
    }

    // Запит до /auth/user для перевірки сесії з Discord бекендом
    fetch("/auth/user")
      .then(handleApiResponse)
      .then(user => {
        console.log("✅ Authenticated via /auth/user:", user.username, "(ID:", user.id + ")");
        playerUID = user.id;
        setupUserDocument(playerUID); // Запускає слухача Firestore, який потім викличе initializeGameLogic
      })
      .catch(err => {
        console.warn("❌ User not authenticated via /auth/user:", err.message);
        if (typeof t === 'function' && typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, 'message_please_login_discord'), 5000);
        if (appContainer) appContainer.style.display = 'none';
        // Тут можна показати кнопку "Login with Discord", яка перенаправляє на /auth/discord
        // Наприклад, якщо у вас є кнопка <button id="discordLoginButton">Login with Discord</button>:
        const loginButton = document.createElement('button');
        loginButton.id = 'discordLoginButton';
        loginButton.textContent = 'Login with Discord';
        loginButton.className = 'language-button'; // Використовуємо схожий стиль
        loginButton.style.margin = '20px auto';
        loginButton.style.display = 'block';
        loginButton.onclick = () => { window.location.href = '/auth/discord'; };
        if (languageModal && languageModal.parentElement && !document.getElementById('discordLoginButton')) { // Перевірка, щоб не додавати кнопку двічі
            languageModal.parentElement.appendChild(loginButton);
            languageModal.style.display = 'flex'; // Показати модальне вікно (або інший контейнер) для кнопки логіну
        } else if (!document.getElementById('discordLoginButton')) {
            document.body.appendChild(loginButton); // Як крайній варіант
        }
      });

    // Обробники для статичних частин UI (краще перенести в DOMContentLoaded або після ініціалізації DOM елементів)
    if (tapCapsuleElement && tapCapsuleElement.querySelector('.tap-capsule-img')) {
        tapCapsuleElement.querySelector('.tap-capsule-img').addEventListener('contextmenu', e => e.preventDefault());
    }
    if (typeof translatePage === 'function') translatePage();
}


// --- Ініціалізація після завантаження DOM та вибору мови ---
document.addEventListener('DOMContentLoaded', () => {
    // Перевірка наявності функцій локалізації
    if (typeof setLanguage !== 'function' || typeof translatePage !== 'function' || typeof t !== 'function') {
        console.error("Localization functions (setLanguage, translatePage, t) are not defined. Make sure localization.js and config.js are loaded correctly and define these globals before game.js.");
        if (languageModal) languageModal.innerHTML = "<h2>CRITICAL ERROR: Localization system missing.</h2><p>Refresh or check console.</p>";
        return;
    }
    // Перевірка наявності конфігураційних змінних
    if (typeof MAX_ENERGY === 'undefined' || typeof BASE_COINS_PER_TAP === 'undefined') {
        console.error("Core config variables (MAX_ENERGY, BASE_COINS_PER_TAP) are not defined. Make sure config.js is loaded.");
        if (languageModal && !languageModal.innerHTML.includes("CRITICAL ERROR")) languageModal.innerHTML += "<p>Core game config missing.</p>";
        // Можна не блокувати повністю, але деякі функції можуть не працювати
    }


    // Прив'язка обробників до DOM елементів, які вже мають існувати
    if(tapCapsuleElement) tapCapsuleElement.addEventListener('click', handleTapInteraction);
    if(closeDropModalButton) closeDropModalButton.addEventListener('click', () => { if(capsuleDropModal) capsuleDropModal.classList.remove('visible'); });
    if(capsuleDropModal) capsuleDropModal.addEventListener('click', (event) => { if (event.target === capsuleDropModal) capsuleDropModal.classList.remove('visible'); });
    if(claimDailyRewardButton) claimDailyRewardButton.addEventListener('click', handleClaimDailyReward);

    if(copyInviteCodeButton && playerInviteCodeDisplay) {
        copyInviteCodeButton.addEventListener('click', () => {
            playerInviteCodeDisplay.select();
            try {
                navigator.clipboard.writeText(playerInviteCodeDisplay.value)
                    .then(() => showCustomMessage(t(currentLocale, "message_link_copied"), 2000))
                    .catch(err => { console.warn('Async clipboard write failed:', err); if (document.execCommand('copy')) showCustomMessage(t(currentLocale, "message_link_copied_fallback"), 2000); else showCustomMessage(t(currentLocale, "message_link_copy_failed"), 3000); });
            } catch (err) { console.warn('navigator.clipboard not available:', err); if (document.execCommand('copy')) showCustomMessage(t(currentLocale, "message_link_copied_fallback"), 2000); else showCustomMessage(t(currentLocale, "message_link_copy_failed"), 3000); }
        });
    }

    if(confirmReferralCodeButton && enterReferralCodeInput) {
        confirmReferralCodeButton.addEventListener('click', () => {
            if (!playerUID) { // Раніше було !auth || !auth.currentUser, але для Discord-бекенду перевіряємо playerUID
                if (typeof showCustomMessage === "function") showCustomMessage("Please sign in to use referral codes.", 3000); return;
            }
            const enteredCode = enterReferralCodeInput.value.trim().toUpperCase();
            const myOwnReferralCode = currentUserData.referrals?.code || playerUID; // Використовуємо код з Firestore або сам UID

            if (!enteredCode) { if (typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, "referral_status_error_enter_code"), 3000); return; }
            if (enteredCode === myOwnReferralCode) { if (typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, "referral_status_error_own_code"), 3000); return; }
            if (currentUserData.referrals?.invitedBy) {
                if (typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, "referral_status_error_already_referred"), 3000); return;
            }

            if (typeof showCustomMessage === "function") showCustomMessage("Confirming referral code...", 2000);

            // URL до вашого бекенду на Render
            const inviteApiUrl = "/invite"; // Якщо фронтенд та бекенд на одному домені

            fetch(inviteApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: enteredCode, userId: playerUID })
            })
            .then(handleApiResponse)
            .then(data => {
                if (data.success) { // Припускаємо, що бекенд повертає { success: true, ... } або { success: false, message: "..." }
                    // Дані оновляться через Firestore listener, тому тут тільки UI
                    if (typeof showCustomMessage === "function") showCustomMessage(t(currentLocale, "message_referral_bonus_manual_template", {value: enteredCode}), 4000);
                    if(enterReferralCodeSection) enterReferralCodeSection.classList.add('hidden');
                    if(referralStatusMessage && typeof t === 'function') referralStatusMessage.textContent = t(currentLocale, "referral_status_success_template", {value: enteredCode});
                } else {
                    if (typeof showCustomMessage === "function") showCustomMessage(data.message || "Referral failed.", 3000);
                }
            })
            .catch(error => {
                console.error("Error calling invite function:", error);
                if (typeof showCustomMessage === "function") showCustomMessage(`Referral Error: ${error.message}`, 4000);
            });
        });
    }

    const navButtons = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.add('hidden'));
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            const activeTabElement = document.getElementById(tabId);
            if (activeTabElement) activeTabElement.classList.remove('hidden');

            if (tabId === 'inventoryTab') updateInventoryDisplay();
            if (tabId === 'leaderboardTab') updateLeaderboard();
            if (tabId === 'inviteTab' && playerUID && currentUserData.referrals && typeof t === 'function') {
                if(playerInviteCodeDisplay) playerInviteCodeDisplay.value = currentUserData.referrals.code || playerUID;
                const manuallyReferredBy = currentUserData.referrals.invitedBy;
                if (manuallyReferredBy) {
                    if(enterReferralCodeSection) enterReferralCodeSection.classList.add('hidden');
                    if(referralStatusMessage) referralStatusMessage.textContent = t(currentLocale, "referral_status_success_template", {value: manuallyReferredBy});
                } else {
                    if(enterReferralCodeSection) enterReferralCodeSection.classList.remove('hidden');
                    if(referralStatusMessage) referralStatusMessage.textContent = '';
                }
                if(activatedReferralsCountDisplay) activatedReferralsCountDisplay.textContent = currentUserData.referrals.activatedCount || 0;
            }
            if (tabId === 'tasksTab') checkDailyClaimAvailability();
        });
    });


    // Обробник вибору мови - один раз
    const languageButtons = document.querySelectorAll('.language-button');
    if (languageButtons.length > 0) {
        languageButtons.forEach(button => {
            button.addEventListener('click', () => {
                const selectedLang = button.getAttribute('data-lang');
                if (languageModal) languageModal.style.display = 'none';
                if (appContainer) appContainer.style.display = 'flex';

                setLanguage(selectedLang); // Встановлюємо мову (ця функція з localization.js має викликати translatePage)
                startApp(); // Запускаємо основну логіку додатку ПІСЛЯ вибору мови
            });
        });
    } else if (!localStorage.getItem('phonetap_locale')) { // Якщо кнопок немає (наприклад, помилка завантаження HTML), і мова не збережена, показуємо помилку
         console.error("Language buttons not found and no saved locale.");
         if (languageModal) languageModal.innerHTML = "<h2>ERROR: Language buttons missing.</h2>";
         return;
    }


    // Перевірка, чи мова вже збережена, щоб пропустити модальне вікно
    const savedLocale = localStorage.getItem('phonetap_locale');
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'ru')) {
        if (languageModal) languageModal.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
        setLanguage(savedLocale); // Встановлюємо збережену мову
        startApp(); // Запускаємо додаток, якщо мова вже вибрана
    } else {
        // Мова не вибрана, показуємо модальне вікно
        if (languageModal) languageModal.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
        if (typeof translatePage === 'function') translatePage(); // Перекладаємо модальне вікно
    }

    // Запуск пасивного доходу (якщо це потрібно глобально)
    // Переконайтеся, що applyPassiveIncome визначено і використовує playerUID
    // setInterval(applyPassiveIncome, 3600000); // Краще запускати після успішної ініціалізації гри
});
