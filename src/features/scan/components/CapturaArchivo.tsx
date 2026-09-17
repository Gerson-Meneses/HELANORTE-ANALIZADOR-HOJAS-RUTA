import { useRef } from 'react';
import { Boton } from '../../../shared/components/Boton';
import styles from './CapturaArchivo.module.css';

interface CapturaArchivoProps {
  onArchivoSeleccionado: (archivo: File) => void;
  deshabilitado?: boolean;
}

export function CapturaArchivo({ onArchivoSeleccionado, deshabilitado }: CapturaArchivoProps) {
  const inputCamara = useRef<HTMLInputElement>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);

  function manejarCambio(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (archivo) onArchivoSeleccionado(archivo);
    e.target.value = ''; // permite volver a elegir el mismo archivo después
  }

  return (
    <div className={styles.contenedor}>
      <button
        type="button"
        className={styles.zonaCamara}
        onClick={() => inputCamara.current?.click()}
        disabled={deshabilitado}
      >
        <span className={styles.iconoGrande}>📷</span>
        <span className={styles.textoAccion}>Tomar foto de la hoja</span>
        <span className={styles.textoAyuda}>
          Buena luz, hoja plana y la cámara lo más recta posible sobre el papel
        </span>
      </button>

      <input
        ref={inputCamara}
        type="file"
        accept="image/*"
        capture="environment"
        className={styles.inputOculto}
        onChange={manejarCambio}
      />

      <div className={styles.separador}>
        <span>o</span>
      </div>

      <Boton
        variante="secundario"
        tamano="lg"
        onClick={() => inputArchivo.current?.click()}
        disabled={deshabilitado}
      >
        Subir foto o PDF desde el dispositivo
      </Boton>
      <input
        ref={inputArchivo}
        type="file"
        accept="image/*,application/pdf"
        className={styles.inputOculto}
        onChange={manejarCambio}
      />
    </div>
  );
}
