import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { ClientesView } from './views/ClientesView';
import { ClienteDetalleView } from './views/ClienteDetalleView';
import { EscanearView } from './views/EscanearView';
import { RevisarView } from './views/RevisarView';
import { ResumenView } from './views/ResumenView';
import { AjustesView } from './views/AjustesView';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <ClientesView /> },
      { path: '/clientes/:codigo', element: <ClienteDetalleView /> },
      { path: '/escanear', element: <EscanearView /> },
      { path: '/resumen', element: <ResumenView /> },
      { path: '/ajustes', element: <AjustesView /> },
    ],
  },
  // Sin barra de navegación: tiene su propia barra de acciones fija abajo.
  { path: '/revisar', element: <RevisarView /> },
]);
