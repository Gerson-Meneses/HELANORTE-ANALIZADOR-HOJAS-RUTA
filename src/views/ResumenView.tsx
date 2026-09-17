import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useClientesConSalud } from '../features/clients/useClientesConSalud';
import { TarjetaEstadistica } from '../features/dashboard/components/TarjetaEstadistica';
import { TarjetaCliente } from '../features/clients/components/TarjetaCliente';
import { EncabezadoVista } from '../shared/components/EncabezadoVista';
import { EstadoVacio } from '../shared/components/EstadoVacio';
import { Cargando } from '../shared/components/Cargando';
import { formatearMoneda } from '../utils/formato';
import styles from './ResumenView.module.css';

export function ResumenView() {
  const { clientes, cargando } = useClientesConSalud();

  const resumen = useMemo(() => {
    const buenos = clientes.filter((c) => c.salud.nivel === 'bueno').length;
    const regulares = clientes.filter((c) => c.salud.nivel === 'regular').length;
    const malos = clientes.filter((c) => c.salud.nivel === 'malo').length;
    const totalAcumulado = clientes.reduce((sum, c) => sum + (c.cliente.acu_mes ?? 0), 0);
    // El % de objetivo debe salir de la CUOTA (manual o general por
    // máquina), no del obj_pdv de la hoja — ese casi siempre viene en 0 o
    // con basura del OCR, y sumarlo directo da porcentajes sin sentido
    // (se vio un 129575% en el dashboard por esto).
    const totalCuota = clientes.reduce((sum, c) => sum + (c.cuotaMes ?? 0), 0);
    const conCongelador = clientes.filter((c) => c.cliente.equipos.length > 0).length;
    const totalCongeladores = clientes.reduce((sum, c) => sum + c.cliente.equipos.length, 0);
    const clientesQueNecesitanAtencion = clientes
      .filter((c) => c.salud.nivel === 'malo')
      .slice(0, 5);
    return {
      buenos,
      regulares,
      malos,
      totalAcumulado,
      totalCuota,
      conCongelador,
      totalCongeladores,
      clientesQueNecesitanAtencion,
    };
  }, [clientes]);

  if (cargando) return <Cargando mensaje="Calculando resumen…" />;

  if (clientes.length === 0) {
    return (
      <EstadoVacio
        icono="◧"
        titulo="Nada que resumir todavía"
        descripcion="Escanea al menos una ruta para ver aquí el resumen del día."
      />
    );
  }

  const pctCuota =
    resumen.totalCuota > 0
      ? Math.round((resumen.totalAcumulado / resumen.totalCuota) * 100)
      : null;

  return (
    <div>
      <EncabezadoVista titulo="Resumen" subtitulo={`${clientes.length} clientes guardados`} />

      <div className={styles.filaEstadisticas}>
        <TarjetaEstadistica etiqueta="Bien" valor={String(resumen.buenos)} color="var(--nivel-bueno)" />
        <TarjetaEstadistica
          etiqueta="Regular"
          valor={String(resumen.regulares)}
          color="var(--nivel-regular)"
        />
        <TarjetaEstadistica
          etiqueta="Atención"
          valor={String(resumen.malos)}
          color="var(--nivel-malo)"
        />
      </div>

      <div className={styles.filaEstadisticas}>
        <TarjetaEstadistica etiqueta="Acumulado total" valor={formatearMoneda(resumen.totalAcumulado)} />
        <TarjetaEstadistica
          etiqueta="% de cuota (S/ acumulado / cuota)"
          valor={pctCuota == null ? 'Sin cuota' : `${pctCuota}%`}
        />
      </div>

      <div className={styles.filaEstadisticas}>
        <TarjetaEstadistica
          etiqueta="Con congelador"
          valor={`${resumen.conCongelador} / ${clientes.length}`}
        />
        <TarjetaEstadistica etiqueta="Congeladores en la ruta" valor={String(resumen.totalCongeladores)} />
      </div>

      {resumen.clientesQueNecesitanAtencion.length > 0 && (
        <section className={styles.seccion}>
          <div className={styles.tituloConEnlace}>
            <h2 className={styles.tituloSeccion}>Necesitan atención primero</h2>
            <Link to="/">Ver todos</Link>
          </div>
          {resumen.clientesQueNecesitanAtencion.map((item) => (
            <TarjetaCliente key={item.cliente.id} {...item} />
          ))}
        </section>
      )}
    </div>
  );
}
