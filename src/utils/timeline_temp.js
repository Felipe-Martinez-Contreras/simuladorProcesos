import { estadoSimulador } from '../simulador.js';

let timelineChart = null;

export function mostrarTimeline() {
  const canvas = document.getElementById('timeline-chart');
  const ctx = canvas.getContext('2d');

  // Destruir gráfico anterior si existe
  if (timelineChart) {
    timelineChart.destroy();
  }

  // === Agrupar bloques de ejecución continuos ===
  const bloques = [];
  let actual = null;

  for (let tick of estadoSimulador.historialEjecucion) {
    if (actual && actual.proceso === tick.proceso) {
      actual.fin = tick.tiempo;
    } else {
      if (actual) bloques.push(actual);
      actual = { proceso: tick.proceso, inicio: tick.tiempo, fin: tick.tiempo };
    }
  }
  if (actual) bloques.push(actual);

  // === Crear dataset para Chart.js ===
  const procesosUnicos = [...new Set(bloques.map(b => b.proceso))];

  const data = {
    labels: procesosUnicos,
    datasets: [{
      label: 'Ejecución',
      data: bloques.map(b => ({
        x: [b.inicio, b.fin + 1],
        y: b.proceso
      })),
      backgroundColor: 'rgba(33, 150, 243, 0.7)',
      borderColor: 'black',
      borderWidth: 1,
      barThickness: 20
    }]
  };

  timelineChart = new Chart(ctx, {
    type: 'bar',
    data,
    options: {
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          stacked: true,
          title: { display: true, text: 'Tiempo (ms)' }
        },
        y: {
          stacked: true,
          title: { display: true, text: 'Procesos' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Tiempo ${ctx.raw.x[0]} - ${ctx.raw.x[1] - 1}`
          }
        }
      }
    }
  });
}
