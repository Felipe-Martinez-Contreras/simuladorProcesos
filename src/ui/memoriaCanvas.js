export function dibujarMemoria(memoria) {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const anchoCanvas = canvas.width;
  const altoCanvas = canvas.height;

  ctx.clearRect(0, 0, anchoCanvas, altoCanvas);

  const total = memoria.tamañoTotal;

  let posX = 0;

  memoria.bloques.forEach(bloque => {
    const anchoBloque = (bloque.tamaño / total) * anchoCanvas;

    // Color por estado
    ctx.fillStyle = bloque.libre ? '#e0e0e0' : '#2196f3';
    ctx.fillRect(posX, 10, anchoBloque, altoCanvas - 20);

    // Borde
    ctx.strokeStyle = '#000';
    ctx.strokeRect(posX, 10, anchoBloque, altoCanvas - 20);

    // Texto
    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.fillText(
      bloque.libre ? 'Libre' : bloque.proceso.nombre,
      posX + 5,
      altoCanvas / 2
    );

    posX += anchoBloque;
  });
}
