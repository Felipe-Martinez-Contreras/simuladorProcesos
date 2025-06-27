export function animarProcesoEnEjecucion(elemento) {
  elemento.classList.add('pulse-animation');
  setTimeout(() => elemento.classList.remove('pulse-animation'), 800);
}

export function animarEntradaProceso(elemento) {
  elemento.classList.add('slide-in');
  setTimeout(() => elemento.classList.remove('slide-in'), 400);
}
