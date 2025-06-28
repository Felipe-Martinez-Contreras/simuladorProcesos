import { estadoSimulador } from '../simulador.js';

let timelineChart = null;

export function mostrarTimeline() {
  const canvas = document.getElementById('timeline-chart');
  const ctx = canvas.getContext('2d');

  // Destruir gráfico anterior si existe
  if (timelineChart) {
    timelineChart.destroy();
  }

  // === Agrupar bloques de ejecución por núcleo ===
  const bloquesPorNucleo = [[], [], [], []]; // 4 núcleos

  for (let i = 0; i < 4; i++) {
    let actual = null;
    for (let tick of estadoSimulador.historialEjecucion) {
      const proceso = tick.procesos[i];
      if (actual && actual.proceso === proceso) {
        actual.fin = tick.tiempo;
      } else {
        if (actual) bloquesPorNucleo[i].push(actual);
        actual = { proceso, inicio: tick.tiempo, fin: tick.tiempo };
      }
    }
    if (actual) bloquesPorNucleo[i].push(actual);
  }

  // === Crear datasets para Chart.js ===
  const datasets = [];

  bloquesPorNucleo.forEach((bloques, i) => {
    datasets.push({
      label: `Núcleo ${i + 1}`,
      data: bloques.map(b => ({
        x: [b.inicio, b.fin + 1],
        y: `Núcleo ${i + 1}: ${b.proceso}`
      })),
      backgroundColor: `rgba(${50 + i * 50}, ${150 - i * 30}, 243, 0.7)`,
      borderColor: 'black',
      borderWidth: 1,
      barThickness: 20
    });
  });

  const labels = [...new Set(datasets.flatMap(d => d.data.map(p => p.y)))];

  timelineChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets
    },
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
          title: { display: true, text: 'Núcleo / Proceso' }
        }
      },
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: ctx => `Tiempo ${ctx.raw.x[0]} - ${ctx.raw.x[1] - 1}`
          }
        }
      }
    }
  });
}