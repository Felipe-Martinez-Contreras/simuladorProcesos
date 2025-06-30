export class Bloque {
    constructor(inicio, tamaño, libre = true, proceso = null) {
        this.inicio = inicio;
        this.tamaño = tamaño;
        this.libre = libre;
        this.proceso = proceso;
    }
}

export class Memoria {
    constructor(tamañoTotal) {
        this.tamañoTotal = tamañoTotal;
        this.bloques = [new Bloque(0, tamañoTotal)];
        this.swap = [];
        this.tamañoSwap = 1024; // KB
    }

    usoSwap() {
        return this.swap.reduce((acc, p) => acc + p.memoria, 0);
    }

    asignar(proceso) {
        console.log(`Intentando asignar ${proceso.nombre} con prioridad ${proceso.prioridad}`);
        const tamaño = proceso.memoria;

        for (let i = 0; i < this.bloques.length; i++) {
            const bloque = this.bloques[i];
            if (bloque.libre && bloque.tamaño >= tamaño) {
                const nuevoBloque = new Bloque(bloque.inicio, tamaño, false, proceso);
                const sobrante = bloque.tamaño - tamaño;

                // Reemplaza el bloque actual por uno usado y otro libre (si sobra)
                this.bloques.splice(i, 1, nuevoBloque);
                if (sobrante > 0) {
                    this.bloques.splice(i + 1, 0, new Bloque(bloque.inicio + tamaño, sobrante));
                }

                proceso.actualizarEstado('listo');
                return true;
            }
        }

        // No hay espacio en RAM, intentar swap si hay espacio disponible
        if (!proceso.enSwap && this.usoSwap() + tamaño <= this.tamañoSwap) {
            proceso.enSwap = true;
            proceso.actualizarEstado('swapped');
            this.swap.push(proceso);
            console.log(`⚠️ Proceso ${proceso.nombre} enviado a SWAP`);
            return false;
        }

        // No hay espacio en RAM ni en swap
        console.log(`❌ Proceso ${proceso.nombre} no cabe en RAM ni en swap. Debe ir a cola de espera.`);
        return false;
    }

    liberar(nombreProceso) {
        for (let i = 0; i < this.bloques.length; i++) {
            const bloque = this.bloques[i];
            if (!bloque.libre && bloque.proceso?.nombre === nombreProceso) {
                bloque.libre = true;
                bloque.proceso = null;

                this.coalescer();
                break;
            }
        }
    }

    coalescer() {
        for (let i = 0; i < this.bloques.length - 1; i++) {
            const actual = this.bloques[i];
            const siguiente = this.bloques[i + 1];

            if (actual.libre && siguiente.libre) {
                actual.tamaño += siguiente.tamaño;
                this.bloques.splice(i + 1, 1);
                i--;
            }
        }
    }
}
