const CLAVE = 'helanorte:orden_actual_clientes';

/**
 * Guarda el orden EXACTO en que se están mostrando los clientes en la
 * lista (ya filtrados/ordenados/agrupados), para que la ficha de detalle
 * pueda ofrecer "Siguiente"/"Anterior" respetando ese mismo orden.
 * Se usa sessionStorage (no localStorage) porque es información de
 * navegación efímera, no una preferencia que deba durar para siempre.
 */
export function guardarOrdenActual(codigos: string[]): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(codigos));
  } catch {
    /* no crítico */
  }
}

export function leerOrdenActual(): string[] {
  try {
    const raw = sessionStorage.getItem(CLAVE);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
