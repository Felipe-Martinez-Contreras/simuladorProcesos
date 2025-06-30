import { Memoria } from './models/memoria.js';
import { seleccionarSiguienteSJF } from './schedulers/sjf_temp.js';
import { seleccionarSiguienteRR } from './schedulers/rr_temp.js';

export const estadoSimulador = {
  reloj: 0,
  quantum: 5,
  enEjecucion: false,
  modoMultinivel: false,
  procesos: [],
  colaAlta: [],
  colaBaja: [],
  colaListos: [],
  procesosCPU: [null, null, null, null], // 4 núcleos
  quantumsRestantes: [0, 0, 0, 0],
  procesosTerminados: [],
  memoria: new Memoria(1024),
  historialEjecucion: [],
  algoritmo: 'SJF',
  colaPendientes: [],

};

export function tickSimulador() {
  const est = estadoSimulador;
  est.reloj++;

  // 1. Llegada de nuevos procesos
  est.procesos.forEach(p => {
    if (p.llegada <= est.reloj && p.estado === 'nuevo') {
      const asignado = est.memoria.asignar(p);
      if (!asignado && !p.enSwap) {
        est.colaPendientes.push(p);
        console.log(`⏳ Proceso ${p.nombre} en cola de espera (RAM y swap llenos)`);
      }

      if (!p.enSwap && asignado) {
        if (est.modoMultinivel) {
          (p.prioridad === 0 ? est.colaAlta : est.colaBaja).push(p);
        } else {
          est.colaListos.push(p);
        }
        p.actualizarEstado('listo');
      }
    }
  });

  // 2. Ejecutar procesos en cada núcleo
  for (let i = 0; i < 4; i++) {
    const proceso = est.procesosCPU[i];

    if (proceso) {
      proceso.tickEjecucion();

      if (est.algoritmo === 'RR' || (est.modoMultinivel && proceso.prioridad === 0)) {
        est.quantumsRestantes[i]--;
      }

      if (proceso.burstRestante === 0) {
        proceso.actualizarEstado('terminado');
        proceso.marcarFin(est.reloj);
        est.memoria.liberar(proceso.nombre);
        est.procesosTerminados.push(proceso);
        if (proceso.padre) {
          const hermanos = est.procesos.filter(p => p.padre === proceso.padre);
          const todosTerminados = hermanos.every(p => p.estado === 'terminado');
          if (todosTerminados) {
            console.log(`✅ Programa ${proceso.padre} finalizado (todos sus hijos han terminado).`);
          }
        }

        est.procesosCPU[i] = null;
      } else if ((est.algoritmo === 'RR' || (est.modoMultinivel && proceso.prioridad === 0)) && est.quantumsRestantes[i] === 0) {
        proceso.actualizarEstado('listo');
        est.colaListos.push(proceso);
        est.procesosCPU[i] = null;
      }
    }
  }

  // 3. Asignar procesos a núcleos disponibles
  for (let i = 0; i < 4; i++) {
    if (!est.procesosCPU[i]) {
      let siguiente = null;

      if (est.modoMultinivel) {
        if (est.colaAlta.length > 0) {
          siguiente = seleccionarSiguienteRR(est.colaAlta);
          est.colaAlta.shift();
          est.quantumsRestantes[i] = est.quantum;
        } else if (est.colaBaja.length > 0) {
          siguiente = seleccionarSiguienteSJF(est.colaBaja);
          est.colaBaja = est.colaBaja.filter(p => p !== siguiente);
          est.quantumsRestantes[i] = 0;
        }
      } else {
        if (est.algoritmo === 'SJF') {
          siguiente = seleccionarSiguienteSJF(est.colaListos);
          est.colaListos = est.colaListos.filter(p => p !== siguiente);
          est.quantumsRestantes[i] = 0;
        } else {
          siguiente = seleccionarSiguienteRR(est.colaListos);
          est.colaListos = est.colaListos.filter(p => p !== siguiente);
          est.quantumsRestantes[i] = est.quantum;
        }
      }

      if (siguiente) {
        siguiente.actualizarEstado('ejecutando');
        siguiente.marcarInicio(est.reloj);
        est.procesosCPU[i] = siguiente;
      }
    }
  }

  // 4. Acumular espera
  const enEspera = est.modoMultinivel
    ? [...est.colaAlta, ...est.colaBaja]
    : est.colaListos;

  enEspera.forEach(p => {
    if (!p.enSwap) {
      p.tEspera++;
    }
  });

  // 5. Timeline
  est.historialEjecucion.push({
    tiempo: est.reloj,
    procesos: est.procesosCPU.map(p => p?.nombre || 'IDLE')
  });

  for (let i = 0; i < est.colaPendientes.length; i++) {
  const proceso = est.colaPendientes[i];
  const asignado = est.memoria.asignar(proceso);
  if (asignado && !proceso.enSwap) {
    proceso.actualizarEstado('listo');
    if (est.modoMultinivel) {
      (proceso.prioridad === 0 ? est.colaAlta : est.colaBaja).push(proceso);
    } else {
      est.colaListos.push(proceso);
    }
    est.colaPendientes.splice(i, 1);
    i--;
  }
}

}
