import { useEffect, useState } from 'react';

/**
 * Igual que useState, pero el valor sobrevive a que el usuario navegue a
 * otra vista y vuelva (o cierre y abra la app). Se guarda en localStorage
 * bajo `clave`. Útil para que los filtros/orden de la lista de clientes no
 * se reseteen cada vez que entras al detalle de uno y vuelves atrás.
 */
export function usePersistedState<T>(clave: string, valorPorDefecto: T) {
  const [estado, setEstado] = useState<T>(() => {
    try {
      const guardado = localStorage.getItem(clave);
      return guardado !== null ? (JSON.parse(guardado) as T) : valorPorDefecto;
    } catch {
      return valorPorDefecto;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(clave, JSON.stringify(estado));
    } catch {
      /* localStorage lleno o no disponible: no es crítico, se ignora */
    }
  }, [clave, estado]);

  return [estado, setEstado] as const;
}

/** true si esta es la primera vez que se usa `clave` (no hay nada guardado). */
export function esPrimeraVez(clave: string): boolean {
  return localStorage.getItem(clave) === null;
}
