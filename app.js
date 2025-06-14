const tabla = document.querySelector("#tablaGastos tbody");
let gastos = JSON.parse(localStorage.getItem("gastos") || "[]");

function guardarIngresoYMeta() {
  localStorage.setItem("ingreso", document.getElementById("ingreso").value);
  localStorage.setItem("meta", document.getElementById("meta").value);
}

function cargarIngresoYMeta() {
  const ingresoGuardado = localStorage.getItem("ingreso");
  const metaGuardada = localStorage.getItem("meta");
  if (ingresoGuardado) document.getElementById("ingreso").value = ingresoGuardado;
  if (metaGuardada) document.getElementById("meta").value = metaGuardada;
}

function agregarGasto() {
  const gasto = {
    fecha: document.getElementById("fecha").value,
    categoria: document.getElementById("categoria").value,
    monto: parseFloat(document.getElementById("monto").value),
    metodo: document.getElementById("metodo").value,
    obs: document.getElementById("observaciones").value,
  };
  if (!gasto.fecha || isNaN(gasto.monto)) return alert("Datos incompletos");
  gastos.push(gasto);
  localStorage.setItem("gastos", JSON.stringify(gastos));
  render();
}
function reiniciarDatos() {
  if (confirm("¿Estás seguro de que querés borrar todos los datos? Esta acción no se puede deshacer.")) {
    localStorage.clear();
    location.reload();
  }
}
function render() {
  tabla.innerHTML = "";
  let total = 0;
  const categorias = {};
  gastos.forEach(g => {
    tabla.innerHTML += `<tr><td>${g.fecha}</td><td>${g.categoria}</td><td>$${g.monto}</td><td>${g.metodo}</td><td>${g.obs}</td></tr>`;
    total += g.monto;
    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.monto;
  });
  document.getElementById("totalGasto").innerText = total.toFixed(2);

  const ingreso = parseFloat(document.getElementById("ingreso").value);
  const meta = parseFloat(document.getElementById("meta").value);
  const ahorro = ingreso - total;
  document.getElementById("ahorroReal").innerText = ahorro.toFixed(2);
  document.getElementById("cumplida").innerText = ahorro >= meta ? "✅" : "❌";

  const ctx = document.getElementById('graficoGastos').getContext('2d');
  if (window.pieChart) window.pieChart.destroy();
  window.pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(categorias),
      datasets: [{
        data: Object.values(categorias),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#66D4A3", "#DD4444"]
      }]
    }
  });
}

// Guardar ingreso y meta cuando cambian
document.getElementById("ingreso").addEventListener("input", guardarIngresoYMeta);
document.getElementById("meta").addEventListener("input", guardarIngresoYMeta);

// Al cargar la página
cargarIngresoYMeta();
render();