import JSON5 from 'json5';
import type { Cliente, Encabezado, EquipoAsignado, OcrExtractResponse } from '../../types/ocr';

export class FormatoInvalidoError extends Error {}

function pareceResultadoValido(valor: unknown): valor is Record<string, unknown> {
  if (!valor || typeof valor !== 'object') return false;
  const v = valor as Record<string, unknown>;
  return typeof v.encabezado === 'object' && v.encabezado !== null && Array.isArray(v.clientes);
}

function texto(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function numero(v: unknown): number | null {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function extraerEquipos(v: unknown): EquipoAsignado[] {
  if (!Array.isArray(v)) return [];
  return v.map((eq) => {
    const e = (eq ?? {}) as Record<string, unknown>;
    return { marca: texto(e.marca), modelo_codigo: texto(e.modelo_codigo) };
  });
}

function extraerEncabezado(v: Record<string, unknown>): Encabezado {
  return {
    empresa: texto(v.empresa),
    fecha_reporte: texto(v.fecha_reporte),
    vendedor_numero: texto(v.vendedor_numero),
    vendedor_nombre: texto(v.vendedor_nombre),
    ruta_venta: texto(v.ruta_venta),
    dia_visita: texto(v.dia_visita),
    total_clientes_visitar: numero(v.total_clientes_visitar),
  };
}

function extraerCliente(v: Record<string, unknown>): Cliente {
  return {
    sec: texto(v.sec),
    ctg: texto(v.ctg),
    codigo: texto(v.codigo),
    nombre: texto(v.nombre),
    ruc_dni: texto(v.ruc_dni),
    canal: texto(v.canal),
    negocio: texto(v.negocio),
    direccion: texto(v.direccion),
    ucm_fecha: texto(v.ucm_fecha),
    muc_monto: numero(v.muc_monto),
    acu_mes: numero(v.acu_mes),
    mma: numero(v.mma),
    mpp: numero(v.mpp),
    ren_maquina: numero(v.ren_maquina),
    obj_pdv: numero(v.obj_pdv),
    equipos: extraerEquipos(v.equipos),
    texto_crudo: texto(v.texto_crudo),
  };
}

/**
 * Acepta tanto JSON estricto ("clave" entre comillas) como un objeto de
 * JavaScript pegado tal cual (claves sin comillas, comas colgantes, etc.
 * — formato JSON5, que es un superconjunto de JSON). Así no importa si
 * el otro OCR entrega un .json real o si alguien pega el objeto desde un
 * `console.log` o un archivo .js.
 *
 * Además NORMALIZA el resultado contra el esquema completo (usa todos
 * los campos esperados, sin dejar ninguno afuera), así que si a la fuente
 * externa le falta algún campo, queda en `null`/`[]` en vez de romper el
 * resto de la app.
 */
export function parsearResultadoExterno(texto_crudo: string): OcrExtractResponse {
  let json: unknown;
  try {
    json = JSON5.parse(texto_crudo);
  } catch {
    throw new FormatoInvalidoError(
      'No se pudo interpretar el texto ni como JSON ni como objeto de JavaScript. ' +
        'Revisa que esté bien formado (llaves y comas en su lugar).'
    );
  }

  if (!pareceResultadoValido(json)) {
    throw new FormatoInvalidoError(
      'El contenido no tiene la forma esperada: falta "encabezado" (objeto) o "clientes" (lista).'
    );
  }

  const clientesCrudos = json.clientes as unknown[];

  return {
    encabezado: extraerEncabezado(json.encabezado as Record<string, unknown>),
    clientes: clientesCrudos.map((c) => extraerCliente((c ?? {}) as Record<string, unknown>)),
    paginas_procesadas: numero(json.paginas_procesadas) ?? 1,
    metodo_extraccion: texto(json.metodo_extraccion) ?? 'externo',
    advertencias: Array.isArray(json.advertencias)
      ? (json.advertencias as unknown[]).map((a) => String(a))
      : [],
  };
}
