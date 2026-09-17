import type { Cliente, Encabezado } from './ocr';

/** Un escaneo guardado: el encabezado de una hoja + cuándo se procesó. */
export interface Escaneo {
  id: string; // uuid
  fecha_procesado: string; // ISO, cuándo se escaneó en la app (no la fecha del reporte)
  encabezado: Encabezado;
  nombre_archivo: string;
  metodo_extraccion: string;
}

/**
 * Un cliente tal como queda guardado en IndexedDB: los datos extraídos por
 * el OCR (ya revisados/corregidos por el usuario) + metadatos propios de
 * la app. Se identifica por `codigo` — si el mismo código aparece en un
 * escaneo posterior, se actualiza el registro y se guarda el histórico.
 */
export interface ClienteGuardado extends Cliente {
  id: string; // = codigo (clave primaria en IndexedDB)
  escaneo_id: string;
  actualizado_en: string; // ISO
  notas?: string;
  visitado_hoy?: boolean;
}

/** Un punto histórico de un cliente, guardado cada vez que se re-escanea. */
export interface HistorialCliente {
  id: string; // uuid
  codigo: string;
  fecha: string; // ISO
  acu_mes: number | null;
  muc_monto: number | null;
  obj_pdv: number | null;
  ren_maquina: number | null;
}

/**
 * Cuota asignada manualmente para un cliente en un mes concreto. El "mes"
 * se toma del mes de LA HOJA escaneada (fecha_reporte del encabezado), no
 * del día de hoy — así, si revisas una hoja vieja, ves la cuota de ESE mes.
 *
 * `equipo_key` permite una cuota "por máquina" cuando el cliente tiene más
 * de un congelador asignado (ej. una tienda con HIRON + LIEBHERR puede
 * tener una cuota distinta para cada una). Si el cliente no tiene
 * congeladores, o se quiere una sola cuota general, se usa 'general'.
 */
export interface CuotaMensual {
  id: string; // `${codigo_cliente}:${equipo_key}:${anio_mes}`
  codigo_cliente: string;
  equipo_key: string; // modelo_codigo del equipo, o 'general'
  anio_mes: string; // 'AAAA-MM'
  monto: number;
  actualizado_en: string; // ISO
}

/* ------------------------------------------------------------------ */
/* Reglas del semáforo de salud                                        */
/* ------------------------------------------------------------------ */

export type NivelSalud = 'bueno' | 'regular' | 'malo' | 'sin_datos';

/** Dirección de "mejor": si valores más altos son mejores, o más bajos. */
export type DireccionCriterio = 'mayor_es_mejor' | 'menor_es_mejor';

export interface CriterioSalud {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  direccion: DireccionCriterio;
  /** Umbral a partir del cual se considera "bueno". */
  umbralBueno: number;
  /** Umbral a partir del cual se considera "regular" (peor que esto = malo). */
  umbralRegular: number;
  /** Peso relativo de este criterio en el puntaje combinado (0-1). */
  peso: number;
}

/** Config completa de reglas: la global + overrides por cliente. */
export interface ConfigSalud {
  criterios: CriterioSalud[];
  overridesPorCliente: Record<string, Record<string, Partial<CriterioSalud>>>;
  /**
   * Cuota esperada por CADA congelador al mes (S/), aplicada por defecto a
   * todo cliente que no tenga una cuota manual propia asignada. El total
   * esperado de un cliente = su cantidad de congeladores × este valor.
   * 0 = desactivado (no se usa este cálculo por defecto).
   */
  cuotaGeneralPorMaquina: number;
}

export interface ResultadoSalud {
  nivel: NivelSalud;
  puntaje: number; // 0-100
  detalle: Array<{
    criterioId: string;
    nombre: string;
    valor: number | null;
    nivel: NivelSalud;
  }>;
}
