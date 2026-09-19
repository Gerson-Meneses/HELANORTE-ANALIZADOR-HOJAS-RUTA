import { useState } from 'react';
import type { OcrExtractResponse } from '../../../types/ocr';
import { Boton } from '../../../shared/components/Boton';
import { parsearResultadoExterno, FormatoInvalidoError } from '../parseResultadoExterno';
import styles from './PegarTexto.module.css';

interface PegarTextoProps {
  onCargado: (resultado: OcrExtractResponse, nombreArchivo: string) => void;
}

export function PegarTexto({ onCargado }: PegarTextoProps) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);

  function procesar() {
    setError(null);
    try {
      const resultado = parsearResultadoExterno(texto);
      onCargado(resultado, 'pegado-como-texto');
      setTexto('');
      setAbierto(false);
    } catch (err) {
      setError(err instanceof FormatoInvalidoError ? err.message : 'No se pudo interpretar el texto.');
    }
  }

  if (!abierto) {
    return (
      <div className={styles.contenedorBoton}>
        <Boton variante="secundario" onClick={() => setAbierto(true)}>
          Pegar texto JSON o JS (de otro OCR)
        </Boton>
      </div>
    );
  }

  return (
    <div className={styles.contenedor}>
      <textarea
        className={styles.textarea}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder='{"encabezado": {...}, "clientes": [...]}'
        rows={6}
        autoFocus
      />
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.acciones}>
        <Boton
          variante="secundario"
          onClick={() => {
            setAbierto(false);
            setTexto('');
            setError(null);
          }}
        >
          Cancelar
        </Boton>
        <Boton onClick={procesar} disabled={!texto.trim()}>
          Usar este texto
        </Boton>
      </div>
    </div>
  );
}
