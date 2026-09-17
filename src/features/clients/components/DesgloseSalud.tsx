import type { ResultadoSalud } from '../../../types/dominio';
import { colorDeNivel } from '../../../shared/components/InsigniaSalud';
import { formatearNumero } from '../../../utils/formato';
import styles from './DesgloseSalud.module.css';

export function DesgloseSalud({ resultado }: { resultado: ResultadoSalud }) {
  if (resultado.detalle.length === 0) {
    return <p className={styles.vacio}>No hay criterios activos configurados.</p>;
  }

  return (
    <ul className={styles.lista}>
      {resultado.detalle.map((d) => (
        <li key={d.criterioId} className={styles.item}>
          <span
            className={styles.barra}
            style={{ backgroundColor: colorDeNivel(d.nivel) }}
            aria-hidden="true"
          />
          <div className={styles.contenido}>
            <span className={styles.nombre}>{d.nombre}</span>
            <span className="num">{d.valor == null ? 'Sin datos' : formatearNumero(d.valor)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
