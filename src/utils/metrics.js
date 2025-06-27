import { estadoSimulador } from '../simulador.js';

export function mostrarMetricas() {
    console.log('Terminados:', estadoSimulador.procesosTerminados);
    const procesos = estadoSimulador.procesosTerminados;
    const container = document.getElementById('metrics-table');
    container.innerHTML = '';

    if (procesos.length === 0) {
        container.innerHTML = '<p>No hay procesos finalizados para mostrar métricas.</p>';
        return;
    }

    let totalEspera = 0;
    let totalRespuesta = 0;
    let totalRetorno = 0;

    // Tabla de detalle
    const tabla = document.createElement('table');
    tabla.style.width = '100%';
    tabla.style.borderCollapse = 'collapse';
    tabla.style.marginBottom = '20px';

    const encabezado = document.createElement('tr');
    ['Proceso', 'T. Llegada', 'T. Inicio', 'T. Fin', 'T. Respuesta', 'T. Espera', 'T. Retorno'].forEach(texto => {
        const th = document.createElement('th');
        th.textContent = texto;
        th.style.borderBottom = '2px solid #ddd';
        th.style.padding = '8px';
        th.style.textAlign = 'center';
        encabezado.appendChild(th);
    });
    tabla.appendChild(encabezado);

    procesos.forEach(p => {
        totalEspera += p.tEspera || 0;
        totalRespuesta += p.tRespuesta || 0;
        totalRetorno += p.tRetorno || 0;

        const fila = document.createElement('tr');
        [
            p.nombre,
            p.llegada,
            p.tInicio ?? '-',
            p.tFin ?? '-',
            p.tRespuesta ?? '-',
            p.tEspera ?? '-',
            p.tRetorno ?? '-'
        ].forEach(valor => {
            const td = document.createElement('td');
            td.textContent = valor;
            td.style.padding = '6px';
            td.style.textAlign = 'center';
            fila.appendChild(td);
        });
        tabla.appendChild(fila);
    });

    const promedioEspera = (totalEspera / procesos.length).toFixed(2);
    const promedioRespuesta = (totalRespuesta / procesos.length).toFixed(2);
    const promedioRetorno = (totalRetorno / procesos.length).toFixed(2);

    const resumen = document.createElement('div');
    resumen.innerHTML = `
    <h4>Promedios:</h4>
    <p><strong>Espera:</strong> ${promedioEspera} ms</p>
    <p><strong>Respuesta:</strong> ${promedioRespuesta} ms</p>
    <p><strong>Retorno:</strong> ${promedioRetorno} ms</p>
  `;

    container.appendChild(tabla);
    container.appendChild(resumen);
}
