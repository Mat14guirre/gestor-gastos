import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAaZ57aRF0dlBv2MkLp8rZb2skpJvbEFl8",
  authDomain: "gastocompartido.firebaseapp.com",
  projectId: "gastocompartido",
  storageBucket: "gastocompartido.firebasestorage.app",
  messagingSenderId: "662478843777",
  appId: "1:662478843777:web:6d659ddb7a4be42cc5c280"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);