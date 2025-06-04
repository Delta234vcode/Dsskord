// firebaseAdmin.js
// ----------------
// Цей файл відповідає за ініціалізацію Firebase Admin SDK.
// Використовує Secret File, який Render розміщує у контейнері за шляхом /etc/secrets/functionsserviceAccountKey.json

const admin = require("firebase-admin");

// Завантажуємо Service Account JSON із Secret File Render
// (переконайтесь, що в Render → Secret Files є functionsserviceAccountKey.json з коректним JSON)
const serviceAccount = require("/etc/secrets/functionsserviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Якщо ви також використовуєте Realtime Database, можна додати:
  // databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

// Інстанція Firestore
const db = admin.firestore();

// Експортуємо і db, і admin (щоб у інших файлах можна було зробити FieldValue тощо)
module.exports = { db, admin };
