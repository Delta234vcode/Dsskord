// functions/firebaseAdmin.js
const admin = require("firebase-admin");
// Переконайтеся, що serviceAccountKey.json знаходиться в правильному місці
// і доступний для Render (наприклад, через Secret Files)
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) { // Перевірка, щоб уникнути повторної ініціалізації
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin SDK Initialized.");
} else {
  admin.app(); // Отримати вже ініціалізований додаток
  console.log("Firebase Admin SDK already initialized.");
}


const db = admin.firestore();
const authAdmin = admin.auth(); // Якщо вам потрібен admin.auth()

module.exports = { db, authAdmin, adminInstance: admin }; // Експортуємо db та, можливо, authAdmin і сам admin
