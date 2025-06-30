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
  procesosBloqueados: [],

};

export function tickSimulador() {
  const est = estadoSimulador;
  est.reloj++;

  // 1. Llegada de nuevos procesos
  est.procesos.forEach(p => {
    if (p.llegada <= est.reloj && p.estado === 'nuevo') {

      const asignado = est.memoria.asignar(p);
      if (!asignado && !p.enSwap && !est.colaPendientes.includes(p)) {
        est.colaPendientes.push(p);
        console.log(`⏳ Proceso ${p.nombre} en cola de espera (RAM y swap llenos)`);
      }

      if (!p.enSwap && asignado) {
        p.actualizarEstado('listo');
        p.recienLlegado = true;
        if (est.modoMultinivel) {
          (p.prioridad === 0 ? est.colaAlta : est.colaBaja).push(p);
        } else {
          est.colaListos.push(p);
        }
      }
    }
  });

  // 2. Ejecutar procesos en cada núcleo
  for (let i = 0; i < 4; i++) {
    const proceso = est.procesosCPU[i];

    if (proceso) {
      proceso.tickEjecucion();

      if (Math.random() < 0.05) {
        proceso.actualizarEstado('esperando');
        proceso.tiempoBloqueado = 3;
        est.procesosBloqueados.push(proceso);
        est.procesosCPU[i] = null;
        continue;
      }

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

  // 3. Procesos bloqueados
  for (let i = est.procesosBloqueados.length - 1; i >= 0; i--) {
    const p = est.procesosBloqueados[i];
    p.tiempoBloqueado--;
    if (p.tiempoBloqueado <= 0) {
      p.actualizarEstado('listo');
      if (est.modoMultinivel) {
        (p.prioridad === 0 ? est.colaAlta : est.colaBaja).push(p);
      } else {
        est.colaListos.push(p);
      }
      est.procesosBloqueados.splice(i, 1);
    }
  }

  // 4. Asignar procesos a núcleos disponibles
  for (let i = 0; i < 4; i++) {
    if (!est.procesosCPU[i]) {
      let siguiente = null;

      if (est.modoMultinivel) {
        const alta = est.colaAlta.filter(p => !p.recienLlegado);
        const baja = est.colaBaja.filter(p => !p.recienLlegado);
        if (alta.length > 0) {
          siguiente = seleccionarSiguienteRR(alta);
          est.colaAlta = est.colaAlta.filter(p => p !== siguiente);
          est.quantumsRestantes[i] = est.quantum;
        } else if (baja.length > 0) {
          siguiente = seleccionarSiguienteSJF(baja);
          est.colaBaja = est.colaBaja.filter(p => p !== siguiente);
          est.quantumsRestantes[i] = 0;
        }
      } else {
        const listos = est.colaListos.filter(p => !p.recienLlegado);
        if (est.algoritmo === 'SJF') {
          siguiente = seleccionarSiguienteSJF(listos);
          est.colaListos = est.colaListos.filter(p => p !== siguiente);
          est.quantumsRestantes[i] = 0;
        } else {
          siguiente = seleccionarSiguienteRR(listos);
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

  // 5. Acumular espera
  const enEspera = est.modoMultinivel
    ? [...est.colaAlta, ...est.colaBaja]
    : est.colaListos;

  enEspera.forEach(p => {
    if (!p.enSwap) {
      p.tEspera++;
    }
  });

  // 6. Timeline
  est.historialEjecucion.push({
    tiempo: est.reloj,
    procesos: est.procesosCPU.map(p => p?.nombre || 'IDLE')
  });

  // 7. Intentar cargar procesos desde la cola de espera externa
  for (let i = 0; i < est.colaPendientes.length; i++) {
    const proceso = est.colaPendientes[i];
    const asignado = est.memoria.asignar(proceso);
    if (asignado && !proceso.enSwap) {
      proceso.actualizarEstado('listo');
      proceso.recienLlegado = true;
      if (est.modoMultinivel) {
        (proceso.prioridad === 0 ? est.colaAlta : est.colaBaja).push(proceso);
      } else {
        est.colaListos.push(proceso);
      }
      est.colaPendientes.splice(i, 1);
      i--;
    }
  }

  // 8. Intentar recuperar procesos desde SWAP automáticamente
  for (let i = 0; i < est.memoria.swap.length; i++) {
    const proceso = est.memoria.swap[i];
    const asignado = est.memoria.asignar(proceso);
    if (asignado) {
      proceso.enSwap = false;
      proceso.actualizarEstado('listo');
      proceso.recienLlegado = true;
      if (est.modoMultinivel) {
        (proceso.prioridad === 0 ? est.colaAlta : est.colaBaja).push(proceso);
      } else {
        est.colaListos.push(proceso);
      }
      est.memoria.swap.splice(i, 1);
      i--;
    }
  }

  // 9. Limpiar marca de recienLlegado
  est.procesos.forEach(p => {
    if (p.recienLlegado) {
      delete p.recienLlegado;
    }
  });
}
