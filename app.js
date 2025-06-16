import { db } from './firebase.js'; 
import { collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

let gastos = [];

// --- NUEVAS FUNCIONES para ingreso y meta en Firestore ---

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

// Renderizar tabla
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

// Actualizar resumen
function actualizarResumen() {
  const totalGastado = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
  totalGastoSpan.textContent = totalGastado.toLocaleString();

  const ingreso = Number(ingresoInput.value) || 0;
  const meta = Number(metaInput.value) || 0;

  // Guardar en localStorage (opcional, puede quedarse para fallback)
  localStorage.setItem("ingreso", ingreso);
  localStorage.setItem("meta", meta);

  // --- NUEVO: guardar ingreso y meta en Firestore ---
  guardarIngresoMetaFirestore(ingreso, meta);

  const ahorroReal = ingreso - totalGastado;
  ahorroRealSpan.textContent = ahorroReal.toLocaleString();
  cumplidaSpan.textContent = ahorroReal >= meta ? "✅" : "❌";
}

// Actualizar gráfico (usando Chart.js)
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

// Guardar gastos en localStorage
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

// Cargar gastos desde Firestore
async function cargarGastosDesdeFirestore() {
  const gastosSnapshot = await getDocs(collection(db, "gastos"));
  gastos = [];

  gastosSnapshot.forEach(doc => {
    gastos.push(doc.data());
  });

  // --- NUEVO: cargar ingreso y meta desde Firestore ---
  await cargarIngresoMetaFirestore();

  // Cargar ingreso y meta desde localStorage (fallback)
  const ingresoGuardado = localStorage.getItem("ingreso");
  const metaGuardada = localStorage.getItem("meta");
  if (ingresoGuardado) ingresoInput.value = ingresoGuardado;
  if (metaGuardada) metaInput.value = metaGuardada;

  renderTabla();
  actualizarResumen();
  actualizarGrafico();
}

// Agregar gasto
agregarBtn.addEventListener("click", () => {
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
    usuarioNombre: "Usuario Local"
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

  gastos = [];
  guardarGastos();
  localStorage.removeItem("ingreso");
  localStorage.removeItem("meta");
  ingresoInput.value = "";
  metaInput.value = "";

  // --- NUEVO: borrar ingreso y meta en Firestore ---
  await borrarIngresoMetaFirestore();

  renderTabla();
  actualizarResumen();
  actualizarGrafico();
});

// Guardar ingreso y meta cuando cambian
ingresoInput.addEventListener("change", actualizarResumen);
metaInput.addEventListener("change", actualizarResumen);

// Cargar datos al iniciar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarGastosDesdeFirestore();
});