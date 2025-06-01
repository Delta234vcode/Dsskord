// --- Localization ---
const translations = {
    en: {
        "energy_header": "Energy", "coins_header": "Coins", "rank_header": "Rank",
        "tap_the_capsule": "TAP THE VOID CAPSULE!", "passive_income_rate_display_template": "🔄 +{value} COINS/HOUR",
        "cooldown_timer_prefix": "COOLDOWN", "cooldown_timer_format": "{h}:{m}:{s}",
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
        "nav_tap": "TAP", "nav_vault": "VAULT", "nav_ranks": "RANKS", "nav_network": "NETWORK", "nav_tasks": "TASKS",
        "capsule_silver": "SILVER", "capsule_gold": "GOLD", "capsule_diamond": "DIAMOND", "capsule_discord": "DISCORD",
        "daily_reward_text_coins_template": "+{value} COINS", "daily_reward_text_capsule_template": "🎁 {value} CAPSULE", "daily_reward_new_cycle_template": "+{value} COINS (New Cycle)",
        "daily_claim": "Daily Claim" // Added for daily reward item display
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
        "nav_tap": "ТАП", "nav_vault": "ХРАНИЛИЩЕ", "nav_ranks": "РАНГИ", "nav_network": "СЕТЬ", "nav_tasks": "ЗАДАНИЯ",
        "capsule_silver": "СЕРЕБРЯНАЯ", "capsule_gold": "ЗОЛОТАЯ", "capsule_diamond": "АЛМАЗНАЯ", "capsule_discord": "ДИСКОРД",
        "daily_reward_text_coins_template": "+{value} МОНЕТ", "daily_reward_text_capsule_template": "🎁 {value} КАПСУЛА", "daily_reward_new_cycle_template": "+{value} МОНЕТ (Новый Цикл)",
        "daily_claim": "Ежедневная Награда" // Added for daily reward item display
    }
};


/**
 * Translates a key into the current language.
 * @param {string} locale The current locale (e.g., 'en', 'ru').
 * @param {string} key The key to translate.
 * @param {object} replacements An object of placeholder-value pairs for dynamic strings.
 * @returns {string} The translated string or