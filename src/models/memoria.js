const TAM_PAGINA = 64; // KB

export class Marco {
  constructor(id) {
    this.id = id;
    this.libre = true;
    this.proceso = null;
    this.pagina = null;
  }
}

export class Memoria {
  constructor(tamañoTotal) {
    this.tamañoTotal = tamañoTotal;
    this.numMarcos = Math.floor(tamañoTotal / TAM_PAGINA);
    this.marcos = Array.from({ length: this.numMarcos }, (_, i) => new Marco(i));
    this.tablasPaginas = {}; // { nombreProceso: [ { pagina, marco } ] }
    this.swap = [];
  }

  asignar(proceso) {
    console.log(`Intentando asignar ${proceso.nombre} con prioridad ${proceso.prioridad}`);
    const paginasNecesarias = Math.ceil(proceso.memoria / TAM_PAGINA);
    const marcosLibres = this.marcos.filter(m => m.libre);

    if (marcosLibres.length < paginasNecesarias) {
      if (!proceso.enSwap) {
        proceso.enSwap = true;
        proceso.actualizarEstado('swapped');
        this.swap.push(proceso);
        console.log(`⚠️ Proceso ${proceso.nombre} enviado a SWAP`);
      }
      return false;
    }

    this.tablasPaginas[proceso.nombre] = [];

    for (let i = 0; i < paginasNecesarias; i++) {
      const marco = marcosLibres[i];
      marco.libre = false;
      marco.proceso = proceso;
      marco.pagina = i;
      this.tablasPaginas[proceso.nombre].push({ pagina: i, marco: marco.id });
    }

    proceso.actualizarEstado('listo');
    return true;
  }

  liberar(nombreProceso) {
    for (const marco of this.marcos) {
      if (!marco.libre && marco.proceso?.nombre === nombreProceso) {
        marco.libre = true;
        marco.proceso = null;
        marco.pagina = null;
      }
    }

    delete this.tablasPaginas[nombreProceso];
  }
}
