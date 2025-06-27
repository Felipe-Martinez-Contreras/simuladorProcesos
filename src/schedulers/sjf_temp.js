export function seleccionarSiguienteSJF(colaListos) {
  if (colaListos.length === 0) return null;
  
  // Ordena la cola por burst restante y retorna el primero
  const ordenada = [...colaListos].sort((a, b) => a.burstRestante - b.burstRestante);
  return ordenada[0];
}
