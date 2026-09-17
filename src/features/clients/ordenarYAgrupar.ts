import type { ClienteConSalud } from './useClientesConSalud';
import { diasDesde } from '../../utils/formato';

export type CriterioOrden =
  | 'salud'
  | 'nombre'
  | 'codigo'
  | 'acumulado'
  | 'ultima_compra'
  | 'objetivo'
  | 'pct_cuota';

export type CriterioAgrupacion =
  | 'ninguno'
  | 'salud'
  | 'canal'
  | 'negocio'
  | 'ruta'
  | 'direccion';

const ORDEN_NIVEL_SALUD: Record<string, number> = {
  malo: 0,
  regular: 1,
  sin_datos: 2,
  bueno: 3,
};

export function ordenarClientes(
  lista: ClienteConSalud[],
  criterio: CriterioOrden,
  ascendente: boolean
): ClienteConSalud[] {
  const copia = [...lista];

  copia.sort((a, b) => {
    let comparacion = 0;
    switch (criterio) {
      case 'salud':
        comparacion = ORDEN_NIVEL_SALUD[a.salud.nivel] - ORDEN_NIVEL_SALUD[b.salud.nivel];
        break;
      case 'nombre':
        comparacion = (a.cliente.nombre ?? '').localeCompare(b.cliente.nombre ?? '');
        break;
      case 'codigo':
        comparacion = (a.cliente.codigo ?? '').localeCompare(b.cliente.codigo ?? '');
        break;
      case 'acumulado':
        comparacion = (a.cliente.acu_mes ?? -1) - (b.cliente.acu_mes ?? -1);
        break;
      case 'ultima_compra': {
        const diasA = diasDesde(a.cliente.ucm_fecha) ?? Number.POSITIVE_INFINITY;
        const diasB = diasDesde(b.cliente.ucm_fecha) ?? Number.POSITIVE_INFINITY;
        comparacion = diasA - diasB;
        break;
      }
      case 'objetivo': {
        const pctA = calcularPorcentajeObjetivo(a);
        const pctB = calcularPorcentajeObjetivo(b);
        comparacion = pctA - pctB;
        break;
      }
      case 'pct_cuota': {
        const pctA = a.pctCuota ?? -1;
        const pctB = b.pctCuota ?? -1;
        comparacion = pctA - pctB;
        break;
      }
    }
    return ascendente ? comparacion : -comparacion;
  });

  return copia;
}

function calcularPorcentajeObjetivo(item: ClienteConSalud): number {
  const { acu_mes, obj_pdv } = item.cliente;
  if (acu_mes == null || obj_pdv == null || obj_pdv === 0) return -1;
  return acu_mes / obj_pdv;
}

export interface GrupoClientes {
  clave: string;
  etiqueta: string;
  items: ClienteConSalud[];
}

const ETIQUETA_SALUD: Record<string, string> = {
  malo: 'Necesitan atención',
  regular: 'Regular',
  bueno: 'Bien',
  sin_datos: 'Sin datos suficientes',
};

// Palabras genéricas que aparecen en casi cualquier dirección y no ayudan
// a identificar "la misma calle/zona" (prefijos de tipo de vía, etc).
const PALABRAS_GENERICAS = new Set([
  'CA', 'CALLE', 'JR', 'JIRON', 'AV', 'AVENIDA', 'MZ', 'MANZANA', 'LT', 'LOTE',
  'AAHH', 'CAS', 'CASERIO', 'URB', 'URBANIZACION', 'PPJJ', 'PSJE', 'PASAJE',
  'REF', 'SD', 'ETAPA', 'PIURA', 'CASTILLA', 'LT.', 'INT',
]);

/**
 * Reduce una dirección a una "clave" aproximada para agrupar clientes de
 * la misma zona/calle. Es una heurística simple (quita tildes, números,
 * palabras genéricas de tipo de vía, y se queda con las 2 palabras más
 * distintivas) — no es una geolocalización real, así que agrupa razonablemente
 * bien direcciones muy parecidas, pero no es infalible.
 */
export function claveDireccion(direccion: string | null): string {
  if (!direccion) return 'Sin dirección';
  const limpio = direccion
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[.,\-–—]/g, ' ')
    .replace(/\d+/g, ' ')
    .split(/\s+/)
    .filter((palabra) => palabra.length > 2 && !PALABRAS_GENERICAS.has(palabra));

  const clave = limpio.slice(0, 2).join(' ');
  return clave || 'Sin dirección';
}

export function agruparClientes(
  lista: ClienteConSalud[],
  criterio: CriterioAgrupacion
): GrupoClientes[] {
  if (criterio === 'ninguno') {
    return [{ clave: 'todos', etiqueta: 'Todos los clientes', items: lista }];
  }

  const mapa = new Map<string, ClienteConSalud[]>();
  for (const item of lista) {
    let clave: string;
    if (criterio === 'salud') clave = item.salud.nivel;
    else if (criterio === 'canal') clave = item.cliente.canal ?? 'Sin canal';
    else if (criterio === 'negocio') clave = item.cliente.negocio ?? 'Sin negocio';
    else if (criterio === 'ruta') clave = item.rutaEtiqueta;
    else clave = claveDireccion(item.cliente.direccion);

    if (!mapa.has(clave)) mapa.set(clave, []);
    mapa.get(clave)!.push(item);
  }

  const grupos: GrupoClientes[] = Array.from(mapa.entries()).map(([clave, items]) => ({
    clave,
    etiqueta: criterio === 'salud' ? ETIQUETA_SALUD[clave] ?? clave : clave,
    items,
  }));

  if (criterio === 'salud') {
    grupos.sort(
      (a, b) => (ORDEN_NIVEL_SALUD[a.clave] ?? 9) - (ORDEN_NIVEL_SALUD[b.clave] ?? 9)
    );
  } else {
    // Los grupos más grandes primero: en "dirección similar" y "ruta" es
    // más útil ver primero las zonas con más clientes.
    grupos.sort((a, b) => b.items.length - a.items.length || a.etiqueta.localeCompare(b.etiqueta));
  }

  return grupos;
}
