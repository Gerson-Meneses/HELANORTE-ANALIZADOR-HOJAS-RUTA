import type {
  CriterioSalud,
  ConfigSalud,
  NivelSalud,
  ResultadoSalud,
} from '../../types/dominio';
import type { ClienteGuardado } from '../../types/dominio';

/** Combina el criterio global con su override específico para un cliente. */
function resolverCriterio(
  criterio: CriterioSalud,
  config: ConfigSalud,
  codigoCliente: string
): CriterioSalud {
  const override = config.overridesPorCliente[codigoCliente]?.[criterio.id];
  return override ? { ...criterio, ...override } : criterio;
}

/** Calcula el valor numérico crudo de un criterio para un cliente dado. */
function calcularValor(
  criterioId: string,
  cliente: ClienteGuardado,
  cuotaMes: number | null
): number | null {
  switch (criterioId) {
    case 'dias_sin_compra': {
      if (!cliente.ucm_fecha) return null;
      const partes = cliente.ucm_fecha.split('/');
      if (partes.length !== 3) return null;
      const [dd, mm, aaaa] = partes.map(Number);
      const fechaCompra = new Date(aaaa, mm - 1, dd);
      if (Number.isNaN(fechaCompra.getTime())) return null;
      const hoy = new Date();
      const diffMs = hoy.setHours(0, 0, 0, 0) - fechaCompra.setHours(0, 0, 0, 0);
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    }
    case 'cumplimiento_objetivo': {
      // La cuota asignada manualmente (por mes de la hoja) manda; el
      // OBJ.PDV que trae la hoja escaneada casi siempre viene en 0 y no
      // sirve como objetivo real, así que solo se usa como último recurso.
      const objetivo = cuotaMes ?? cliente.obj_pdv;
      const { acu_mes } = cliente;
      if (acu_mes == null || objetivo == null || objetivo === 0) return null;
      return (acu_mes / objetivo) * 100;
    }
    case 'vs_promedio_historico': {
      const { acu_mes, mma } = cliente;
      if (acu_mes == null || mma == null || mma === 0) return null;
      return (acu_mes / mma) * 100;
    }
    default:
      return null;
  }
}

function clasificarValor(valor: number, criterio: CriterioSalud): NivelSalud {
  const { direccion, umbralBueno, umbralRegular } = criterio;
  if (direccion === 'mayor_es_mejor') {
    if (valor >= umbralBueno) return 'bueno';
    if (valor >= umbralRegular) return 'regular';
    return 'malo';
  }
  // menor_es_mejor
  if (valor <= umbralBueno) return 'bueno';
  if (valor <= umbralRegular) return 'regular';
  return 'malo';
}

const PUNTAJE_POR_NIVEL: Record<Exclude<NivelSalud, 'sin_datos'>, number> = {
  bueno: 100,
  regular: 55,
  malo: 15,
};

/**
 * Calcula el semáforo de salud combinado de un cliente, aplicando los
 * criterios activos (globales + overrides del cliente) ponderados por su
 * peso. Si ningún criterio tiene datos suficientes, devuelve 'sin_datos'.
 */
export function calcularSalud(
  cliente: ClienteGuardado,
  config: ConfigSalud,
  cuotaMes: number | null = null
): ResultadoSalud {
  const detalle: ResultadoSalud['detalle'] = [];
  let puntajeAcumulado = 0;
  let pesoTotal = 0;

  for (const criterioBase of config.criterios) {
    const criterio = resolverCriterio(criterioBase, config, cliente.codigo ?? '');
    if (!criterio.activo) continue;

    const valor = calcularValor(criterio.id, cliente, cuotaMes);
    const nivel: NivelSalud = valor == null ? 'sin_datos' : clasificarValor(valor, criterio);

    detalle.push({ criterioId: criterio.id, nombre: criterio.nombre, valor, nivel });

    if (nivel !== 'sin_datos') {
      puntajeAcumulado += PUNTAJE_POR_NIVEL[nivel] * criterio.peso;
      pesoTotal += criterio.peso;
    }
  }

  if (pesoTotal === 0) {
    return { nivel: 'sin_datos', puntaje: 0, detalle };
  }

  const puntaje = Math.round(puntajeAcumulado / pesoTotal);
  let nivel: NivelSalud;
  if (puntaje >= 75) nivel = 'bueno';
  else if (puntaje >= 40) nivel = 'regular';
  else nivel = 'malo';

  return { nivel, puntaje, detalle };
}
