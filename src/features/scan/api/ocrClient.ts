import type { OcrExtractResponse } from '../../../types/ocr';
import { getOcrServiceUrl } from './config';

export class OcrServiceError extends Error {}

export async function extraerDatos(archivo: File): Promise<OcrExtractResponse> {
  const url = `${getOcrServiceUrl()}/extract-ocr`;
  const formData = new FormData();
  formData.append('file', archivo);

  let respuesta: Response;
  try {
    respuesta = await fetch(url, { method: 'POST', body: formData });
  } catch {
    throw new OcrServiceError(
      `No se pudo conectar con el servicio de OCR en ${url}. Revisa la URL en ` +
        'Ajustes y que el servicio esté encendido.'
    );
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    throw new OcrServiceError(
      `El servicio de OCR respondió con error ${respuesta.status}. ${detalle}`.trim()
    );
  }

  return (await respuesta.json()) as OcrExtractResponse;
}

export async function verificarSalud(): Promise<boolean> {
  try {
    const respuesta = await fetch(`${getOcrServiceUrl()}/health`);
    if (!respuesta.ok) return false;
    const data = await respuesta.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * "Despierta" el microservicio sin bloquear nada ni mostrar error alguno.
 * Los free tiers de Render (y similares) duermen el servicio tras un rato
 * de inactividad; la primera petición real tarda ~30-50s en responder
 * mientras arranca. Disparar esto apenas carga la app significa que, para
 * cuando el usuario realmente vaya a escanear, el servicio ya esté listo.
 */
export function despertarServicio(): void {
  fetch(`${getOcrServiceUrl()}/health`).catch(() => {
    /* silencioso a propósito: esto es solo un "empujón", no una petición real */
  });
}
