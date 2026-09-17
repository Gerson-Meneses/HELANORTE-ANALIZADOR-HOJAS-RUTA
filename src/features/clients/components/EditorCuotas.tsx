import { useEffect, useState } from 'react';
import type { CuotaMensual } from '../../../types/dominio';
import type { EquipoAsignado } from '../../../types/ocr';
import { getCuotasDeCliente, guardarCuota, eliminarCuota } from '../../../db/database';
import { formatearMoneda, etiquetaAnioMes } from '../../../utils/formato';
import styles from './EditorCuotas.module.css';

interface EditorCuotasProps {
  codigoCliente: string;
  anioMes: string;
  equipos: EquipoAsignado[];
  acuMes: number | null;
  onCambio: () => void;
}

interface Fila {
  equipoKey: string;
  etiqueta: string;
}

export function EditorCuotas({
  codigoCliente,
  anioMes,
  equipos,
  acuMes,
  onCambio,
}: EditorCuotasProps) {
  const [cuotas, setCuotas] = useState<CuotaMensual[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getCuotasDeCliente(codigoCliente).then((lista) => {
      const deEsteMes = lista.filter((c) => c.anio_mes === anioMes);
      setCuotas(deEsteMes);
      const iniciales: Record<string, string> = {};
      for (const c of deEsteMes) iniciales[c.equipo_key] = String(c.monto);
      setValores(iniciales);
      setCargando(false);
    });
  }, [codigoCliente, anioMes]);

  const filas: Fila[] =
    equipos.length > 0
      ? equipos.map((eq) => ({
          equipoKey: eq.modelo_codigo ?? 'general',
          etiqueta: `${eq.marca ?? 'Congelador'} ${eq.modelo_codigo ?? ''}`.trim(),
        }))
      : [{ equipoKey: 'general', etiqueta: 'Cuota general del cliente' }];

  async function guardar(equipoKey: string) {
    const texto = valores[equipoKey] ?? '';
    const monto = Number(texto);
    const id = `${codigoCliente}:${equipoKey}:${anioMes}`;

    if (!texto || Number.isNaN(monto) || monto <= 0) {
      // Vaciar el campo = quitar la cuota asignada para ese congelador/mes.
      if (cuotas.some((c) => c.equipo_key === equipoKey)) {
        await eliminarCuota(id);
        setCuotas((prev) => prev.filter((c) => c.equipo_key !== equipoKey));
        onCambio();
      }
      return;
    }

    const cuota: CuotaMensual = {
      id,
      codigo_cliente: codigoCliente,
      equipo_key: equipoKey,
      anio_mes: anioMes,
      monto,
      actualizado_en: new Date().toISOString(),
    };
    await guardarCuota(cuota);
    setCuotas((prev) => [...prev.filter((c) => c.equipo_key !== equipoKey), cuota]);
    onCambio();
  }

  if (cargando) return null;

  const totalCuota = cuotas.reduce((sum, c) => sum + c.monto, 0);
  const pctCumplido =
    totalCuota > 0 && acuMes != null ? Math.round((acuMes / totalCuota) * 100) : null;

  return (
    <div className={styles.contenedor}>
      <p className={styles.mesActual}>Cuota de {etiquetaAnioMes(anioMes)}</p>

      {filas.map((fila) => (
        <label key={fila.equipoKey} className={styles.fila}>
          <span className={styles.etiquetaFila}>{fila.etiqueta}</span>
          <input
            type="number"
            inputMode="decimal"
            className="num"
            placeholder="Sin asignar"
            value={valores[fila.equipoKey] ?? ''}
            onChange={(e) =>
              setValores((prev) => ({ ...prev, [fila.equipoKey]: e.target.value }))
            }
            onBlur={() => guardar(fila.equipoKey)}
          />
        </label>
      ))}

      {totalCuota > 0 && (
        <p className={styles.resumen}>
          Acumulado {formatearMoneda(acuMes)} de {formatearMoneda(totalCuota)} de cuota
          {pctCumplido != null && ` (${pctCumplido}%)`}
        </p>
      )}
    </div>
  );
}
