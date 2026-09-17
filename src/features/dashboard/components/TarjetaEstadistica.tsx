import styles from './TarjetaEstadistica.module.css';

export function TarjetaEstadistica({
  etiqueta,
  valor,
  color,
}: {
  etiqueta: string;
  valor: string;
  color?: string;
}) {
  return (
    <div className={styles.tarjeta}>
      <span className={styles.valor} style={color ? { color } : undefined}>
        {valor}
      </span>
      <span className={styles.etiqueta}>{etiqueta}</span>
    </div>
  );
}
