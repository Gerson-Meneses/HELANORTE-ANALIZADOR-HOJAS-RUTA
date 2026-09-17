import { Link } from 'react-router-dom';
import type { ClienteConSalud } from '../useClientesConSalud';
import { Tarjeta } from '../../../shared/components/Tarjeta';
import { InsigniaSalud, colorDeNivel } from '../../../shared/components/InsigniaSalud';
import { formatearMoneda, diasDesde } from '../../../utils/formato';
import styles from './TarjetaCliente.module.css';

export function TarjetaCliente({ cliente, salud }: ClienteConSalud) {
  const dias = diasDesde(cliente.ucm_fecha);

  return (
    <Link to={`/clientes/${cliente.codigo}`} className={styles.enlace}>
      <Tarjeta interactiva colorAcento={colorDeNivel(salud.nivel)} className={styles.tarjeta}>
        <div className={styles.encabezadoTarjeta}>
          <div>
            <p className={styles.nombre}>{cliente.nombre || 'Sin nombre'}</p>
            <p className={`num ${styles.codigo}`}>{cliente.codigo}</p>
          </div>
          <InsigniaSalud nivel={salud.nivel} />
        </div>

        <div className={styles.datos}>
          <div>
            <span className={styles.etiquetaDato}>Acumulado mes</span>
            <span className="num">{formatearMoneda(cliente.acu_mes)}</span>
          </div>
          <div>
            <span className={styles.etiquetaDato}>Última compra</span>
            <span>{dias == null ? '—' : `hace ${dias} día${dias === 1 ? '' : 's'}`}</span>
          </div>
        </div>

        {cliente.negocio && <p className={styles.negocio}>{cliente.negocio}</p>}
      </Tarjeta>
    </Link>
  );
}
