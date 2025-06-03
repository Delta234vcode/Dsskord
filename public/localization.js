// --- Localization ---
const translations = {
    en: {
        "energy_header": "Energy", "coins_header": "Coins", "rank_header": "Rank",
        "tap_the_capsule": "TAP THE VOID CAPSULE!", "passive_income_rate_display_template": "🔄 +{value} COINS/HOUR",
        "cooldown_timer_prefix": "COOLDOWN", "cooldown_timer_format": "{h}:{m}:{s}", // Цей формат не використовується прямо, але може бути корисним
        "inventory_title": "DATA VAULT // CAPSULES", "passive_income_label": "PASSIVE STREAM:", "no_capsules_message": "NO ARTIFACTS IN VAULT. KEEP TAPPING THE VOID.", "coins_per_hour_suffix": "COINS/HR",
        "leaderboard_title": "VOID RANKINGS // DAILY", "leaderboard_empty_message": "RANKINGS OFFLINE. BE THE FIRST AGENT.", "coins_suffix": "COINS", "leaderboard_reset_note": "Rankings reset 00:00 UTC.",
        "invite_title": "NETWORK // INVITE AGENTS", "your_invite_code_label": "Your Unique Agent ID:", "copy_button_id": "COPY ID", "referral_enter_code_label": "Enter Agent ID of your Referrer:", "confirm_button": "CONFIRM",
        "referral_status_success_template": "Successfully referred by Agent ID: {value}", "referral_status_error_own_code": "You cannot enter your own Agent ID.", "referral_status_error_already_referred": "You have already entered a referral code.", "referral_status_error_enter_code": "Please enter an Agent ID.",
        "activated_referrals_label": "Activated Referrals",
        "your_rewards_label_referrer": "YOUR REWARDS (as Referrer):",
        "referrer_bonus_manual_code": "💸 +200 COINS // <span class=\"font-bold text-neon-pink\">YOU</span> // WHEN YOUR REFERRED AGENT ENTERS YOUR CODE.",
        "referrer_bonus_200_taps": "💸 +100 COINS // <span class=\"font-bold text-neon-pink\">YOU</span> // WHEN YOUR REFERRED AGENT COMPLETES 200 TAPS.",
        "referrer_bonus_10_percent": "⚡ +10% OF THEIR ACQUIRED ASSETS // <span class=\"font-bold text-neon-pink\">FOREVER</span>.",
        "your_rewards_label_referee": "YOUR BONUS (as Referee):",
        "referee_bonus_url": "🎁 +25 COINS INSTANTLY // JOINING VIA URL LINK!",
        "referee_bonus_manual_code": "🎁 +100 COINS INSTANTLY // MANUALLY ENTERING A REFERRER'S CODE!",
        "backend_needed_note": "(This reward is simulated client-side. Backend needed for actual cross-user rewards.)",
        "backend_needed_note_2": "(Simulated. Backend needed.)",
        "backend_needed_note_3": "(This feature requires a dedicated backend server for tracking & distribution.)",
        "passive_income_note": "Income stream auto-updates hourly.",
        "referral_enter_placeholder": "AGENT_ID_HERE",
        "tasks_title_daily_cache": "DAILY CACHE", "daily_cache_status_checking": "SCANNING CACHE STATUS...", "daily_cache_button_claim_template": "ACCESS CACHE (DAY {day})", "daily_cache_button_claimed_template": "ACCESSED (DAY {day})", "daily_cache_button_claimed_na": "ACCESSED (DAY N/A)",
        "daily_cache_available_message_template": "DAILY CACHE FOR DAY {day} IS AVAILABLE! ({reward_text})", "daily_cache_claimed_today_message": "DAILY CACHE ACCESSED. RETURN TOMORROW.",
        "capsule_drop_title_template": "ARTIFACT ACQUIRED: {type}!", "capsule_drop_bonus_template_raw": "+{value} COINS/HR STREAMING", "capsule_drop_close_button": "LOG IT!",
        "message_tap_limit_cooldown_template": "TAP LIMIT REACHED! SYSTEM COOLDOWN: {hours} HOURS.", "message_energy_recharged": "ENERGY CORE RECHARGED! TAP ONLINE.", "message_energy_depleted_wait_template": "ENERGY DEPLETED! RECHARGE IN {minutes} MIN.", "message_energy_depleted_recharging": "ENERGY DEPLETED! AWAITING RECHARGE.",
        "message_passive_income_received_template": "+{value} COINS FROM PASSIVE STREAM!", "message_referral_bonus_url_template": "NETWORK JOIN BONUS! REFERRED BY {value}. +25 COINS!", "message_referral_bonus_manual_template": "Successfully referred by Agent {value}! You received +100 COINS.",
        "message_referral_milestone_referrer_template": "Milestone reached! Your referrer {value} will be notified (simulated). They should receive 100 coins.",
        "message_link_copied": "SIGNAL ID COPIED!", "message_link_copied_fallback": "SIGNAL ID COPIED! (FALLBACK)", "message_link_copy_failed": "COPY FAILED. MANUAL COPY REQUIRED.",
        "message_daily_reward_claimed_already": "DAILY CACHE ALREADY ACCESSED!", "message_daily_reward_coins_template": "ACQUIRED {value} COINS! (DAY {day})", "message_daily_reward_capsule_template": "🎉 ARTIFACT ACQUIRED: {value} CAPSULE! (DAY {day})",
        "message_leaderboard_reset": "RANKINGS RESET FOR NEW CYCLE!", "message_audio_load_error_template": "AUDIO OFFLINE: {soundName}. CHECK PATH/FORMAT.", "message_audio_play_error_template": "AUDIO PLAYBACK ERROR: {soundName}.",
        "message_storage_error": "COULD NOT SAVE GAME STATE. STORAGE ERROR.",
        "message_user_not_authenticated_tap": "Please login to tap!", // Додано
        "message_please_login_discord": "Please login with Discord to continue.", // Додано
        "message_login_for_full_features": "Login for full features.", // Додано
        "nav_tap": "TAP", "nav_vault": "VAULT", "nav_ranks": "RANKS", "nav_network": "NETWORK", "nav_tasks": "TASKS",
        "capsule_silver": "SILVER", "capsule_gold": "GOLD", "capsule_diamond": "DIAMOND", "capsule_discord": "DISCORD",
        "daily_reward_text_coins_template": "+{value} COINS", "daily_reward_text_capsule_template": "🎁 {value} CAPSULE", "daily_reward_new_cycle_template": "+{value} COINS (New Cycle)",
        "daily_claim": "Daily Reward" // Змінено для кращого узгодження
    },
    ru: {
        "energy_header": "Энергия", "coins_header": "Монеты", "rank_header": "Ранг",
        "tap_the_capsule": "ТАПАЙ ПО КАПСУЛЕ ПУСТОТЫ!", "passive_income_rate_display_template": "🔄 +{value} МОНЕТ/ЧАС",
        "cooldown_timer_prefix": "КУЛДАУН", "cooldown_timer_format": "{h}:{m}:{s}",
        "inventory_title": "ХРАНИЛИЩЕ ДАННЫХ // КАПСУЛЫ", "passive_income_label": "ПАССИВНЫЙ ПОТОК:", "no_capsules_message": "АРТЕФАКТОВ В ХРАНИЛИЩЕ НЕТ. ПРОДОЛЖАЙ ТАПАТЬ.", "coins_per_hour_suffix": "МОНЕТ/ЧАС",
        "leaderboard_title": "РЕЙТИНГИ ПУСТОТЫ // ЕЖЕДНЕВНО", "leaderboard_empty_message": "РЕЙТИНГИ ОФФЛАЙН. БУДЬ ПЕРВЫМ АГЕНТОМ.", "coins_suffix": "МОНЕТ", "leaderboard_reset_note": "Рейтинги сбрасываются в 00:00 UTC.",
        "invite_title": "СЕТЬ // ПРИГЛАСИ АГЕНТОВ", "your_invite_code_label": "Твой уникальный ID агента:", "copy_button_id": "КОПИРОВАТЬ ID", "referral_enter_code_label": "Введи ID агента твоего реферера:", "confirm_button": "ПОДТВЕРДИТЬ",
        "referral_status_success_template": "Успешно приглашен агентом с ID: {value}", "referral_status_error_own_code": "Невозможно ввести собственный ID агента.", "referral_status_error_already_referred": "Ты уже ввел реферальный код.", "referral_status_error_enter_code": "Пожалуйста, введи ID агента.",
        "activated_referrals_label": "Активированные рефералы",
        "your_rewards_label_referrer": "ТВОИ НАГРАДЫ (как реферер):",
        "referrer_bonus_manual_code": "💸 +200 МОНЕТ // <span class=\"font-bold text-neon-pink\">ТЕБЕ</span> // КОГДА ПРИГЛАШЕННЫЙ АГЕНТ ВВОДИТ ТВОЙ КОД.",
        "referrer_bonus_200_taps": "💸 +100 МОНЕТ // <span class=\"font-bold text-neon-pink\">ТЕБЕ</span> // КОГДА ПРИГЛАШЕННЫЙ АГЕНТ СДЕЛАЕТ 200 ТАПОВ.",
        "referrer_bonus_10_percent": "⚡ +10% ОТ ИХ ЗАРАБОТАННЫХ АКТИВОВ // <span class=\"font-bold text-neon-pink\">НАВСЕГДА</span>.",
        "your_rewards_label_referee": "ТВОЙ БОНУС (как реферал):",
        "referee_bonus_url": "🎁 +25 МОНЕТ МГНОВЕННО // ЗА ПРИСОЕДИНЕНИЕ ПО URL-ССЫЛКЕ!",
        "referee_bonus_manual_code": "🎁 +100 МОНЕТ МГНОВЕННО // ЗА ВВОД КОДА РЕФЕРЕРА ВРУЧНУЮ!",
        "backend_needed_note": "(Эта награда симулируется на стороне клиента. Для реальных межпользовательских наград нужен бэкенд.)",
        "backend_needed_note_2": "(Симулируется. Нужен бэкенд.)",
        "backend_needed_note_3": "(Эта функция требует выделенного сервера для отслеживания и распределения.)",
        "passive_income_note": "Пассивный доход начисляется автоматически каждый час.",
        "referral_enter_placeholder": "ID_АГЕНТА_ЗДЕСЬ",
        "tasks_title_daily_cache": "ЕЖЕДНЕВНЫЙ КЕШ", "daily_cache_status_checking": "СКАНИРОВАНИЕ СТАТУСА КЕША...", "daily_cache_button_claim_template": "ДОСТУП К КЕШУ (ДЕНЬ {day})", "daily_cache_button_claimed_template": "ПОЛУЧЕНО (ДЕНЬ {day})", "daily_cache_button_claimed_na": "ПОЛУЧЕНО (ДЕНЬ N/A)",
        "daily_cache_available_message_template": "ЕЖЕДНЕВНЫЙ КЕШ ДЛЯ ДНЯ {day} ДОСТУПЕН! ({reward_text})", "daily_cache_claimed_today_message": "ЕЖЕДНЕВНЫЙ КЕШ УЖЕ ПОЛУЧЕН. ВОЗВРАЩАЙСЯ ЗАВТРА.",
        "capsule_drop_title_template": "АРТЕФАКТ ПОЛУЧЕН: {type}!", "capsule_drop_bonus_template_raw": "+{value} МОНЕТ/ЧАС В ПОТОКЕ", "capsule_drop_close_button": "ЗАПИСАТЬ!",
        "message_tap_limit_cooldown_template": "ЛИМИТ ТАПОВ! СИСТЕМНЫЙ КУЛДАУН: {hours} ЧАС.", "message_energy_recharged": "ЯДРО ЭНЕРГИИ ПЕРЕЗАРЯЖЕНО! ТАП ДОСТУПЕН.", "message_energy_depleted_wait_template": "ЭНЕРГИЯ ИСТОЩЕНА! ПЕРЕЗАРЯДКА ЧЕРЕЗ {minutes} МИН.", "message_energy_depleted_recharging": "ЭНЕРГИЯ ИСТОЩЕНА! ОЖИДАНИЕ ПЕРЕЗАРЯДКИ.",
        "message_passive_income_received_template": "+{value} МОНЕТ С ПАССИВНОГО ПОТОКА!", "message_referral_bonus_url_template": "БОНУС ЗА ПРИСОЕДИНЕНИЕ К СЕТИ! ПРИГЛАСИЛ {value}. +25 МОНЕТ!", "message_referral_bonus_manual_template": "Успешно приглашен агентом {value}! Ты получил +100 МОНЕТ.",
        "message_referral_milestone_referrer_template": "Рубеж достигнут! Твой реферер {value} будет уведомлен (симуляция). Он должен получить 100 монет.",
        "message_link_copied": "ID СИГНАЛА СКОПИРОВАН!", "message_link_copied_fallback": "ID СИГНАЛА СКОПИРОВАН! (РЕЗЕРВ)", "message_link_copy_failed": "КОПИРОВАНИЕ НЕУДАЧНО. СКОПИРУЙ ВРУЧНУЮ.",
        "message_daily_reward_claimed_already": "ЕЖЕДНЕВНАЯ НАГРАДА УЖЕ ПОЛУЧЕНА!", "message_daily_reward_coins_template": "ПОЛУЧЕНО {value} МОНЕТ! (ДЕНЬ {day})", "message_daily_reward_capsule_template": "🎉 АРТЕФАКТ ПОЛУЧЕН: {value} КАПСУЛА! (ДЕНЬ {day})",
        "message_leaderboard_reset": "РЕЙТИНГИ СБРОШЕНЫ ДЛЯ НОВОГО ЦИКЛА!", "message_audio_load_error_template": "АУДИО ОФФЛАЙН: {soundName}. ПРОВЕРЬ ПУТЬ/ФОРМАТ.", "message_audio_play_error_template": "ОШИБКА ВОСПРОИЗВЕДЕНИЯ АУДИО: {soundName}.",
        "message_storage_error": "НЕ УДАЛОСЬ СОХРАНИТЬ СОСТОЯНИЕ ИГРЫ. ОШИБКА ХРАНИЛИЩА.",
        "message_user_not_authenticated_tap": "Пожалуйста, войдите, чтобы тапать!", // Додано
        "message_please_login_discord": "Пожалуйста, войдите через Discord, чтобы продолжить.", // Додано
        "message_login_for_full_features": "Войдите для доступа ко всем функциям.", // Додано
        "nav_tap": "ТАП", "nav_vault": "ХРАНИЛИЩЕ", "nav_ranks": "РАНГИ", "nav_network": "СЕТЬ", "nav_tasks": "ЗАДАНИЯ",
        "capsule_silver": "СЕРЕБРЯНАЯ", "capsule_gold": "ЗОЛОТАЯ", "capsule_diamond": "АЛМАЗНАЯ", "capsule_discord": "ДИСКОРД",
        "daily_reward_text_coins_template": "+{value} МОНЕТ", "daily_reward_text_capsule_template": "🎁 {value} КАПСУЛА", "daily_reward_new_cycle_template": "+{value} МОНЕТ (Новый Цикл)",
        "daily_claim": "Ежедневный Клейм" // Змінено для кращого узгодження
    }
};

let currentLocale = 'en'; // Мова за замовчуванням

/**
 * Встановлює поточну мову та зберігає її у localStorage.
 * @param {string} lang Код мови ('en' або 'ru').
 */
function setLanguage(lang) {
    if (translations[lang]) {
        currentLocale = lang;
        localStorage.setItem('phonetap_locale', lang);
        console.log(`Language set to: ${lang}`);
        translatePage(); // Перекладаємо сторінку після зміни мови
    } else {
        console.warn(`Language ${lang} not found. Defaulting to 'en'.`);
        currentLocale = 'en'; // Повертаємось до мови за замовчуванням, якщо вибрана не існує
        localStorage.setItem('phonetap_locale', 'en');
        translatePage();
    }
}

/**
 * Перекладає рядок за ключем для поточної або вказаної мови.
 * @param {string} locale Поточна локаль (наприклад, 'en', 'ru').
 * @param {string} key Ключ для перекладу.
 * @param {object} [replacements] Об'єкт пар плейсхолдер-значення для динамічних рядків.
 * @returns {string} Перекладений рядок або ключ, якщо переклад не знайдено.
 */
function t(locale, key, replacements = {}) {
    let langToUse = translations[locale] ? locale : 'en'; // Використовуємо 'en' якщо локаль не знайдена

    let text = translations[langToUse]?.[key] || translations['en']?.[key] || key; // Спочатку поточна, потім англійська, потім сам ключ

    for (const placeholder in replacements) {
        if (replacements.hasOwnProperty(placeholder)) {
            text = text.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
        }
    }
    return text;
}

/**
 * Оновлює текстовий вміст елементів на сторінці відповідно до поточної мови.
 */
function translatePage() {
    console.log(`Translating page to: ${currentLocale}`);
    document.querySelectorAll('[data-translate-key]').forEach(element => {
        const key = element.getAttribute('data-translate-key');
        let replacements = {};
        if (element.dataset.translateValue) { // Для динамічних значень, якщо вони є
             replacements.value = element.dataset.translateValue;
        }
        if (element.dataset.translateDay) {
            replacements.day = element.dataset.translateDay;
        }
         if (element.dataset.translateHours) {
            replacements.hours = element.dataset.translateHours;
        }
        if (element.dataset.translateMinutes) {
            replacements.minutes = element.dataset.translateMinutes;
        }
        if (element.dataset.translateSoundname) {
            replacements.soundName = element.dataset.translateSoundname;
        }
        if (element.dataset.translateType) {
            replacements.type = element.dataset.translateType;
        }
        if (element.dataset.translateRewardText) {
             replacements.reward_text = element.dataset.translateRewardText;
        }


        const translatedText = t(currentLocale, key, replacements);

        // Для input[type="text"] та подібних, встановлюємо placeholder
        if (element.tagName === 'INPUT' && element.hasAttribute('placeholder') && element.hasAttribute('data-placeholder-key')) {
            const placeholderKey = element.getAttribute('data-placeholder-key');
            element.placeholder = t(currentLocale, placeholderKey);
        } else {
             // Для елементів, що містять HTML (наприклад, через innerHTML з перекладу)
            if (translatedText.includes('<') && translatedText.includes('>')) {
                element.innerHTML = translatedText;
            } else {
                element.textContent = translatedText;
            }
        }
    });
}

// Ініціалізація: спроба завантажити збережену мову при завантаженні скрипта.
// Але основний виклик setLanguage та translatePage має відбуватися після завантаження DOM,
// тому preInitialize в game.js є кращим місцем для цього.
// Тут можна залишити встановлення currentLocale, якщо це потрібно до DOMContentLoaded.
const savedLocaleOnLoad = localStorage.getItem('phonetap_locale');
if (savedLocaleOnLoad && translations[savedLocaleOnLoad]) {
    currentLocale = savedLocaleOnLoad;
}

// Переконайтеся, що ці функції доступні глобально для game.js, якщо localization.js завантажується першим.
// Якщо game.js може завантажитися раніше, ці функції мають бути експортовані або game.js має чекати на їх готовність.
// Оскільки вони оголошені глобально (без модулів), вони мають бути доступні, якщо localization.js завантажений перед game.js.
