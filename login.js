import { auth, provider } from "./firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");

loginBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Logueado:", result.user.displayName);
    })
    .catch((error) => {
      console.error("Error en login:", error.message);
    });
});

logoutBtn.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      console.log("Sesión cerrada");
    })
    .catch((error) => {
      console.error("Error al cerrar sesión:", error.message);
    });
});

// Detectar si el usuario está logueado
onAuthStateChanged(auth, (user) => {
  if (user) {
    userInfo.innerText = `Hola, ${user.displayName}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";
  } else {
    userInfo.innerText = "No estás logueado";
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
  }
});