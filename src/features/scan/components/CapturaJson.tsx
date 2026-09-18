import { useRef, useState } from 'react';
import type { OcrExtractResponse } from '../../../types/ocr';
import styles from './CapturaJson.module.css';

interface CapturaJsonProps {
  onCargado: (resultado: OcrExtractResponse, nombreArchivo: string) => void;
}

/** Chequeo mínimo de forma: no valida cada campo, solo que "parezca" el JSON esperado. */
function pareceResultadoValido(valor: unknown): valor is Record<string, unknown> {
  if (!valor || typeof valor !== 'object') return false;
  const v = valor as Record<string, unknown>;
  return typeof v.encabezado === 'object' && v.encabezado !== null && Array.isArray(v.clientes);
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
      const json: unknown = JSON.parse(texto);

      if (!pareceResultadoValido(json)) {
        setError(
          'El archivo no tiene la forma esperada (falta "encabezado" o "clientes"). ' +
            'Revisa que sea el JSON con la estructura del microservicio de OCR.'
        );
        return;
      }

      // Se acepta con flexibilidad: si al cliente le falta algún campo (ej.
      // "equipos" porque el otro OCR no lo produce), se rellena con un
      // valor por defecto en vez de rechazar todo el archivo.
      const clientesCrudos = json.clientes as Array<Record<string, unknown>>;
      const resultado: OcrExtractResponse = {
        encabezado: json.encabezado as OcrExtractResponse['encabezado'],
        clientes: clientesCrudos.map((c) => ({
          equipos: [],
          ...c,
        })) as unknown as OcrExtractResponse['clientes'],
        paginas_procesadas: (json.paginas_procesadas as number) ?? 1,
        metodo_extraccion: (json.metodo_extraccion as string) ?? 'externo',
        advertencias: Array.isArray(json.advertencias) ? (json.advertencias as string[]) : [],
      };

      onCargado(resultado, archivo.name);
    } catch {
      setError('No se pudo leer ese archivo como JSON válido.');
    }
  }

  return (
    <div className={styles.contenedor}>
      <button type="button" className={styles.boton} onClick={() => inputRef.current?.click()}>
        Cargar un JSON ya estructurado (de otro OCR)
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className={styles.inputOculto}
        onChange={manejarArchivo}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
