import type { CriterioSalud, ConfigSalud } from '../../types/dominio';

/**
 * Criterios por defecto. Cada uno se puede editar desde Ajustes, y también
 * se puede sobreescribir para un cliente específico (ej. un cliente
 * estacional al que no le aplica "días sin compra" de la misma forma).
 */
export const CRITERIOS_POR_DEFECTO: CriterioSalud[] = [
  {
    id: 'dias_sin_compra',
    nombre: 'Días desde la última compra',
    descripcion:
      'Cuántos días pasaron desde la fecha de última compra (UCM) hasta hoy.',
    activo: true,
    direccion: 'menor_es_mejor',
    umbralBueno: 15, // <= 15 días: bueno
    umbralRegular: 30, // <= 30 días: regular; más: malo
    peso: 0.4,
  },
  {
    id: 'cumplimiento_objetivo',
    nombre: 'Cumplimiento del objetivo del mes',
    descripcion: 'Porcentaje del objetivo (OBJ.PDV) alcanzado con lo acumulado (ACU).',
    activo: true,
    direccion: 'mayor_es_mejor',
    umbralBueno: 80, // >= 80%: bueno
    umbralRegular: 50, // >= 50%: regular; menos: malo
    peso: 0.35,
  },
  {
    id: 'vs_promedio_historico',
    nombre: 'Acumulado vs. mes anterior (MMA)',
    descripcion:
      'Compara lo acumulado este mes contra el monto del mes anterior (MMA) del cliente.',
    activo: true,
    direccion: 'mayor_es_mejor',
    umbralBueno: 70, // >= 70% del mes anterior (MMA): bueno
    umbralRegular: 40,
    peso: 0.25,
  },
];

export const CONFIG_SALUD_POR_DEFECTO: ConfigSalud = {
  criterios: CRITERIOS_POR_DEFECTO,
  overridesPorCliente: {},
  cuotaGeneralPorMaquina: 0,
};
