import { useTheme } from '../theme/ThemeProvider';
import styles from './InterruptorTema.module.css';

export function InterruptorTema() {
  const { tema, alternarTema } = useTheme();
  const esOscuro = tema === 'oscuro';

  return (
    <button
      className={styles.interruptor}
      onClick={alternarTema}
      aria-label={esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      {esOscuro ? '☀' : '☾'}
    </button>
  );
}
