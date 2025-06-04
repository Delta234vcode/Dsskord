// firebase.js
const admin = require("firebase-admin");

// Шлях до Secret File у середовищі Render:
const serviceAccount = require("/etc/secrets/functionsserviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Якщо ви використовуєте Realtime Database, додайте databaseURL. 
  // Для Firestore додавати databaseURL не обов’язково, достатньо cred.
  // можна за потреби: databaseURL: "https://diskord-4c33a.firebaseio.com"
});

const firestore = admin.firestore();
module.exports = firestore;
