import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzWJdq3_vuZEt4sW1v5dE9ffRmRO8Muf",
  authDomain: "dsskord-4c33a.firebaseapp.com",
  projectId: "dsskord-4c33a",
  storageBucket: "dsskord-4c33a.appspot.com",
  messagingSenderId: "885733053122",
  appId: "1:885733053122:web:64263528f3b2840f46d5f9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
