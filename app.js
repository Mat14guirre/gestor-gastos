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

// Cargar desde localStorage al iniciar
document.addEventListener("DOMContentLoaded", () => {
  const datosGuardados = localStorage.getItem("gastos");
  if (datosGuardados) {
    gastos = JSON.parse(datosGuardados);
  }
  renderTabla();
  actualizarResumen();
  actualizarGrafico();
});

// Guardar en localStorage
function guardarEnLocalStorage() {
  localStorage.setItem("gastos", JSON.stringify(gastos));
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
    `;
    tablaBody.appendChild(tr);
  });
}

// Actualizar resumen
function actualizarResumen() {
  const totalGastado = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
  totalGastoSpan.textContent = totalGastado.toLocaleString();

  const ingreso = Number(ingresoInput.value);
  const meta = Number(metaInput.value);
  const ahorroReal = ingreso - totalGastado;
  ahorroRealSpan.textContent = ahorroReal.toLocaleString();

  cumplidaSpan.textContent = ahorroReal >= meta ? "✅" : "❌";
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

  const gasto = { fecha, categoria, monto, metodo, observaciones };
  gastos.push(gasto);
  guardarEnLocalStorage();
  renderTabla();
  actualizarResumen();
  actualizarGrafico();

  // Limpiar formulario
  fechaInput.value = "";
  montoInput.value = "";
  metodoInput.value = "";
  observacionesInput.value = "";
});

// Reiniciar
reiniciarBtn.addEventListener("click", () => {
  if (!confirm("¿Querés reiniciar todos los gastos?")) return;
  gastos = [];
  guardarEnLocalStorage();
  renderTabla();
  actualizarResumen();
  actualizarGrafico();
  alert("Gastos reiniciados");
});

// Gráfico con Chart.js
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
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Escuchar cambios ingreso y meta
ingresoInput.addEventListener("input", actualizarResumen);
metaInput.addEventListener("input", actualizarResumen);