import { Outlet } from 'react-router-dom';
import { BarraNavegacion } from './shared/components/BarraNavegacion';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <div className={styles.layout}>
      <main className={styles.contenido}>
        <Outlet />
      </main>
      <BarraNavegacion />
    </div>
  );
}
