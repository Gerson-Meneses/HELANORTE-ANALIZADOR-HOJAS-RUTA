import type { ReactNode } from 'react';
import styles from './EstadoVacio.module.css';

export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  accion,
}: {
  icono: string;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}) {
  return (
    <div className={styles.contenedor}>
      <span className={styles.icono} aria-hidden="true">
        {icono}
      </span>
      <h2 className={styles.titulo}>{titulo}</h2>
      <p className={styles.descripcion}>{descripcion}</p>
      {accion}
    </div>
  );
}
