// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAaZ57aRF0dlBv2MkLp8rZb2skpJvbEFl8",
  authDomain: "gastocompartido.firebaseapp.com",
  projectId: "gastocompartido",
  storageBucket: "gastocompartido.appspot.com",
  messagingSenderId: "662478843777",
  appId: "1:662478843777:web:6d659ddb7a4be42cc5c280"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

// Elementos DOM
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");

// Login
loginBtn.addEventListener("click", () => {
  auth.signInWithPopup(provider)
    .then((result) => {
      console.log("Logueado:", result.user.displayName);
    })
    .catch((error) => {
      console.error("Error en login:", error.message);
      alert("Error al iniciar sesión: " + error.message);
    });
});

// Logout
logoutBtn.addEventListener("click", () => {
  auth.signOut()
    .then(() => {
      console.log("Sesión cerrada");
    })
    .catch((error) => {
      console.error("Error al cerrar sesión:", error.message);
      alert("Error al cerrar sesión: " + error.message);
    });
});

// Detectar estado de sesión
auth.onAuthStateChanged((user) => {
  if (user) {
    userInfo.innerText = `Hola, ${user.displayName}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    // Guardamos uid y email global para usar luego en app.js
    window.usuarioActivo = {
      uid: user.uid,
      email: user.email,
      nombre: user.displayName
    };

    // Aquí podés llamar funciones de app.js para cargar datos si quieres
  } else {
    userInfo.innerText = "No estás logueado";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";

    window.usuarioActivo = null;
  }
});