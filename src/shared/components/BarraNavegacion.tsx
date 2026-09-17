import { NavLink } from 'react-router-dom';
import styles from './BarraNavegacion.module.css';

const ITEMS = [
  { to: '/', etiqueta: 'Clientes', icono: '☰' },
  { to: '/escanear', etiqueta: 'Escanear', icono: '＋' },
  { to: '/resumen', etiqueta: 'Resumen', icono: '◧' },
  { to: '/ajustes', etiqueta: 'Ajustes', icono: '⚙' },
] as const;

export function BarraNavegacion() {
  return (
    <nav className={styles.barra} aria-label="Navegación principal">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            isActive ? `${styles.item} ${styles.activo}` : styles.item
          }
        >
          <span className={styles.icono} aria-hidden="true">
            {item.icono}
          </span>
          <span className={styles.etiqueta}>{item.etiqueta}</span>
        </NavLink>
      ))}
    </nav>
  );
}
