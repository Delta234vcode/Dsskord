// functions/firebaseAdmin.js

const admin = require("firebase-admin");

// ===
// 1) Підтягуємо Secret File з Render. 
//    Після того як ви в Render → Secret Files додали файл 
//    з іменем exactly "functionsserviceAccountKey.json" і вставили туди весь JSON
//    від Firebase (service account), він з’явиться у контейнері за шляхом /etc/secrets/.
// ===
let serviceAccount;
try {
  serviceAccount = require("/etc/secrets/functionsserviceAccountKey.json");
} catch (err) {
  console.error(
    "FIREBASEADMIN.JS: Не вдалося знайти secrets-файл. Переконайтеся, що в Render → Secret Files є файл 'functionsserviceAccountKey.json' із повним JSON."
  );
  console.error(err);
  process.exit(1);
}

// ===
// 2) Ініціалізуємо Firebase Admin SDK з сертифікатом із секретного JSON.
// ===
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Якщо ви також використовуєте Realtime Database, розкоментуйте рядок нижче:
  // databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
});

// ===
// 3) Експортуємо інстанцію Firestore (db) і сам admin (щоб можна було брати FieldValue).
// ===
const db = admin.firestore();
module.exports = { db, admin };
