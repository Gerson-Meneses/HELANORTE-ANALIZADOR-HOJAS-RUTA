import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EncabezadoVista } from '../shared/components/EncabezadoVista';
import { Cargando } from '../shared/components/Cargando';
import { CapturaArchivo } from '../features/scan/components/CapturaArchivo';
import { extraerDatos, OcrServiceError } from '../features/scan/api/ocrClient';
import styles from './EscanearView.module.css';

const MENSAJES_CARGA = [
  'Enviando el archivo al servicio de OCR…',
  'Leyendo el texto de la hoja…',
  'Interpretando clientes y montos…',
];

export function EscanearView() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [mensajeCarga, setMensajeCarga] = useState(MENSAJES_CARGA[0]);
  const [error, setError] = useState<string | null>(null);

  async function manejarArchivo(archivo: File) {
    setError(null);
    setCargando(true);
    let indice = 0;
    const intervalo = setInterval(() => {
      indice = (indice + 1) % MENSAJES_CARGA.length;
      setMensajeCarga(MENSAJES_CARGA[indice]);
    }, 2500);

    try {
      const resultado = await extraerDatos(archivo);
      navigate('/revisar', { state: { resultado, nombreArchivo: archivo.name } });
    } catch (err) {
      const mensaje =
        err instanceof OcrServiceError
          ? err.message
          : 'Ocurrió un error inesperado al procesar el archivo.';
      setError(mensaje);
    } finally {
      clearInterval(intervalo);
      setCargando(false);
    }
  }

  return (
    <div>
      <EncabezadoVista
        titulo="Escanear reporte"
        subtitulo="Foto de la hoja o sube el PDF/imagen del reporte de visita"
      />

      {cargando ? (
        <Cargando mensaje={mensajeCarga} />
      ) : (
        <>
          {error && <p className={styles.error}>{error}</p>}
          <CapturaArchivo onArchivoSeleccionado={manejarArchivo} />
        </>
      )}
    </div>
  );
}
