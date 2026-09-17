import { useCallback, useEffect, useState } from 'react';
import type { ClienteGuardado, ConfigSalud, ResultadoSalud } from '../../types/dominio';
import {
  getTodosLosClientes,
  getConfigSalud,
  setConfigSalud,
  getTodosLosEscaneos,
  getTodasLasCuotas,
} from '../../db/database';
import { CONFIG_SALUD_POR_DEFECTO } from './defaultHealthRules';
import { calcularSalud } from './healthEngine';
import { anioMesDesdeFecha } from '../../utils/formato';

export interface ClienteConSalud {
  cliente: ClienteGuardado;
  salud: ResultadoSalud;
  cuotaMes: number | null;
  cuotaEsManual: boolean;
  pctCuota: number | null;
  anioMes: string;
  rutaEtiqueta: string;
  vendedorEtiqueta: string;
}

export function useClientesConSalud() {
  const [clientes, setClientes] = useState<ClienteConSalud[]>([]);
  const [config, setConfig] = useState<ConfigSalud>(CONFIG_SALUD_POR_DEFECTO);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    const [todos, configGuardada, escaneos, cuotas] = await Promise.all([
      getTodosLosClientes(),
      getConfigSalud(),
      getTodosLosEscaneos(),
      getTodasLasCuotas(),
    ]);
    const configFinal = { ...CONFIG_SALUD_POR_DEFECTO, ...configGuardada };
    setConfig(configFinal);

    const escaneosPorId = new Map(escaneos.map((e) => [e.id, e]));
    const mesActual = new Date().toISOString().slice(0, 7);

    setClientes(
      todos.map((cliente) => {
        const escaneo = escaneosPorId.get(cliente.escaneo_id);
        const anioMes = anioMesDesdeFecha(escaneo?.encabezado.fecha_reporte) ?? mesActual;

        // Suma todas las cuotas MANUALES de este cliente que apliquen a ese
        // mes: la "general" y/o cualquiera asignada a alguno de sus equipos.
        const clavesValidas = new Set(['general', ...cliente.equipos.map((e) => e.modelo_codigo)]);
        const cuotaManual = cuotas
          .filter((q) => q.codigo_cliente === cliente.codigo && q.anio_mes === anioMes)
          .filter((q) => clavesValidas.has(q.equipo_key))
          .reduce((sum, q) => sum + q.monto, 0);

        // Si no hay cuota manual, se usa la cuota general por congelador
        // (configurada en Ajustes) multiplicada por cuántos congeladores
        // tiene ESTE cliente — así uno con 2 máquinas exige el doble.
        const cuotaPorDefecto =
          configFinal.cuotaGeneralPorMaquina > 0 && cliente.equipos.length > 0
            ? configFinal.cuotaGeneralPorMaquina * cliente.equipos.length
            : 0;

        const cuotaEsManual = cuotaManual > 0;
        const cuotaMes = cuotaEsManual ? cuotaManual : cuotaPorDefecto > 0 ? cuotaPorDefecto : null;

        const pctCuota =
          cuotaMes != null && cliente.acu_mes != null ? (cliente.acu_mes / cuotaMes) * 100 : null;

        const rutaEtiqueta = escaneo
          ? [escaneo.encabezado.ruta_venta, escaneo.encabezado.dia_visita]
              .filter(Boolean)
              .join(' · ') || 'Sin ruta'
          : 'Sin ruta';

        const vendedorEtiqueta = escaneo
          ? [escaneo.encabezado.vendedor_numero, escaneo.encabezado.vendedor_nombre]
              .filter(Boolean)
              .join(' · ') || 'Sin vendedor'
          : 'Sin vendedor';

        return {
          cliente,
          salud: calcularSalud(cliente, configFinal, cuotaMes),
          cuotaMes,
          cuotaEsManual,
          pctCuota,
          anioMes,
          rutaEtiqueta,
          vendedorEtiqueta,
        };
      })
    );
    setCargando(false);
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const actualizarConfig = useCallback(
    async (nuevaConfig: ConfigSalud) => {
      await setConfigSalud(nuevaConfig);
      await recargar();
    },
    [recargar]
  );

  return { clientes, config, cargando, recargar, actualizarConfig };
}
