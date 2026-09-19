import { useNavigate } from 'react-router-dom';
import { EncabezadoVista } from '../shared/components/EncabezadoVista';
import { CapturaJson } from '../features/scan/components/CapturaJson';
import { PegarTexto } from '../features/scan/components/PegarTexto';
import { CapturaArchivoLocal } from '../features/scan/components/CapturaArchivoLocal';
import { CapturaCamara } from '../features/scan/components/CapturaCamara';
import { iniciarEscaneo, cargarResultadoDirecto } from '../features/scan/scanManager';
import { pedirPermisoNotificaciones, notificacionesPreferidas } from '../utils/notificaciones';
import type { OcrExtractResponse } from '../types/ocr';
import styles from './EscanearView.module.css';

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

  function manejarResultadoDirecto(resultado: OcrExtractResponse, nombreArchivo: string) {
    cargarResultadoDirecto(resultado, nombreArchivo);
    navigate('/revisar');
  }

  return (
    <div>
      <EncabezadoVista
        titulo="Escanear reporte"
        subtitulo="Elige cómo quieres cargar los datos — todas las opciones son igual de válidas"
      />

      <div className={styles.opciones}>
        <CapturaJson onCargado={manejarResultadoDirecto} />
        <PegarTexto onCargado={manejarResultadoDirecto} />
        <CapturaArchivoLocal onArchivoSeleccionado={manejarArchivo} />
        <CapturaCamara onArchivoSeleccionado={manejarArchivo} />
      </div>
    </div>
  );
}
