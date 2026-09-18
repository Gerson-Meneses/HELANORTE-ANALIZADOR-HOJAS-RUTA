import { useEffect, useState } from 'react';
import { suscribirseAEscaneo, obtenerEstadoEscaneo, type EstadoEscaneo } from './scanManager';

export function useEscaneoEnProgreso(): EstadoEscaneo {
  const [estado, setEstado] = useState<EstadoEscaneo>(obtenerEstadoEscaneo());

  useEffect(() => suscribirseAEscaneo(setEstado), []);

  return estado;
}
