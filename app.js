const ingresoInput = document.getElementById("ingreso");
const metaInput = document.getElementById("meta");
const totalGastoSpan = document.getElementById("totalGasto");
const ahorroRealSpan = document.getElementById("ahorroReal");
const cumplidaSpan = document.getElementById("cumplida");

const fechaInput = document.getElementById("fecha");
const categoriaInput = document.getElementById("categoria");
const montoInput = document.getElementById("monto");
const metodoInput = document.getElementById("metodo");
const observacionesInput = document.getElementById("observaciones");

const agregarBtn = document.getElementById("agregar-btn");
const reiniciarBtn = document.getElementById("reiniciar-btn");
const tbody = document.querySelector("#tablaGastos tbody");

const ctx = document.getElementById("graficoGastos");

let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
let ingreso = Number(localStorage.getItem("ingreso")) || 0;
let meta = Number(localStorage.getItem("meta")) || 0;

ingresoInput.value = ingreso;
metaInput.value = meta;

// 🎯 Funciones
function actualizarResumen() {
  const total = gastos.reduce((acc, g) => acc + g.monto, 0);
  const ahorro = ingreso - total;

  totalGastoSpan.textContent = total.toFixed(2);
  ahorroRealSpan.textContent = ahorro.toFixed(2);
  cumplidaSpan.textContent = ahorro >= meta ? "✅" : "❌";

  localStorage.setItem("ingreso", ingreso);
  localStorage.setItem("meta", meta);
}

function renderGastos() {
  tbody.innerHTML = "";
  gastos.forEach((gasto, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${gasto.fecha}</td>
      <td>${gasto.categoria}</td>
      <td>$${gasto.monto.toFixed(2)}</td>
      <td>${gasto.metodo}</td>
      <td>${gasto.observaciones || ""}</td>
      <td><button onclick="eliminarGasto(${index})">❌</button></td>
    `;

    tbody.appendChild(tr);
  });
}

function guardarGastos() {
  localStorage.setItem("gastos", JSON.stringify(gastos));
}

function eliminarGasto(index) {
  gastos.splice(index, 1);
  guardarGastos();
  renderGastos();
  actualizarResumen();
  renderGrafico();
}

function renderGrafico() {
  const categorias = {};
  gastos.forEach(g => {
    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.monto;
  });

  const labels = Object.keys(categorias);
  const data = Object.values(categorias);

  if (window.chartInstance) {
    window.chartInstance.destroy();
  }

  window.chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        label: "Gastos por categoría",
        data,
        backgroundColor: [
          "#0077cc", "#00b894", "#fdcb6e", "#d63031", "#6c5ce7",
          "#e17055", "#00cec9", "#fab1a0"
        ],
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

// 🚀 Eventos
agregarBtn.addEventListener("click", () => {
  const gasto = {
    fecha: fechaInput.value,
    categoria: categoriaInput.value,
    monto: parseFloat(montoInput.value),
    metodo: metodoInput.value,
    observaciones: observacionesInput.value,
  };

  if (!gasto.fecha || !gasto.categoria || isNaN(gasto.monto) || gasto.monto <= 0) {
    alert("Por favor, completá los campos obligatorios.");
    return;
  }

  gastos.push(gasto);
  guardarGastos();
  renderGastos();
  actualizarResumen();
  renderGrafico();

  // Reset
  fechaInput.value = "";
  montoInput.value = "";
  metodoInput.value = "";
  observacionesInput.value = "";
});

ingresoInput.addEventListener("input", () => {
  ingreso = Number(ingresoInput.value);
  actualizarResumen();
});

metaInput.addEventListener("input", () => {
  meta = Number(metaInput.value);
  actualizarResumen();
});

reiniciarBtn.addEventListener("click", () => {
  if (confirm("¿Seguro que querés borrar todos los gastos?")) {
    gastos = [];
    guardarGastos();
    renderGastos();
    actualizarResumen();
    renderGrafico();
  }
});

// 🔄 Inicializar
renderGastos();
actualizarResumen();
renderGrafico();