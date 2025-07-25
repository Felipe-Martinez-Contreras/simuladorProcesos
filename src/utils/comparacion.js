
import Proceso from '../models/proceso.js';
import { Memoria } from '../models/memoria.js';
import { seleccionarSiguienteSJF } from '../schedulers/sjf_temp.js';
import { seleccionarSiguienteRR } from '../schedulers/rr_temp.js';

function simular(procesosOriginales, algoritmo, quantum = 4) {
  const procesos = procesosOriginales.map(p =>
    new Proceso(p.nombre, p.llegada, p.burst, p.memoria, p.prioridad ?? 0)
  );

  const memoria = new Memoria(1024);
  const terminados = [];
  let reloj = 0;
  let colaListos = [];
  let actual = null;
  let quantumRestante = quantum;

  while (terminados.length < procesos.length) {
    // Llegada: solo se asignan, no se ejecutan aún
    procesos.forEach(p => {
      if (p.llegada === reloj && p.estado === 'nuevo') {
        const asignado = memoria.asignar(p);
        if (!p.enSwap && asignado) {
          p.actualizarEstado('listo');
          colaListos.push(p);
        }
      }
    });

    // Tick de ejecución
    if (actual) {
      actual.tickEjecucion();
      if (algoritmo === 'RR') quantumRestante--;

      if (actual.burstRestante === 0) {
        actual.actualizarEstado('terminado');
        actual.marcarFin(reloj);
        memoria.liberar(actual.nombre);
        terminados.push(actual);
        actual = null;
        quantumRestante = quantum;
      } else if (algoritmo === 'RR' && quantumRestante === 0) {
        actual.actualizarEstado('listo');
        colaListos.push(actual);
        actual = null;
        quantumRestante = quantum;
      }
    }

    // Cambio de contexto (solo si no hay proceso actual)
    if (!actual) {
      actual = (algoritmo === 'SJF')
        ? seleccionarSiguienteSJF(colaListos)
        : seleccionarSiguienteRR(colaListos);

      if (actual) {
        colaListos = colaListos.filter(p => p !== actual);
        actual.actualizarEstado('ejecutando');
        actual.marcarInicio(reloj);
        if (algoritmo === 'RR') quantumRestante = quantum;
      }
    }

    // Acumular espera
    colaListos.forEach(p => {
      if (!p.enSwap) p.tEspera++;
    });

    reloj++;
  }

  // Promedios
  const n = terminados.length;
  const totalEspera = terminados.reduce((acc, p) => acc + p.tEspera, 0);
  const totalRespuesta = terminados.reduce((acc, p) => acc + p.tRespuesta, 0);
  const totalRetorno = terminados.reduce((acc, p) => acc + p.tRetorno, 0);

  return {
    algoritmo,
    espera: +(totalEspera / n).toFixed(2),
    respuesta: +(totalRespuesta / n).toFixed(2),
    retorno: +(totalRetorno / n).toFixed(2)
  };
}

export function compararAlgoritmos(procesos) {
  const resultadoSJF = simular(procesos, 'SJF');
  const resultadoRR = simular(procesos, 'RR', 4);
  return [resultadoSJF, resultadoRR];
}

export function graficarComparacion(resultados) {
  const ctx = document.getElementById('metrics-chart').getContext('2d');

  const data = {
    labels: ['Espera', 'Respuesta', 'Retorno'],
    datasets: resultados.map(r => ({
      label: r.algoritmo,
      data: [r.espera, r.respuesta, r.retorno],
      backgroundColor: r.algoritmo === 'SJF' ? 'rgba(33,150,243,0.7)' : 'rgba(76,175,80,0.7)'
    }))
  };

  new Chart(ctx, {
    type: 'bar',
    data,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Comparación de Métricas Promedio'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
