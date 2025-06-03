if (window !== window.parent) {
  document.body.classList.add("discord-mode");
}

// This file assumes localization.js and config.js are already loaded AND
// Firebase SDKs for app, auth, firestore, functions are loaded in index.html

// --- Firebase Instances (to be initialized) ---
let db;
let auth;
let functions;

// --- Game State Variables ---
let taps = 0; 
let coins = 0; 
let playerUID = ''; 
let energy = typeof MAX_ENERGY !== 'undefined' ? MAX_ENERGY : 200; // Default if config not loaded yet

let nextTapAvailableTime = null; 
let ownedCapsules = []; 
let cooldownIntervalId = null;
let currentDailyClaimStep = 0; 
let activatedReferralsCount = 0;
let currentUserData = {}; 

let currentLocale = 'en'; 
let playerUID = null; // Глобальний UID користувача з Discord

// Перевірка авторизації через Discord
fetch("/auth/user")
  .then((res) => {
    if (!res.ok) throw new Error("Not authenticated");
    return res.json();
  })
  .then((user) => {
    console.log("✅ Logged in as Discord user:", user.username, "(ID:", user.id + ")");
    playerUID = user.id;

    // Можеш тут одразу викликати функції ініціалізації гри
    // наприклад:
    initializeGameForUser(playerUID);
  })
  .catch((err) => {
    console.warn("❌ User not authenticated:", err);
    showCustomMessage("Please login with Discord to play.", 3000);
  });
document.querySelectorAll('.language-button').forEach((button) => {
  button.addEventListener('click', () => {
    const selectedLang = button.getAttribute('data-lang');
    if (typeof setLanguage === 'function') {
      setLanguage(selectedLang);
    } else {
      console.warn("setLanguage function is not available.");
    }

    // Приховуємо мовне вікно після вибору мови
    document.getElementById("languageModal").style.display = "none";
    document.querySelector(".app-container").style.display = "flex";
  });
});

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
                showCustomMessage(t(currentLocale, "message_audio_load_error_template", {soundName: soundName}), 3500);
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
        auth = firebase.auth();
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
function handleApiResponse(response) {
    if (!response.ok) {
        // Handle HTTP errors like 404, 500
        return response.text().then(text => {
            try {
                // Try parsing as JSON first, as error details might be in JSON format
                const err = JSON.parse(text);
                throw new Error(err.message || `Server error: ${response.status}`);
            } catch (e) {
                // If parsing fails, it's likely HTML or plain text
                throw new Error(`Server returned an invalid response. Status: ${response.status}`);
            }
        });
    }
    // Check if the response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        // If not JSON, throw an error instead of trying to parse
        throw new Error("Received an unexpected response format from the server.");
    }
}


// --- Core Game Functions ---
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
                        showCustomMessage(t(currentLocale, "message_audio_play_error_template", {soundName: soundName}), 3000);
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
    droppedCapsuleInfo.textContent = t(currentLocale, "capsule_drop_title_template", {type: t(currentLocale, `capsule_${type}`).toUpperCase() });
    droppedCapsuleBonus.textContent = t(currentLocale, "capsule_drop_bonus_template_raw", {value: capsuleBonuses[type]});
    droppedCapsuleQuote.textContent = "A mysterious energy emanates from it..."; 
    capsuleDropModal.classList.add('visible');
}
if(closeDropModalButton) closeDropModalButton.addEventListener('click', () => capsuleDropModal.classList.remove('visible'));
if(capsuleDropModal) capsuleDropModal.addEventListener('click', (event) => { if (event.target === capsuleDropModal) capsuleDropModal.classList.remove('visible'); });

function getTapReward() {
    let tapReward = BASE_COINS_PER_TAP; 
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
    if(maxEnergyDisplayElement) maxEnergyDisplayElement.textContent = MAX_ENERGY; 
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
        if (energy === 0 && taps >= MAX_TAPS_BEFORE_COOLDOWN) { 
            energy = MAX_ENERGY; 
            taps = 0; 
            nextTapAvailableTime = null; 
            showCustomMessage(t(currentLocale, "message_energy_recharged"));
        }
        updateUIDisplay(); return;
    }
    const remainingMs = nextTapAvailableTime - Date.now();
    const h = Math.floor(remainingMs / 3600000);
    const m = Math.floor((remainingMs % 3600000) / 60000);
    const s = Math.floor((remainingMs % 60000) / 1000);
    cooldownTimerDisplay.textContent = `${t(currentLocale, "cooldown_timer_prefix")}: ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// --- 1. MODIFIED: handleTapInteraction ---
function handleTapInteraction() {
    if (!auth || !auth.currentUser) {
        showCustomMessage("Authenticating... Please wait or refresh.", 3000);
        return;
    }
    if (energy <= 0) {
        showCustomMessage(t(currentLocale, "message_energy_depleted_recharging"), 3000);
        return;
    }

    fetch("https://phonetap-api.onrender.com/tap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: playerUID || "anon" })
    })
    .then(handleApiResponse) // Use the new handler
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

        if (taps >= MAX_TAPS_BEFORE_COOLDOWN) {
            energy = 0;
            const roll = Math.random() * 100;
            let droppedType = 'silver';
            if (roll < capsuleDropChances.discord) droppedType = 'discord';
            else if (roll < capsuleDropChances.discord + capsuleDropChances.diamond) droppedType = 'diamond';
            else if (roll < capsuleDropChances.discord + capsuleDropChances.diamond + capsuleDropChances.gold) droppedType = 'gold';

            const newOwnedCapsules = [...ownedCapsules, droppedType];
            updateUserCapsulesAndHourlyRate(newOwnedCapsules);

            playAudio(dropSound, 'drop');
            if (navigator.vibrate) try { navigator.vibrate([100, 30, 100]); } catch(e) { console.warn("Vibration error", e); }
            showCapsuleDropModal(droppedType);

            nextTapAvailableTime = Date.now() + COOLDOWN_DURATION_MS;
            showCustomMessage(t(currentLocale, "message_tap_limit_cooldown_template", {hours: COOLDOWN_DURATION_MS / 3600000}));
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

    updateUIDisplay();
}
if (tapCapsuleElement) tapCapsuleElement.addEventListener('click', handleTapInteraction);

async function updateUserCapsulesAndHourlyRate(newCapsulesArray) {
    if (!playerUID) return;
    let newHourlyRate = BASE_COINS_PER_TAP;
    newCapsulesArray.forEach(capType => {
        newHourlyRate += capsuleBonuses[capType] || 0;
    });

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

function calculatePassiveIncome() { 
    let totalPassive = 0;
    ownedCapsules.forEach(capsuleType => totalPassive += capsuleBonuses[capsuleType] || 0); 
    return totalPassive;
}

function updateInventoryDisplay() {
    if (!capsuleListDisplay || !passiveIncomeDisplay || !passiveRateDisplayOnTapScreen) return;
    capsuleListDisplay.innerHTML = ''; 
    const counts = ownedCapsules.reduce((acc, cap) => { acc[cap] = (acc[cap] || 0) + 1; return acc; }, {});
    const totalPassive = calculatePassiveIncome(); 
    if (Object.keys(counts).length === 0) capsuleListDisplay.innerHTML = `<p class="text-gray-400 font-mono">${t(currentLocale, "no_capsules_message")}</p>`;
    else {
        for (const [type, count] of Object.entries(counts)) {
            const li = document.createElement('div'); li.className = 'inventory-item';
            li.innerHTML = `<img src="${capsuleImageURLs[type]}" alt="${type} capsule" onerror="this.onerror=null; this.src='https://placehold.co/40x40/0A0A1A/FF00FF?text=ERR&font=Share+Tech+Mono'; this.alt='Error loading ${type} image';"><span class="flex-grow font-mono">${t(currentLocale, `capsule_${type}`).toUpperCase()} CAPSULE x ${count}</span><span class="text-sm font-mono" style="color: var(--acid-green);">+${(capsuleBonuses[type] || 0) * count} C/HR</span>`;
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
            showCustomMessage(t(currentLocale, "message_passive_income_received_template", {value: hourlyBonus.toLocaleString()}), 4000);
        } catch (error) {
            console.error("Error applying passive income:", error);
        }
    }
}
setInterval(applyPassiveIncome, 3600000); 

function generatePlayerUID() { 
    let uid = localStorage.getItem("phonetap_referralCode"); 
    if (!uid) { uid = Math.random().toString(36).substring(2, 9).toUpperCase(); localStorage.setItem("phonetap_referralCode", uid); }
    return uid;
}

function initializeReferralSystem() {
    const myReferralCode = generatePlayerUID(); 
    if(playerInviteCodeDisplay) playerInviteCodeDisplay.value = myReferralCode; 

    const urlParams = new URLSearchParams(window.location.search);
    const refIdFromURL = urlParams.get('ref');
    if (refIdFromURL && refIdFromURL !== myReferralCode && !localStorage.getItem("refUrlBonusClaimed")) { 
       localStorage.setItem('urlReferredBy', refIdFromURL); 
       if (playerUID && db) { 
            db.collection('users').doc(playerUID).update({ balance: firebase.firestore.FieldValue.increment(REFERRAL_URL_JOIN_BONUS) })
              .then(() => showCustomMessage(t(currentLocale, "message_referral_bonus_url_template", {value: refIdFromURL}), 4000))
              .catch(e => console.error("Error giving URL referral bonus:", e));
       }
       localStorage.setItem("refUrlBonusClaimed", "true"); 
    }
    
    const manuallyReferredBy = currentUserData.referrals?.invitedBy || localStorage.getItem('manuallyReferredBy'); 
    if (manuallyReferredBy) {
        if(enterReferralCodeSection) enterReferralCodeSection.classList.add('hidden');
        if(referralStatusMessage) referralStatusMessage.textContent = t(currentLocale, "referral_status_success_template", {value: manuallyReferredBy});
    } else {
        if(enterReferralCodeSection) enterReferralCodeSection.classList.remove('hidden');
        if(referralStatusMessage) referralStatusMessage.textContent = '';
    }
    
    activatedReferralsCount = currentUserData.referrals?.activatedCount || 0; 
    if(activatedReferralsCountDisplay) activatedReferralsCountDisplay.textContent = activatedReferralsCount;
}

if(copyInviteCodeButton) {
    copyInviteCodeButton.addEventListener('click', () => {
        playerInviteCodeDisplay.select();
        try {
            navigator.clipboard.writeText(playerInviteCodeDisplay.value)
                .then(() => showCustomMessage(t(currentLocale, "message_link_copied"), 2000))
                .catch(err => { console.warn('Async clipboard write failed:', err); if (document.execCommand('copy')) showCustomMessage(t(currentLocale, "message_link_copied_fallback"), 2000); else showCustomMessage(t(currentLocale, "message_link_copy_failed"), 3000); });
        } catch (err) { console.warn('navigator.clipboard not available:', err); if (document.execCommand('copy')) showCustomMessage(t(currentLocale, "message_link_copied_fallback"), 2000); else showCustomMessage(t(currentLocale, "message_link_copy_failed"), 3000); }
    });
}

// --- 2. MODIFIED: confirmReferralCodeButton listener ---
if(confirmReferralCodeButton) {
    confirmReferralCodeButton.addEventListener('click', () => { 
        if(!auth || !auth.currentUser) { showCustomMessage("Please sign in to use referral codes.", 3000); return; }
        const enteredCode = enterReferralCodeInput.value.trim().toUpperCase();
        const myOwnReferralCode = currentUserData.referrals?.code || playerUID;
        if (!enteredCode) { showCustomMessage(t(currentLocale, "referral_status_error_enter_code"), 3000); return; }
        if (enteredCode === myOwnReferralCode) { showCustomMessage(t(currentLocale, "referral_status_error_own_code"), 3000); return; }
        if (currentUserData.referrals?.invitedBy) { 
            showCustomMessage(t(currentLocale, "referral_status_error_already_referred"), 3000); return; 
        }

        showCustomMessage("Confirming referral code...", 2000);
        
        fetch("https://phonetap-api.onrender.com/invite", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: enteredCode, userId: playerUID })
        })
        .then(handleApiResponse) // Use the new handler
        .then(data => {
            if (data.status === 'success') {
                showCustomMessage(t(currentLocale, "message_referral_bonus_manual_template", {value: enteredCode}), 4000);
                if(enterReferralCodeSection) enterReferralCodeSection.classList.add('hidden');
                if(referralStatusMessage) referralStatusMessage.textContent = t(currentLocale, "referral_status_success_template", {value: enteredCode});
            } else {
                showCustomMessage(data.message || "Referral failed.", 3000);
            }
        })
        .catch(error => {
            console.error("Error calling invite function:", error);
            showCustomMessage(`Referral Error: ${error.message}`, 4000);
        });
    });
}

function checkReferralActivation() { 
    const actualReferrer = currentUserData.referrals?.invitedBy; 
    if (actualReferrer && !localStorage.getItem('referralMilestoneNotifiedFor_' + actualReferrer + '_by_' + playerUID )) { 
        localStorage.setItem('referralMilestoneNotifiedFor_' + actualReferrer + '_by_' + playerUID, 'true'); 
        showCustomMessage(t(currentLocale, "message_referral_milestone_referrer_template", {value: actualReferrer}), 4000);
        console.log(`REFERRAL SYSTEM: Referee (UID: ${playerUID}) reached ${MAX_TAPS_BEFORE_COOLDOWN} taps. Referrer ${actualReferrer} should get +${REFERRAL_MILESTONE_BONUS_REFERRER} coins. (Backend needed).`);
    }
}

const dailyRewards = dailyRewardsConfig; 

function renderDailyRewardsGrid() {
    if (!dailyClaimGrid) return;
    dailyClaimGrid.innerHTML = ''; 
    const lastClaimDate = currentUserData.claim?.lastClaim ? (currentUserData.claim.lastClaim.seconds ? new Date(currentUserData.claim.lastClaim.toDate()).toISOString().split('T')[0] : currentUserData.claim.lastClaim) : null;
    const todayDateString = new Date().toISOString().split('T')[0];
    let currentCompletedStep = currentUserData.claim?.streak || 0;
    
    let actualNextClaimableDayVisual = currentCompletedStep + 1;
    if (actualNextClaimableDayVisual > 7) actualNextClaimableDayVisual = 1;

    dailyRewards.forEach(reward => {
        const itemEl = document.createElement('div'); itemEl.className = 'daily-reward-item';
        let rewardTextKey = reward.type === 'coins' ? "daily_reward_text_coins_template" : "daily_reward_text_capsule_template";
        let rewardValue = reward.type === 'coins' ? reward.coins : t(currentLocale, `capsule_${reward.capsule}`).toUpperCase();
        itemEl.innerHTML = `<div class="day">${t(currentLocale,'daily_claim')} ${reward.day}</div><div class="reward">${t(currentLocale, rewardTextKey, {value: rewardValue})}</div>`; 
        
        if (reward.day <= currentCompletedStep) {
             itemEl.classList.add('claimed');
        }
        if (reward.day === actualNextClaimableDayVisual && lastClaimDate !== todayDateString) {
            itemEl.classList.add('available-to-claim');
        }
        dailyClaimGrid.appendChild(itemEl);
    });
}

function checkDailyClaimAvailability() {
    if (!claimDailyRewardButton || !dailyClaimStatus) return;
    const lastClaimTimestamp = currentUserData.claim?.lastClaim || 0;
    const lastClaimDate = lastClaimTimestamp ? (lastClaimTimestamp.seconds ? new Date(lastClaimTimestamp.toDate()).toISOString().split('T')[0] : lastClaimTimestamp.toString()) : null; // ensure it's a string
    const todayDateString = new Date().toISOString().split('T')[0];
    currentDailyClaimStep = currentUserData.claim?.streak || 0; 
    
    renderDailyRewardsGrid(); 

    if (lastClaimDate !== todayDateString) {
        claimDailyRewardButton.disabled = false;
        const nextRewardDayToDisplay = currentDailyClaimStep + 1 > 7 ? 1 : currentDailyClaimStep + 1;
        const rewardInfo = dailyRewards[(nextRewardDayToDisplay - 1) % 7];
        let rewardText = rewardInfo.type === 'coins' ? t(currentLocale, "daily_reward_text_coins_template", {value: rewardInfo.coins}) : t(currentLocale, "daily_reward_text_capsule_template", {value: t(currentLocale, `capsule_${rewardInfo.capsule}`).toUpperCase()});
        if (nextRewardDayToDisplay === 1 && currentDailyClaimStep === 7) { 
            rewardText = t(currentLocale, "daily_reward_new_cycle_template", {value: dailyRewards[0].coins});
        }
        dailyClaimStatus.textContent = t(currentLocale, "daily_cache_available_message_template", {day: nextRewardDayToDisplay, reward_text: rewardText});
        claimDailyRewardButton.textContent = t(currentLocale, "daily_cache_button_claim_template", {day: nextRewardDayToDisplay});
    } else {
        claimDailyRewardButton.disabled = true;
        dailyClaimStatus.textContent = t(currentLocale, "daily_cache_claimed_today_message");
        let claimedDayForButton = currentDailyClaimStep;
        if (claimedDayForButton === 0 && lastClaimDate === todayDateString) { claimedDayForButton = 7; } 
        claimDailyRewardButton.textContent = claimedDayForButton === 0 ? t(currentLocale, "daily_cache_button_claimed_na") : t(currentLocale, "daily_cache_button_claimed_template", {day: claimedDayForButton});
    }
}

// --- 3. MODIFIED: handleClaimDailyReward ---
function handleClaimDailyReward() { 
    if (!auth.currentUser) return;
    
    claimDailyRewardButton.disabled = true;

    fetch("https://phonetap-api.onrender.com/claim", { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: playerUID })
    })
    .then(handleApiResponse) // Use the new handler
    .then(data => {
        const rewardData = data.reward;
        const newStreak = data.newStreak || currentDailyClaimStep + 1;
        let rewardMessage = "";

        if (typeof rewardData === 'number') {
           coins += rewardData; 
           rewardMessage = t(currentLocale, "message_daily_reward_coins_template", {value: rewardData, day: newStreak});
        } else if (typeof rewardData === 'string') {
           ownedCapsules.push(rewardData); 
           updateInventoryDisplay(); 
           rewardMessage = t(currentLocale, "message_daily_reward_capsule_template", {value: t(currentLocale, `capsule_${rewardData}`).toUpperCase(), day: newStreak});
        }
       
        updateUIDisplay(); 
        checkDailyClaimAvailability(); 
        showCustomMessage(rewardMessage, 4000);
    })
    .catch(error => {
        console.error("Error claiming daily reward:", error);
        showCustomMessage(`Claim Error: ${error.message}`, 4000);
        claimDailyRewardButton.disabled = false; 
    });
}
if(claimDailyRewardButton) claimDailyRewardButton.addEventListener('click', handleClaimDailyReward);

// ... (rest of the functions: updateRankDisplay, updateLeaderboard, etc. remain the same)

function updateRankDisplay() {
    const username = currentUserData.username || `AGENT-${playerUID.substring(0,4)}`;
    let leaderboard = JSON.parse(localStorage.getItem('phonetap_leaderboard_cache')) || []; 
    const userRankIndex = leaderboard.findIndex(p => p.name === username);
    if (rankDisplay) {
        if (userRankIndex !== -1) rankDisplay.textContent = `${userRankIndex + 1}`;
        else rankDisplay.textContent = leaderboard.length > 0 ? "10+" : "N/A";
    }
}

function updateLeaderboard() { 
    if (!db) return;
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
    if(!leaderboardDisplay) return;
    leaderboardDisplay.innerHTML = data && data.length ? '' : `<p class="text-gray-400 font-mono">${t(currentLocale, "leaderboard_empty_message")}</p>`;
    if(data) data.forEach((player, index) => {
        const entry = document.createElement('div');
        entry.className = 'list-item flex justify-between items-center font-mono';
        entry.innerHTML = `<span>#${index + 1} ${player.name}</span><span style="color:var(--acid-green)">${(player.coins || 0).toLocaleString()} ${t(currentLocale, "coins_suffix")}</span>`;
        leaderboardDisplay.appendChild(entry);
    });
}

function scheduleLeaderboardReset() { /* ... */ }


const navButtons = document.querySelectorAll('.nav-button');
const tabContents = document.querySelectorAll('.tab-content');
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        navButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.add('hidden'));
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId).classList.remove('hidden');
        if (tabId === 'inventoryTab') updateInventoryDisplay();
        if (tabId === 'leaderboardTab') updateLeaderboard(); 
        if (tabId === 'inviteTab') { 
            if(playerInviteCodeDisplay) playerInviteCodeDisplay.value = currentUserData.referrals?.code || playerUID; 
            const manuallyReferredBy = currentUserData.referrals?.invitedBy;
            if (manuallyReferredBy) {
                if(enterReferralCodeSection) enterReferralCodeSection.classList.add('hidden');
                if(referralStatusMessage) referralStatusMessage.textContent = t(currentLocale, "referral_status_success_template", {value: manuallyReferredBy});
            } else {
                if(enterReferralCodeSection) enterReferralCodeSection.classList.remove('hidden');
                if(referralStatusMessage) referralStatusMessage.textContent = '';
            }
            activatedReferralsCount = currentUserData.referrals?.activatedCount || 0; 
            if(activatedReferralsCountDisplay) activatedReferralsCountDisplay.textContent = activatedReferralsCount;
        }
        if (tabId === 'tasksTab') checkDailyClaimAvailability(); 
    });
});

// Setup user data listener
function setupUserDocument(user) {
    const userRef = db.collection('users').doc(user.uid);
    userRef.onSnapshot(doc => {
        if (doc.exists) {
            console.log("Received user data from Firestore:", doc.data());
            currentUserData = doc.data();
            coins = currentUserData.balance || 0;
            ownedCapsules = currentUserData.ownedCapsules || [];
            taps = currentUserData.taps?.count || 0;
            updateUIDisplay();
            updateInventoryDisplay();
            checkDailyClaimAvailability();
        } else {
            console.log("No user document, creating one...");
            const myReferralCode = localStorage.getItem("phonetap_referralCode") || generatePlayerUID();
            userRef.set({
                username: `AGENT-${user.uid.substring(0, 4)}`,
                balance: 0,
                ownedCapsules: [],
                claim: { streak: 0, lastClaim: null },
                referrals: { code: myReferralCode, invitedBy: null, activatedCount: 0 },
                taps: { count: 0, hourlyRate: BASE_COINS_PER_TAP, lastTap: null }
            }).catch(error => console.error("Error creating user document:", error));
        }
    }, error => {
        console.error("Error with Firestore snapshot:", error);
    });
}


function preInitialize() {
    const savedLocale = localStorage.getItem('phonetap_locale');
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'ru')) {
        if (languageModal) languageModal.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
        setLanguage(savedLocale); 
        if (initializeFirebase()) { 
            auth.onAuthStateChanged(user => {
                if (user) {
                    playerUID = user.uid;
                    setupUserDocument(user);
                    initializeGameLogic(); 
                } else {
                    auth.signInAnonymously().catch(error => console.error("Error signing in anonymously:", error));
                }
            });
        }
    } else {
        if (languageModal) languageModal.style.display = 'flex'; 
        if (appContainer) appContainer.style.display = 'none'; 
    }
}

document.querySelectorAll('.language-button').forEach(button => {
    button.addEventListener('click', () => {
        const selectedLang = button.getAttribute('data-lang');
        if (languageModal) languageModal.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
        setLanguage(selectedLang); 
        if (initializeFirebase()) {
             auth.onAuthStateChanged(user => {
                if (user) {
                    playerUID = user.uid;
                    setupUserDocument(user);
                    initializeGameLogic();
                } else {
                    auth.signInAnonymously().catch(error => console.error("Error signing in anonymously:", error));
                }
            });
        }
    });
});

function initializeStaticParts() { 
    initializeSounds(); 
    if (tapCapsuleElement && tapCapsuleElement.querySelector('.tap-capsule-img')) {
        tapCapsuleElement.querySelector('.tap-capsule-img').addEventListener('contextmenu', e => e.preventDefault());
    }
    translatePage();
}


function initializeGameLogic() { 
    initializeReferralSystem(); 
    updateLeaderboard();
    scheduleLeaderboardReset(); 

    if (currentUserData.taps?.lastTap) { 
        const serverLastTapTime = currentUserData.taps.lastTap.seconds ? currentUserData.taps.lastTap.toDate().getTime() : currentUserData.taps.lastTap;
        if (Date.now() < serverLastTapTime + COOLDOWN_DURATION_MS) {
            nextTapAvailableTime = serverLastTapTime + COOLDOWN_DURATION_MS;
            energy = 0; 
            taps = MAX_TAPS_BEFORE_COOLDOWN; 
            if (!cooldownIntervalId) cooldownIntervalId = setInterval(updateCooldownTimer, 1000);
            updateCooldownTimer();
        }
    }
    
    if (document.querySelector('.nav-button.active[data-tab="inviteTab"]')) {
       if(playerInviteCodeDisplay) playerInviteCodeDisplay.value = currentUserData.referrals?.code || playerUID; 
       const manuallyReferredBy = currentUserData.referrals?.invitedBy;
       if (manuallyReferredBy) {
            if(enterReferralCodeSection) enterReferralCodeSection.classList.add('hidden');
            if(referralStatusMessage) referralStatusMessage.textContent = t(currentLocale, "referral_status_success_template", {value: manuallyReferredBy});
       }
       if(activatedReferralsCountDisplay && currentUserData.referrals) activatedReferralsCountDisplay.textContent = currentUserData.referrals.activatedCount || 0;
    }
    translatePage(); 
}

// Global localization functions from localization.js need to be available here
// For example: setLanguage, translatePage, t

document.addEventListener('DOMContentLoaded', () => { 
    // This is where localization.js should have defined these functions
    if (typeof setLanguage !== 'function' || typeof translatePage !== 'function' || typeof t !== 'function') {
        console.error("Localization functions are not defined. Make sure localization.js is loaded correctly before game.js.");
        return;
    }
    preInitialize();
});
