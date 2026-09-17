import type { CriterioOrden, CriterioAgrupacion } from '../ordenarYAgrupar';
import styles from './ControlesLista.module.css';

interface ControlesListaProps {
  busqueda: string;
  onBusqueda: (v: string) => void;
  orden: CriterioOrden;
  onOrden: (v: CriterioOrden) => void;
  ascendente: boolean;
  onAscendente: (v: boolean) => void;
  agrupacion: CriterioAgrupacion;
  onAgrupacion: (v: CriterioAgrupacion) => void;
}

export function ControlesLista({
  busqueda,
  onBusqueda,
  orden,
  onOrden,
  ascendente,
  onAscendente,
  agrupacion,
  onAgrupacion,
}: ControlesListaProps) {
  return (
    <div className={styles.contenedor}>
      <input
        type="search"
        className={styles.buscador}
        placeholder="Buscar por nombre, código o dirección…"
        value={busqueda}
        onChange={(e) => onBusqueda(e.target.value)}
      />

      <div className={styles.fila}>
        <select
          className={styles.select}
          value={orden}
          onChange={(e) => onOrden(e.target.value as CriterioOrden)}
          aria-label="Ordenar por"
        >
          <option value="salud">Ordenar: salud</option>
          <option value="nombre">Ordenar: nombre</option>
          <option value="codigo">Ordenar: código</option>
          <option value="acumulado">Ordenar: acumulado del mes</option>
          <option value="ultima_compra">Ordenar: última compra</option>
          <option value="objetivo">Ordenar: % de objetivo (hoja)</option>
          <option value="pct_cuota">Ordenar: % de cuota por máquina</option>
        </select>

        <button
          type="button"
          className={styles.botonDireccion}
          onClick={() => onAscendente(!ascendente)}
          title={ascendente ? 'Ascendente' : 'Descendente'}
        >
          {ascendente ? '↑' : '↓'}
        </button>

        <select
          className={styles.select}
          value={agrupacion}
          onChange={(e) => onAgrupacion(e.target.value as CriterioAgrupacion)}
          aria-label="Agrupar por"
        >
          <option value="ninguno">Sin agrupar</option>
          <option value="salud">Agrupar: salud</option>
          <option value="canal">Agrupar: canal</option>
          <option value="negocio">Agrupar: negocio</option>
          <option value="ruta">Agrupar: ruta</option>
          <option value="direccion">Agrupar: dirección similar</option>
        </select>
      </div>
    </div>
  );
}
