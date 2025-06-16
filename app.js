import { db } from './firebase.js'; 
import { collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// --- ELEMENTOS DOM ---
const ingresoInput = document.getElementById("ingreso");
const metaInput = document.getElementById("meta");
const totalGastoSpan = document.getElementById("totalGasto");
const ahorroRealSpan = document.getElementById("ahorroReal");
const cumplidaSpan = document.getElementById("cumplida");
const reiniciarBtn = document.getElementById("reiniciar-btn");

const fechaInput = document.getElementById("fecha");
const categoriaSelect = document.getElementById("categoria");
const montoInput = document.getElementById("monto");
const metodoInput = document.getElementById("metodo");
const observacionesInput = document.getElementById("observaciones");
const agregarBtn = document.getElementById("agregar-btn");

const tablaBody = document.querySelector("#tablaGastos tbody");

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const authButtonsDiv = document.getElementById("auth-buttons");

// --- VARIABLES ---
let gastos = [];
let usuarioActual = null;

// --- FIREBASE AUTH ---
const auth = getAuth();
const provider = new GoogleAuthProvider();

// Correos permitidos
const allowedEmails = ["matias.aguirre269@gmail.com", "florsaucedoo@gmail.com"];

// Función para actualizar UI según usuario logueado o no
function updateUI(user) {
  if (user) {
    if (!allowedEmails.includes(user.email)) {
      alert("No estás autorizado para usar esta app.");
      signOut(auth);
      usuarioActual = null;
      bloquearApp();
      return;
    }
    usuarioActual = user;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    habilitarApp();
    cargarGastosDesdeFirestore();
  } else {
    usuarioActual = null;
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    bloquearApp();
  }
}

// Bloquear la app (ocultar botones, inputs y tabla)
function bloquearApp() {
  ingresoInput.disabled = true;
  metaInput.disabled = true;
  fechaInput.disabled = true;
  categoriaSelect.disabled = true;
  montoInput.disabled = true;
  metodoInput.disabled = true;
  observacionesInput.disabled = true;
  agregarBtn.disabled = true;
  reiniciarBtn.disabled = true;

  tablaBody.innerHTML = "";
  totalGastoSpan.textContent = "0";
  ahorroRealSpan.textContent = "0";
  cumplidaSpan.textContent = "❌";
  if (chart) chart.destroy();
}

// Habilitar la app para el usuario autorizado
function habilitarApp() {
  ingresoInput.disabled = false;
  metaInput.disabled = false;
  fechaInput.disabled = false;
  categoriaSelect.disabled = false;
  montoInput.disabled = false;
  metodoInput.disabled = false;
  observacionesInput.disabled = false;
  agregarBtn.disabled = false;
  reiniciarBtn.disabled = false;
}

// Eventos botones login/logout
loginBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      if (!allowedEmails.includes(user.email)) {
        alert("No estás autorizado para usar esta app.");
        signOut(auth);
      }
    })
    .catch((error) => {
      console.error("Error en login:", error);
    });
});

logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// Escuchar cambios de auth
onAuthStateChanged(auth, (user) => {
  updateUI(user);
});

// --- FIRESTORE ingreso/meta ---
const ingresoMetaDocRef = doc(db, "config", "ingresoMeta");

async function guardarIngresoMetaFirestore(ingreso, meta) {
  try {
    await setDoc(ingresoMetaDocRef, { ingreso, meta });
    console.log("Ingreso y meta guardados en Firestore");
  } catch (error) {
    console.error("Error guardando ingreso y meta en Firestore:", error);
  }
}

async function cargarIngresoMetaFirestore() {
  try {
    const docSnap = await getDoc(ingresoMetaDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      ingresoInput.value = data.ingreso || 0;
      metaInput.value = data.meta || 0;
    }
  } catch (error) {
    console.error("Error cargando ingreso y meta desde Firestore:", error);
  }
}

async function borrarIngresoMetaFirestore() {
  try {
    await deleteDoc(ingresoMetaDocRef);
    console.log("Ingreso y meta borrados de Firestore");
  } catch (error) {
    console.error("Error borrando ingreso y meta de Firestore:", error);
  }
}

// --- RENDERIZAR TABLA ---
function renderTabla() {
  tablaBody.innerHTML = "";
  gastos.forEach(gasto => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${gasto.fecha}</td>
      <td>${gasto.categoria}</td>
      <td>$${Number(gasto.monto).toLocaleString()}</td>
      <td>${gasto.metodo}</td>
      <td>${gasto.observaciones}</td>
      <td>${gasto.usuarioNombre || "Anónimo"}</td>
    `;
    tablaBody.appendChild(tr);
  });
}

// --- ACTUALIZAR RESUMEN ---
function actualizarResumen() {
  const totalGastado = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
  totalGastoSpan.textContent = totalGastado.toLocaleString();

  const ingreso = Number(ingresoInput.value) || 0;
  const meta = Number(metaInput.value) || 0;

  // Guardar en localStorage (fallback)
  localStorage.setItem("ingreso", ingreso);
  localStorage.setItem("meta", meta);

  // Guardar ingreso y meta en Firestore
  guardarIngresoMetaFirestore(ingreso, meta);

  const ahorroReal = ingreso - totalGastado;
  ahorroRealSpan.textContent = ahorroReal.toLocaleString();
  cumplidaSpan.textContent = ahorroReal >= meta ? "✅" : "❌";
}

// --- GRÁFICO ---
const ctx = document.getElementById("graficoGastos").getContext("2d");
let chart;

function actualizarGrafico() {
  const dataCategorias = {};
  gastos.forEach(gasto => {
    if (!dataCategorias[gasto.categoria]) dataCategorias[gasto.categoria] = 0;
    dataCategorias[gasto.categoria] += Number(gasto.monto);
  });

  const categorias = Object.keys(dataCategorias);
  const montos = categorias.map(cat => dataCategorias[cat]);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: categorias,
      datasets: [{
        data: montos,
        backgroundColor: [
          "#f94144", "#f3722c", "#f9844a", "#f9c74f",
          "#90be6d", "#43aa8b", "#577590", "#277da1"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// --- GUARDAR Y CARGAR GASTOS ---
function guardarGastos() {
  localStorage.setItem("gastos", JSON.stringify(gastos));
}

function guardarGastoEnFirestore(gasto) {
  console.log("Intentando guardar gasto en Firestore:", gasto);
  addDoc(collection(db, "gastos"), gasto)
    .then(() => {
      console.log("Gasto guardado en Firestore");
    })
    .catch((error) => {
      console.error("Error al guardar en Firestore:", error);
    });
}

async function cargarGastosDesdeFirestore() {
  if (!usuarioActual) return; // si no está logueado, no carga nada

  const gastosSnapshot = await getDocs(collection(db, "gastos"));
  gastos = [];

  gastosSnapshot.forEach(doc => {
    gastos.push(doc.data());
  });

  // Cargar ingreso y meta
  try {
    const docSnap = await getDoc(ingresoMetaDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      ingresoInput.value = data.ingreso || 0;
      metaInput.value = data.meta || 0;
    } else {
      // fallback localStorage
      const ingresoGuardado = localStorage.getItem("ingreso");
      const metaGuardada = localStorage.getItem("meta");
      if (ingresoGuardado) ingresoInput.value = ingresoGuardado;
      if (metaGuardada) metaInput.value = metaGuardada;
    }
  } catch (error) {
    console.error("Error cargando ingreso/meta:", error);
    const ingresoGuardado = localStorage.getItem("ingreso");
    const metaGuardada = localStorage.getItem("meta");
    if (ingresoGuardado) ingresoInput.value = ingresoGuardado;
    if (metaGuardada) metaInput.value = metaGuardada;
  }

  renderTabla();
  actualizarResumen();
  actualizarGrafico();
}

// --- EVENTOS ---
// Agregar gasto
agregarBtn.addEventListener("click", () => {
  if (!usuarioActual) {
    alert("Debes iniciar sesión para agregar gastos.");
    return;
  }

  const fecha = fechaInput.value;
  const categoria = categoriaSelect.value;
  const monto = parseFloat(montoInput.value);
  const metodo = metodoInput.value.trim();
  const observaciones = observacionesInput.value.trim();

  if (!fecha || !categoria || !monto || monto <= 0) {
    alert("Por favor completa fecha, categoría y monto válidos.");
    return;
  }

  const gasto = {
    fecha,
    categoria,
    monto,
    metodo,
    observaciones,
    usuarioNombre: usuarioActual.displayName || "Usuario"
  };

  gastos.push(gasto);
  guardarGastos();
  guardarGastoEnFirestore(gasto);
  renderTabla();
  actualizarResumen();
  actualizarGrafico();

  // Limpiar formulario
  fechaInput.value = "";
  montoInput.value = "";
  metodoInput.value = "";
  observacionesInput.value = "";
});

// Reiniciar datos
reiniciarBtn.addEventListener("click", async () => {
  if (!confirm("¿Querés reiniciar todos los gastos y metas para un nuevo mes?")) return;

  // Borrar documentos en Firestore
  try {
    const gastosSnapshot = await getDocs(collection(db, "gastos"));
    const batchDeletePromises = gastosSnapshot.docs.map(docSnap => deleteDoc(doc(db, "gastos", docSnap.id)));
    await Promise.all(batchDeletePromises);
    console.log("Gastos borrados de Firestore.");
  } catch (error) {
    console.error("Error borrando gastos en Firestore:", error);
  }

  // Limpiar en memoria y localStorage
  gastos = [];
  guardarGastos();
  localStorage.removeItem("ingreso");
  localStorage.removeItem("meta");
  ingresoInput.value = "";
  metaInput.value = "";

  renderTabla();
  actualizarResumen();
  actualizarGrafico();
});

// Guardar ingreso/meta cuando cambian
ingresoInput.addEventListener("change", actualizarResumen);
metaInput.addEventListener("change", actualizarResumen);

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  // Inicialmente bloquea la app hasta login
  bloquearApp();
});