import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAaZ57aRF0dlBv2MkLp8rZb2skpJvbEFl8",
  authDomain: "gastocompartido.firebaseapp.com",
  projectId: "gastocompartido",
  storageBucket: "gastocompartido.firebasestorage.app",
  messagingSenderId: "662478843777",
  appId: "1:662478843777:web:6d659ddb7a4be42cc5c280"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider };