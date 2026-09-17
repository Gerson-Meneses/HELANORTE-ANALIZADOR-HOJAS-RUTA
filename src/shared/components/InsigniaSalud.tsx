import type { NivelSalud } from '../../types/dominio';
import styles from './InsigniaSalud.module.css';

const ETIQUETA: Record<NivelSalud, string> = {
  bueno: 'Bueno',
  regular: 'Regular',
  malo: 'Necesita atención',
  sin_datos: 'Sin datos',
};

export function colorDeNivel(nivel: NivelSalud): string {
  switch (nivel) {
    case 'bueno':
      return 'var(--nivel-bueno)';
    case 'regular':
      return 'var(--nivel-regular)';
    case 'malo':
      return 'var(--nivel-malo)';
    default:
      return 'var(--nivel-sin-datos)';
  }
}

export function InsigniaSalud({ nivel }: { nivel: NivelSalud }) {
  return (
    <span className={`${styles.insignia} ${styles[nivel]}`}>
      <span className={styles.punto} />
      {ETIQUETA[nivel]}
    </span>
  );
}
