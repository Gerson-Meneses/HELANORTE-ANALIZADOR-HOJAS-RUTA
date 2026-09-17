import type { ReactNode } from 'react';
import { InterruptorTema } from './InterruptorTema';
import styles from './EncabezadoVista.module.css';

export function EncabezadoVista({
  titulo,
  subtitulo,
  accion,
}: {
  titulo: string;
  subtitulo?: string;
  accion?: ReactNode;
}) {
  return (
    <header className={styles.encabezado}>
      <div>
        <h1 className={styles.titulo}>{titulo}</h1>
        {subtitulo && <p className={styles.subtitulo}>{subtitulo}</p>}
      </div>
      <div className={styles.acciones}>
        {accion}
        <InterruptorTema />
      </div>
    </header>
  );
}
