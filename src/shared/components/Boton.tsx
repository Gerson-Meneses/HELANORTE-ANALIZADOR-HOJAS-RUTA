import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Boton.module.css';

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'fantasma' | 'peligro';
  tamano?: 'md' | 'lg';
  icono?: ReactNode;
  children: ReactNode;
}

export function Boton({
  variante = 'primario',
  tamano = 'md',
  icono,
  children,
  className,
  ...resto
}: BotonProps) {
  const clases = [styles.boton, styles[variante], styles[tamano], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={clases} {...resto}>
      {icono && <span className={styles.icono}>{icono}</span>}
      <span>{children}</span>
    </button>
  );
}
