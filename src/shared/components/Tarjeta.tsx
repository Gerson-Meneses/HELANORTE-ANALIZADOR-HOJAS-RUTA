import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Tarjeta.module.css';

interface TarjetaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Color de acento en el borde izquierdo (para el semáforo de salud). */
  colorAcento?: string;
  interactiva?: boolean;
}

export function Tarjeta({
  children,
  colorAcento,
  interactiva,
  className,
  style,
  ...resto
}: TarjetaProps) {
  const clases = [styles.tarjeta, interactiva && styles.interactiva, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={clases}
      style={{
        ...style,
        borderLeftColor: colorAcento ?? 'transparent',
      }}
      {...resto}
    >
      {children}
    </div>
  );
}
