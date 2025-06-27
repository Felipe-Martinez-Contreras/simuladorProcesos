export default class Proceso {
  constructor(nombre, llegada, burst, memoria, prioridad) {
    this.nombre = nombre;
    this.llegada = llegada;
    this.burst = burst;
    this.burstRestante = burst;
    this.memoria = memoria;
    this.prioridad = prioridad; 

    this.estado = 'nuevo'; 

    this.tInicio = null;
    this.tFin = null;
    this.tEspera = 0;
    this.tRespuesta = null;
    this.tRetorno = null;

    this.enSwap = false;
  }

  actualizarEstado(nuevoEstado) {
    this.estado = nuevoEstado;
  }

  marcarInicio(reloj) {
    if (this.tInicio === null) {
      this.tInicio = reloj;
      this.tRespuesta = this.tInicio - this.llegada;
    }
  }

  marcarFin(reloj) {
    this.tFin = reloj;
    this.tRetorno = this.tFin - this.llegada;
  }

  tickEjecucion() {
    if (this.burstRestante > 0) {
      this.burstRestante--;
    }
  }
}

