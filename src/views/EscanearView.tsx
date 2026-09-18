import { useNavigate } from 'react-router-dom';
import { EncabezadoVista } from '../shared/components/EncabezadoVista';
import { CapturaArchivo } from '../features/scan/components/CapturaArchivo';
import { CapturaJson } from '../features/scan/components/CapturaJson';
import { iniciarEscaneo, cargarResultadoDirecto } from '../features/scan/scanManager';
import { pedirPermisoNotificaciones, notificacionesPreferidas } from '../utils/notificaciones';

export function EscanearView() {
  const navigate = useNavigate();

  function manejarArchivo(archivo: File) {
    // Se pide el permiso de notificaciones AQUÍ, dentro de la propia
    // acción del usuario (elegir el archivo) — es el momento en que más
    // navegadores permiten mostrar el diálogo sin bloquearlo. Si el
    // usuario ya respondió antes (sí o no), esto no vuelve a preguntar.
    if (notificacionesPreferidas()) {
      pedirPermisoNotificaciones();
    }
    // Arranca en segundo plano y navega de inmediato: la pantalla de
    // Revisión es la que muestra el progreso página por página, así el
    // usuario nunca ve una pantalla "congelada" esperando.
    iniciarEscaneo(archivo);
    navigate('/revisar');
  }

  function manejarJsonCargado(
    resultado: Parameters<typeof cargarResultadoDirecto>[0],
    nombreArchivo: string
  ) {
    cargarResultadoDirecto(resultado, nombreArchivo);
    navigate('/revisar');
  }

  return (
    <div>
      <EncabezadoVista
        titulo="Escanear reporte"
        subtitulo="Foto de la hoja o sube el PDF/imagen del reporte de visita"
      />

      <CapturaArchivo onArchivoSeleccionado={manejarArchivo} />
      <CapturaJson onCargado={manejarJsonCargado} />
    </div>
  );
}
