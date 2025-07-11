
import { estadoSimulador, tickSimulador } from '../simulador.js';
import Proceso from '../models/proceso.js';
import { dibujarMemoria } from './memoriaCanvas.js';
import { mostrarMetricas } from '../utils/metrics.js';
import { mostrarTimeline } from '../utils/timeline_temp.js';
import { compararAlgoritmos, graficarComparacion } from '../utils/comparacion.js';
import { animarProcesoEnEjecucion, animarEntradaProceso } from './animaciones.js';
import { mostrarTablaPaginacion } from '../utils/paginacion.js';

let intervalo = null;
const TAM_MAXIMO_BLOQUE = 256; // KB

// === Manejo del toggle de planificación multinivel ===
const toggle = document.getElementById('multilevel-checkbox');
const priorityContainer = document.getElementById('priority-container');

if (toggle && priorityContainer) {
    estadoSimulador.modoMultinivel = toggle.checked;

    toggle.addEventListener('change', (e) => {
        const activado = e.target.checked;
        priorityContainer.style.display = activado ? 'block' : 'none';
        estadoSimulador.modoMultinivel = activado;
        console.log('🔀 Modo multinivel:', activado);
    });

    priorityContainer.style.display = toggle.checked ? 'block' : 'none';
}

document.getElementById('process-form').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('✅ Evento submit disparado');

    const nombre = document.getElementById('name').value;
    const llegada = parseInt(document.getElementById('arrival').value);
    const burst = parseInt(document.getElementById('burst').value);
    const memoria = parseInt(document.getElementById('memory').value);
    const prioridad = parseInt(document.getElementById('priority').value);

    if (memoria > TAM_MAXIMO_BLOQUE) {
        const cantidadHijos = Math.ceil(memoria / TAM_MAXIMO_BLOQUE);
        const tamañoHijo = Math.ceil(memoria / cantidadHijos);
        const burstPorHijo = Math.ceil(burst / cantidadHijos);


        for (let i = 0; i < cantidadHijos; i++) {
            const hijo = new Proceso(`${nombre}_H${i + 1}`, llegada, burstPorHijo, tamañoHijo, prioridad);
            hijo.padre = nombre;
            estadoSimulador.procesos.push(hijo);
        }

        console.log(`🔧 Proceso grande dividido en ${cantidadHijos} hijos.`);
    } else {
        const nuevo = new Proceso(nombre, llegada, burst, memoria, prioridad);
        estadoSimulador.procesos.push(nuevo);
    }

    renderizarProcesos();
    dibujarMemoria(estadoSimulador.memoria);
    document.getElementById('process-form').reset();
});

document.getElementById('algo').addEventListener('change', (e) => {
  const algoritmoSeleccionado = e.target.value;
  estadoSimulador.algoritmo = algoritmoSeleccionado;

  // Mostrar u ocultar el campo de quantum
  const quantumContainer = document.getElementById('quantum-container');
  quantumContainer.style.display = algoritmoSeleccionado === 'RR' ? 'block' : 'none';

  actualizarStatusBar();
});



document.getElementById('quantum').addEventListener('input', (e) => {
    estadoSimulador.quantum = parseInt(e.target.value);
    console.log('🔁 Quantum actualizado a:', estadoSimulador.quantum);
});


document.getElementById('start-btn').addEventListener('click', () => {
    if (intervalo) return;
    estadoSimulador.enEjecucion = true;
    intervalo = setInterval(() => {
        tickSimulador();
        actualizarStatusBar();
    }, 500);
    actualizarStatusBar();
});

document.getElementById('step-btn').addEventListener('click', () => {
    tickSimulador();
    actualizarStatusBar();
});

document.getElementById('stop-btn').addEventListener('click', () => {
    estadoSimulador.enEjecucion = false;
    clearInterval(intervalo);
    intervalo = null;
    actualizarStatusBar();
});

document.getElementById('reset-btn').addEventListener('click', () => {
    location.reload();
});

function actualizarStatusBar() {
    document.getElementById('current-time').textContent = estadoSimulador.reloj;
    document.getElementById('current-algo').textContent = estadoSimulador.algoritmo;
    document.getElementById('sim-status').textContent = estadoSimulador.enEjecucion ? 'En ejecución' : 'Detenido';
    renderizarProcesos();
    dibujarMemoria(estadoSimulador.memoria);
}

export function renderizarProcesos() {
  const newList = document.getElementById('new-list');
  const readyList = document.getElementById('ready-list');
  const ramList = document.getElementById('process-list'); // RAM general
  const swapList = document.getElementById('swap-ul');
  const cpuList = document.getElementById('cpu-list');
  const waitingList = document.getElementById('waiting-ul');



  newList.innerHTML = '';
  readyList.innerHTML = '';
  ramList.innerHTML = '';
  swapList.innerHTML = '';
  cpuList.innerHTML = '';
  waitingList.innerHTML = '';


  estadoSimulador.procesos.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.padre ? '↳ ' : ''}${p.nombre} (${p.estado})`;
    li.classList.add(`estado-${p.estado}`);
    li.title = p.padre ? `Hijo de: ${p.padre}` : '';

    if (p.estado === 'ejecutando') {
      animarProcesoEnEjecucion(li);
    } else {
      animarEntradaProceso(li);
    }

    if (p.enSwap) {
      swapList.appendChild(li);
    } else if (p.estado === 'nuevo') {
      newList.appendChild(li);
    } else if (p.estado === 'listo') {
      readyList.appendChild(li);
    } else if (p.estado === 'terminado') {
      ramList.appendChild(li); // Opcional: mostrar terminados
    }
  });

  estadoSimulador.procesosCPU.forEach((p, i) => {
    const li = document.createElement('li');
    li.textContent = p ? `Núcleo ${i + 1}: ${p.nombre} (${p.estado})` : `Núcleo ${i + 1}: IDLE`;
    li.classList.add(p ? `estado-${p.estado}` : 'estado-idle');
    cpuList.appendChild(li);
  });

  
  estadoSimulador.procesosBloqueados.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.nombre} (esperando)`;
    li.classList.add('estado-esperando');
    waitingList.appendChild(li);
  });


}



document.getElementById('show-metrics-btn').addEventListener('click', () => {
    mostrarMetricas();
});

document.querySelector('.tab[data-tab="timeline"]').addEventListener('click', () => {
    mostrarTimeline();
});

document.querySelector('.tab[data-tab="paginacion"]').addEventListener('click', () => {
  mostrarTablaPaginacion();
});


document.getElementById('compare-runs-btn').addEventListener('click', () => {
    estadoSimulador.procesos.forEach(p => delete p.quantumUsado);
    const procesos = estadoSimulador.procesos.map(p => ({
        nombre: p.nombre,
        llegada: p.llegada,
        burst: p.burst,
        memoria: p.memoria
    }));

    const resultados = compararAlgoritmos(procesos);
    graficarComparacion(resultados);

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab[data-tab="metrics"]').classList.add('active');
    document.getElementById('metrics').classList.add('active');
});
