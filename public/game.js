 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/public/game.js b/public/game.js
index ccf6dec751632a3f283d8a367328f0b6935f51b3..d0903f8a989bdd524841a9be5cdb64db8046698f 100644
--- a/public/game.js
+++ b/public/game.js
@@ -22,80 +22,50 @@ let cooldownIntervalId = null;
 let currentDailyClaimStep = 0; 
 let activatedReferralsCount = 0;
 let currentUserData = {}; 
 
 let currentLocale = 'en'; 
    playerUID = null; // Глобальний UID користувача з Discord
 
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
-document.addEventListener("DOMContentLoaded", () => {
-  document.querySelectorAll('.language-button').forEach((button) => {
-    button.addEventListener('click', () => {
-      const selectedLang = button.getAttribute('data-lang');
-      if (typeof setLanguage === 'function') {
-        setLanguage(selectedLang);
-      } else {
-        console.warn("setLanguage is not defined.");
-      }
-
-      document.getElementById("languageModal").style.display = "none";
-      document.querySelector(".app-container").style.display = "flex";
-    });
-  });
-});
-
-document.querySelectorAll('.language-button').forEach((button) => {
-  button.addEventListener('click', () => {
-    const selectedLang = button.getAttribute('data-lang');
-    if (typeof setLanguage === 'function') {
-      setLanguage(selectedLang);
-    } else {
-      console.warn("setLanguage function is not available.");
-    }
-
-    // Приховуємо мовне вікно після вибору мови
-    document.getElementById("languageModal").style.display = "none";
-    document.querySelector(".app-container").style.display = "flex";
-  });
-});
 
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
diff --git a/public/game.js b/public/game.js
index ccf6dec751632a3f283d8a367328f0b6935f51b3..d0903f8a989bdd524841a9be5cdb64db8046698f 100644
--- a/public/game.js
+++ b/public/game.js
@@ -608,51 +578,57 @@ function updateRankDisplay() {
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
-        entry.innerHTML = `<span>#${index + 1} ${player.name}</span><span style="color:var(--acid-green)">${(player.coins || 0).toLocaleString()} ${t(currentLocale, "coins_suffix")}</span>`;
+        const rankSpan = document.createElement('span');
+        rankSpan.textContent = `#${index + 1} ${player.name}`;
+        const coinsSpan = document.createElement('span');
+        coinsSpan.style.color = 'var(--acid-green)';
+        coinsSpan.textContent = `${(player.coins || 0).toLocaleString()} ${t(currentLocale, "coins_suffix")}`;
+        entry.appendChild(rankSpan);
+        entry.appendChild(coinsSpan);
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
 
EOF
)
