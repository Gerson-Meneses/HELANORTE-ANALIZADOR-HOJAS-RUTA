import { useRef } from 'react';
import { Boton } from '../../../shared/components/Boton';
import styles from './CapturaCamara.module.css';

interface Props {
  onArchivoSeleccionado: (archivo: File) => void;
  deshabilitado?: boolean;
}

export function CapturaCamara({ onArchivoSeleccionado, deshabilitado }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function manejarCambio(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (archivo) onArchivoSeleccionado(archivo);
    e.target.value = '';
  }

  return (
    <div className={styles.contenedor}>
      <Boton
        variante="secundario"
        onClick={() => inputRef.current?.click()}
        disabled={deshabilitado}
      >
        Tomar foto de la hoja
      </Boton>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className={styles.inputOculto}
        onChange={manejarCambio}
      />
    </div>
  );
}
