import styles from './FiltroMultiple.module.css';

interface Opcion {
  valor: string;
  etiqueta: string;
}

interface FiltroMultipleProps {
  titulo: string;
  opciones: Opcion[];
  seleccionados: string[];
  onCambiar: (valores: string[]) => void;
}

export function FiltroMultiple({ titulo, opciones, seleccionados, onCambiar }: FiltroMultipleProps) {
  function alternar(valor: string) {
    if (seleccionados.includes(valor)) {
      onCambiar(seleccionados.filter((v) => v !== valor));
    } else {
      onCambiar([...seleccionados, valor]);
    }
  }

  const resumen =
    seleccionados.length === 0
      ? 'Todos'
      : seleccionados.length === 1
        ? opciones.find((o) => o.valor === seleccionados[0])?.etiqueta ?? seleccionados[0]
        : `${seleccionados.length} seleccionados`;

  if (opciones.length === 0) return null;

  return (
    <details className={styles.contenedor}>
      <summary className={styles.resumen}>
        <span className={styles.titulo}>{titulo}</span>
        <span className={seleccionados.length > 0 ? styles.valorActivo : styles.valor}>
          {resumen}
        </span>
      </summary>

      <div className={styles.panel}>
        {seleccionados.length > 0 && (
          <button type="button" className={styles.limpiar} onClick={() => onCambiar([])}>
            Limpiar selección
          </button>
        )}
        {opciones.map((opcion) => (
          <label key={opcion.valor} className={styles.opcion}>
            <input
              type="checkbox"
              checked={seleccionados.includes(opcion.valor)}
              onChange={() => alternar(opcion.valor)}
            />
            <span>{opcion.etiqueta}</span>
          </label>
        ))}
      </div>
    </details>
  );
}
