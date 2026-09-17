import type { CriterioSalud } from '../../../types/dominio';
import styles from './EditorCriterioSalud.module.css';

interface EditorCriterioSaludProps {
  criterio: CriterioSalud;
  onCambiar: (criterio: CriterioSalud) => void;
}

export function EditorCriterioSalud({ criterio, onCambiar }: EditorCriterioSaludProps) {
  function actualizar<K extends keyof CriterioSalud>(campo: K, valor: CriterioSalud[K]) {
    onCambiar({ ...criterio, [campo]: valor });
  }

  const unidad = criterio.id === 'dias_sin_compra' ? 'días' : '%';

  return (
    <div className={styles.tarjeta}>
      <div className={styles.encabezado}>
        <div>
          <p className={styles.nombre}>{criterio.nombre}</p>
          <p className={styles.descripcion}>{criterio.descripcion}</p>
        </div>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={criterio.activo}
            onChange={(e) => actualizar('activo', e.target.checked)}
          />
          <span>{criterio.activo ? 'Activo' : 'Inactivo'}</span>
        </label>
      </div>

      {criterio.activo && (
        <div className={styles.campos}>
          <label className={styles.campo}>
            <span>
              Umbral "bueno" ({unidad}
              {criterio.direccion === 'menor_es_mejor' ? ' o menos' : ' o más'})
            </span>
            <input
              type="number"
              className="num"
              value={criterio.umbralBueno}
              onChange={(e) => actualizar('umbralBueno', Number(e.target.value))}
            />
          </label>

          <label className={styles.campo}>
            <span>
              Umbral "regular" ({unidad}
              {criterio.direccion === 'menor_es_mejor' ? ' o menos' : ' o más'}; peor es "malo")
            </span>
            <input
              type="number"
              className="num"
              value={criterio.umbralRegular}
              onChange={(e) => actualizar('umbralRegular', Number(e.target.value))}
            />
          </label>

          <label className={styles.campo}>
            <span>Peso en el puntaje combinado ({Math.round(criterio.peso * 100)}%)</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={criterio.peso}
              onChange={(e) => actualizar('peso', Number(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
}
