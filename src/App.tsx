import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './shared/theme/ThemeProvider';
import { router } from './router';
import { despertarServicio } from './features/scan/api/ocrClient';
import './styles/tema.css';
import './styles/global.css';

export function App() {
  useEffect(() => {
    despertarServicio();
  }, []);

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
