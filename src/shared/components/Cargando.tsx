import styles from './Cargando.module.css';

export function Cargando({ mensaje }: { mensaje: string }) {
  return (
    <div className={styles.contenedor} role="status" aria-live="polite">
      <span className={styles.spinner} />
      <p>{mensaje}</p>
    </div>
  );
}
