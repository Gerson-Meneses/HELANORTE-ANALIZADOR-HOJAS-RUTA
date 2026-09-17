import type { Encabezado } from '../../../types/ocr';
import styles from './EditorEncabezado.module.css';

interface EditorEncabezadoProps {
  encabezado: Encabezado;
  onCambiar: (campo: keyof Encabezado, valor: string) => void;
}

const CAMPOS: Array<{ clave: keyof Encabezado; etiqueta: string; placeholder?: string }> = [
  { clave: 'empresa', etiqueta: 'Empresa' },
  { clave: 'vendedor_numero', etiqueta: 'N° de vendedor' },
  { clave: 'vendedor_nombre', etiqueta: 'Nombre del vendedor' },
  { clave: 'ruta_venta', etiqueta: 'Ruta' },
  { clave: 'dia_visita', etiqueta: 'Día de visita', placeholder: 'LUNES, MARTES...' },
  { clave: 'fecha_reporte', etiqueta: 'Fecha de la hoja', placeholder: 'DD/MM/AAAA' },
];

export function EditorEncabezado({ encabezado, onCambiar }: EditorEncabezadoProps) {
  return (
    <details className={styles.contenedor}>
      <summary className={styles.resumen}>
        <span>
          {encabezado.dia_visita ?? 'Sin día'} · {encabezado.ruta_venta ?? 'Sin ruta'}
        </span>
        <span className={styles.editarTexto}>Editar</span>
      </summary>
      <div className={styles.campos}>
        {CAMPOS.map(({ clave, etiqueta, placeholder }) => (
          <label key={clave} className={styles.campo}>
            <span>{etiqueta}</span>
            <input
              type="text"
              placeholder={placeholder}
              value={(encabezado[clave] as string) ?? ''}
              onChange={(e) => onCambiar(clave, e.target.value)}
            />
          </label>
        ))}
      </div>
    </details>
  );
}
