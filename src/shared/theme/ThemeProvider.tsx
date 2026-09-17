import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Tema = 'claro' | 'oscuro';

const CLAVE_STORAGE = 'helanorte:tema';

interface ThemeContextValue {
  tema: Tema;
  alternarTema: () => void;
  setTema: (t: Tema) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function temaInicial(): Tema {
  const guardado = localStorage.getItem(CLAVE_STORAGE);
  if (guardado === 'claro' || guardado === 'oscuro') return guardado;
  const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefiereOscuro ? 'oscuro' : 'claro';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema);
    localStorage.setItem(CLAVE_STORAGE, tema);
  }, [tema]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      tema,
      alternarTema: () => setTemaState((t) => (t === 'claro' ? 'oscuro' : 'claro')),
      setTema: setTemaState,
    }),
    [tema]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
