import { estadoSimulador } from '../simulador.js';

export function mostrarTablaPaginacion() {
  const contenedor = document.getElementById('tabla-paginacion');
  contenedor.innerHTML = '';

  const tabla = document.createElement('table');
  tabla.innerHTML = `
    <tr>
      <th>Proceso</th>
      <th>Página</th>
      <th>Marco</th>
      <th>Estado</th>
    </tr>
  `;

  const memoria = estadoSimulador.memoria;

  for (const [nombre, paginas] of Object.entries(memoria.tablasPaginas)) {
    paginas.forEach(({ pagina, marco }) => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${nombre}</td>
        <td>${pagina}</td>
        <td>${marco !== null ? marco : '-'}</td>
        <td>${marco !== null ? 'RAM' : 'Swap'}</td>
      `;
      tabla.appendChild(fila);
    });
  }

  contenedor.appendChild(tabla);
}
