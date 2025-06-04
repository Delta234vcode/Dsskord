// functions/firebaseAdmin.js

const admin = require("firebase-admin");

// Спроба підвантажити Secret File з Render.
// Переконайтеся, що в Render → Secret Files є файл 
// з іменем exactly "functionsserviceAccountKey.json" 
// і вмістом повного JSON-ключа з Firebase Console.

let serviceAccount;
try {
  serviceAccount = require("/etc/secrets/functionsserviceAccountKey.json");
} catch (err) {
  console.error(
    "FIREBASEADMIN.JS: Не вдалося знайти секретний файл. " +
      "Переконайтеся, що в Render → Secret Files є файл 'functionsserviceAccountKey.json' " +
      "із повним JSON від Firebase Console."
  );
  console.error(err);
  process.exit(1);
}

// Ініціалізуємо Firebase Admin SDK з сертифікатом із Secret File.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Якщо ви використовуєте Realtime Database, можна додати:
  // databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
});

// Експортуємо інстанцію Firestore (db) і сам admin (для FieldValue тощо).
const db = admin.firestore();
module.exports = { db, admin };
