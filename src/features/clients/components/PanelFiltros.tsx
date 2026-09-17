import { FiltroMultiple } from '../../../shared/components/FiltroMultiple';
import styles from './PanelFiltros.module.css';

export type FiltroCongelador = 'todos' | 'sin' | 'con' | 'mas_de_uno';

interface OpcionRuta {
  valor: string;
  etiqueta: string;
}

interface PanelFiltrosProps {
  rutas: OpcionRuta[];
  rutasSeleccionadas: string[];
  onRutas: (v: string[]) => void;

  vendedores: string[];
  vendedoresSeleccionados: string[];
  onVendedores: (v: string[]) => void;

  canales: string[];
  canalesSeleccionados: string[];
  onCanales: (v: string[]) => void;

  filtroCongelador: FiltroCongelador;
  onFiltroCongelador: (v: FiltroCongelador) => void;

  cantidadFiltrosActivos: number;
  onLimpiarTodo: () => void;
}

export function PanelFiltros({
  rutas,
  rutasSeleccionadas,
  onRutas,
  vendedores,
  vendedoresSeleccionados,
  onVendedores,
  canales,
  canalesSeleccionados,
  onCanales,
  filtroCongelador,
  onFiltroCongelador,
  cantidadFiltrosActivos,
  onLimpiarTodo,
}: PanelFiltrosProps) {
  return (
    <div className={styles.contenedor}>
      <div className={styles.encabezado}>
        <span className={styles.titulo}>
          Filtros{cantidadFiltrosActivos > 0 && ` (${cantidadFiltrosActivos} activos)`}
        </span>
        {cantidadFiltrosActivos > 0 && (
          <button type="button" className={styles.limpiarTodo} onClick={onLimpiarTodo}>
            Limpiar todo
          </button>
        )}
      </div>

      <div className={styles.grilla}>
        {rutas.length > 1 && (
          <FiltroMultiple
            titulo="Ruta"
            opciones={rutas}
            seleccionados={rutasSeleccionadas}
            onCambiar={onRutas}
          />
        )}
        {vendedores.length > 1 && (
          <FiltroMultiple
            titulo="Vendedor"
            opciones={vendedores.map((v) => ({ valor: v, etiqueta: v }))}
            seleccionados={vendedoresSeleccionados}
            onCambiar={onVendedores}
          />
        )}
        {canales.length > 1 && (
          <FiltroMultiple
            titulo="Canal"
            opciones={canales.map((c) => ({ valor: c, etiqueta: c }))}
            seleccionados={canalesSeleccionados}
            onCambiar={onCanales}
          />
        )}

        <label className={styles.checkboxCongelador}>
          <span>Congeladores</span>
          <select
            className={styles.selectCongelador}
            value={filtroCongelador}
            onChange={(e) => onFiltroCongelador(e.target.value as FiltroCongelador)}
          >
            <option value="todos">Todos</option>
            <option value="con">Con congelador</option>
            <option value="mas_de_uno">Con más de 1</option>
            <option value="sin">Sin congelador</option>
          </select>
        </label>
      </div>
    </div>
  );
}
