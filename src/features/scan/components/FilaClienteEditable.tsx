import type { Cliente, EquipoAsignado } from '../../../types/ocr';
import { EditorEquipos } from '../../clients/components/EditorEquipos';
import styles from './FilaClienteEditable.module.css';

interface FilaClienteEditableProps {
  cliente: Cliente;
  onCambiar: (campo: keyof Cliente, valor: string) => void;
  onCambiarEquipos: (equipos: EquipoAsignado[]) => void;
  onEliminar: () => void;
  tieneAdvertencia: boolean;
}

const CAMPOS_TEXTO: Array<{ clave: keyof Cliente; etiqueta: string }> = [
  { clave: 'codigo', etiqueta: 'Código' },
  { clave: 'nombre', etiqueta: 'Nombre' },
  { clave: 'ruc_dni', etiqueta: 'RUC / DNI' },
  { clave: 'canal', etiqueta: 'Canal' },
  { clave: 'negocio', etiqueta: 'Negocio' },
  { clave: 'direccion', etiqueta: 'Dirección' },
];

const CAMPOS_NUMERO: Array<{ clave: keyof Cliente; etiqueta: string }> = [
  { clave: 'muc_monto', etiqueta: 'Monto últ. compra' },
  { clave: 'acu_mes', etiqueta: 'Acumulado mes' },
  { clave: 'mma', etiqueta: 'Mes anterior (MMA)' },
  { clave: 'obj_pdv', etiqueta: 'Objetivo del mes' },
];

export function FilaClienteEditable({
  cliente,
  onCambiar,
  onCambiarEquipos,
  onEliminar,
  tieneAdvertencia,
}: FilaClienteEditableProps) {
  return (
    <details className={styles.fila} open={tieneAdvertencia}>
      <summary className={styles.resumen}>
        <span>
          <strong>{cliente.nombre || 'Sin nombre'}</strong>
          <span className={`num ${styles.codigoResumen}`}> · {cliente.codigo}</span>
        </span>
        {tieneAdvertencia && <span className={styles.marcaAdvertencia}>Revisar</span>}
      </summary>

      <div className={styles.campos}>
        {CAMPOS_TEXTO.map(({ clave, etiqueta }) => (
          <label key={clave} className={styles.campo}>
            <span className={styles.etiquetaCampo}>{etiqueta}</span>
            <input
              type="text"
              value={(cliente[clave] as string) ?? ''}
              onChange={(e) => onCambiar(clave, e.target.value)}
            />
          </label>
        ))}

        {CAMPOS_NUMERO.map(({ clave, etiqueta }) => (
          <label key={clave} className={styles.campo}>
            <span className={styles.etiquetaCampo}>{etiqueta}</span>
            <input
              className="num"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={cliente[clave] == null ? '' : String(cliente[clave])}
              onChange={(e) => onCambiar(clave, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div className={styles.bloqueEquipos}>
        <EditorEquipos equipos={cliente.equipos} onCambiar={onCambiarEquipos} />
      </div>

      {cliente.texto_crudo && (
        <details className={styles.textoCrudo}>
          <summary>Ver texto crudo leído por el OCR</summary>
          <pre className={styles.pre}>{cliente.texto_crudo}</pre>
        </details>
      )}

      <button type="button" className={styles.eliminar} onClick={onEliminar}>
        Quitar este cliente del escaneo
      </button>
    </details>
  );
}
