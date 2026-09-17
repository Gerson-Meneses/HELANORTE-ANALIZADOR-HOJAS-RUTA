import type { EquipoAsignado } from '../../../types/ocr';
import styles from './EditorEquipos.module.css';

interface EditorEquiposProps {
  equipos: EquipoAsignado[];
  onCambiar: (equipos: EquipoAsignado[]) => void;
}

export function EditorEquipos({ equipos, onCambiar }: EditorEquiposProps) {
  function actualizar(indice: number, campo: keyof EquipoAsignado, valor: string) {
    const copia = equipos.map((eq, i) => (i === indice ? { ...eq, [campo]: valor || null } : eq));
    onCambiar(copia);
  }

  function agregar() {
    onCambiar([...equipos, { marca: '', modelo_codigo: '' }]);
  }

  function quitar(indice: number) {
    onCambiar(equipos.filter((_, i) => i !== indice));
  }

  return (
    <div className={styles.contenedor}>
      <span className={styles.etiqueta}>
        Congeladores asignados {equipos.length > 0 && `(${equipos.length})`}
      </span>

      {equipos.map((eq, i) => (
        <div key={i} className={styles.fila}>
          <input
            type="text"
            placeholder="Marca (ej. HIRON)"
            value={eq.marca ?? ''}
            onChange={(e) => actualizar(i, 'marca', e.target.value)}
          />
          <input
            type="text"
            className="num"
            placeholder="Código de modelo"
            value={eq.modelo_codigo ?? ''}
            onChange={(e) => actualizar(i, 'modelo_codigo', e.target.value)}
          />
          <button type="button" onClick={() => quitar(i)} aria-label="Quitar congelador">
            ✕
          </button>
        </div>
      ))}

      <button type="button" className={styles.agregar} onClick={agregar}>
        + Agregar congelador
      </button>
    </div>
  );
}
