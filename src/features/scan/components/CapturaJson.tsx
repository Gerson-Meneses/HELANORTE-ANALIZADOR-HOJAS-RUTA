import { useRef, useState } from 'react';
import type { OcrExtractResponse } from '../../../types/ocr';
import { Boton } from '../../../shared/components/Boton';
import { parsearResultadoExterno, FormatoInvalidoError } from '../parseResultadoExterno';
import styles from './CapturaJson.module.css';

interface CapturaJsonProps {
  onCargado: (resultado: OcrExtractResponse, nombreArchivo: string) => void;
}

export function CapturaJson({ onCargado }: CapturaJsonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;

    setError(null);
    try {
      const texto = await archivo.text();
      const resultado = parsearResultadoExterno(texto);
      onCargado(resultado, archivo.name);
    } catch (err) {
      setError(err instanceof FormatoInvalidoError ? err.message : 'No se pudo leer ese archivo.');
    }
  }

  return (
    <div className={styles.contenedor}>
      <Boton variante="secundario" onClick={() => inputRef.current?.click()}>
        Cargar archivo JSON o JS (de otro OCR)
      </Boton>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json,.js,text/plain,.txt"
        className={styles.inputOculto}
        onChange={manejarArchivo}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
