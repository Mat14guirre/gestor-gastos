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

// Función para renderizar tabla
function renderTabla() {
  tablaBody.innerHTML = "";
  gastos.forEach(gasto => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${gasto.fecha}</td>
      <td>${gasto.categoria}</td>
      <td>$${gasto.monto}</td>
      <td>${gasto.metodo}</td>
      <td>${gasto.observaciones}</td>
      <td>${gasto.usuarioNombre}</td>
    `;

    tablaBody.appendChild(tr);
  });
}

// Calcular totales y actualizar resumen
function actualizarResumen() {
  const totalGastado = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
  totalGastoSpan.textContent = totalGastado.toLocaleString();

  const ingreso = Number(ingresoInput.value);
  const meta = Number(metaInput.value);
  const ahorroReal = ingreso - totalGastado;
  ahorroRealSpan.textContent = ahorroReal.toLocaleString();

  cumplidaSpan.textContent = ahorroReal >= meta ? "✅" : "❌";
}

// Guardar gasto en Firestore
function guardarGastoFirestore(gasto) {
  if (!window.usuarioActivo) {
    alert("Debes iniciar sesión para agregar gastos");
    return;
  }
  db.collection("gastos").add(gasto)
    .then(() => {
      console.log("Gasto guardado en Firestore");
    })
    .catch((error) => {
      console.error("Error guardando gasto:", error);
      alert("Error guardando gasto: " + error.message);
    });
}

// Cargar gastos de Firestore para usuario activo
function cargarGastosFirestore() {
  if (!window.usuarioActivo) return;

  db.collection("gastos")
    .where("usuarioUid", "==", window.usuarioActivo.uid)
    .orderBy("fecha", "desc")
    .onSnapshot((querySnapshot) => {
      gastos = [];
      querySnapshot.forEach((doc) => {
        gastos.push(doc.data());
      });
      renderTabla();
      actualizarResumen();
      actualizarGrafico();
    });
}

// Función para agregar gasto desde formulario
agregarBtn.addEventListener("click", () => {
  if (!window.usuarioActivo) {
    alert("Debes iniciar sesión para agregar gastos");
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
    usuarioUid: window.usuarioActivo.uid,
    usuarioNombre: window.usuarioActivo.nombre
  };

  gastos.push(gasto);
  renderTabla();
  actualizarResumen();
  guardarGastoFirestore(gasto);

  // Limpiar formulario
  fechaInput.value = "";
  montoInput.value = "";
  metodoInput.value = "";
  observacionesInput.value = "";
});

// Reiniciar gastos
reiniciarBtn.addEventListener("click", () => {
  if (!window.usuarioActivo) {
    alert("Debes iniciar sesión para reiniciar");
    return;
  }
  // Confirmar
  if (!confirm("¿Querés reiniciar todos los gastos para un nuevo mes?")) return;

  // Borrar en Firestore todos los gastos del usuario
  db.collection("gastos")
    .where("usuarioUid", "==", window.usuarioActivo.uid)
    .get()
    .then((querySnapshot) => {
      const batch = db.batch();
      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      return batch.commit();
    })
    .then(() => {
      gastos = [];
      renderTabla();
      actualizarResumen();
      actualizarGrafico();
      alert("Gastos reiniciados");
    })
    .catch((error) => {
      console.error("Error reiniciando gastos:", error);
      alert("Error reiniciando gastos: " + error.message);
    });
});

// GRAFICO CON CHART.JS
const ctx = document.getElementById("graficoGastos").getContext("2d");
let chart;

function actualizarGrafico() {
  // Agrupar gastos por categoría
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
        legend: {
          position: 'bottom',
        }
      }
    }
  });
}

// Actualizar gráfico si cambian ingresos o meta
ingresoInput.addEventListener("change", actualizarResumen);
metaInput.addEventListener("change", actualizarResumen);

// Cargar gastos al iniciar sesión
document.addEventListener("DOMContentLoaded", () => {
  // Espera que usuarioActivo esté definido por login.js
  const checkUserInterval = setInterval(() => {
    if (window.usuarioActivo !== undefined) {
      clearInterval(checkUserInterval);
      if (window.usuarioActivo) {
        cargarGastosFirestore();
      }
    }
  }, 200);
});