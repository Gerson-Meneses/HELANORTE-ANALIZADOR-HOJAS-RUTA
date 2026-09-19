import type { Cliente, Encabezado, OcrExtractResponse } from '../../types/ocr';
import { extraerDatos, OcrServiceError } from './api/ocrClient';
import { dividirPdfEnPaginas } from './pdfSplitter';
import { mostrarNotificacion, notificacionesPreferidas } from '../../utils/notificaciones';

export interface EstadoEscaneo {
  activo: boolean; // true mientras haya algo cargado/cargándose para revisar
  procesando: boolean;
  completado: boolean;
  /** true si se recuperó un escaneo que se cortó a mitad de camino (ej. el
   * navegador recargó la página por falta de memoria mientras procesaba). */
  interrumpido: boolean;
  error: string | null;
  paginaActual: number;
  totalPaginas: number;
  encabezado: Encabezado | null;
  clientes: Cliente[];
  advertencias: string[];
  metodoExtraccion: string;
  nombreArchivo: string;
}

function estadoVacio(): EstadoEscaneo {
  return {
    activo: false,
    procesando: false,
    completado: false,
    interrumpido: false,
    error: null,
    paginaActual: 0,
    totalPaginas: 0,
    encabezado: null,
    clientes: [],
    advertencias: [],
    metodoExtraccion: 'ocr',
    nombreArchivo: '',
  };
}

const CLAVE_SESSION = 'helanorte:escaneo_en_progreso';

/**
 * Guarda el estado en sessionStorage en cada cambio. Esto es lo que
 * permite recuperar el progreso si el navegador recarga la página a la
 * fuerza (ej. Android mata la pestaña en segundo plano por falta de
 * memoria mientras se usa la cámara) — sin esto, esa recarga perdía TODO
 * el escaneo en curso sin dejar rastro.
 */
function guardarEnSession(e: EstadoEscaneo): void {
  try {
    sessionStorage.setItem(CLAVE_SESSION, JSON.stringify(e));
  } catch {
    /* sessionStorage puede fallar en modo incógnito estricto; no es crítico */
  }
}

function leerDeSession(): EstadoEscaneo {
  try {
    const guardado = sessionStorage.getItem(CLAVE_SESSION);
    if (!guardado) return estadoVacio();
    const datos = JSON.parse(guardado) as EstadoEscaneo;
    if (datos.procesando) {
      // Si quedó marcado como "procesando", es porque la recarga pasó a
      // mitad de camino: lo que estaba corriendo en memoria ya no existe,
      // así que se marca como interrumpido en vez de "procesando" para
      // siempre (lo que congelaría la pantalla de Revisión).
      datos.procesando = false;
      datos.interrumpido = datos.activo && !datos.completado;
    }
    return datos;
  } catch {
    return estadoVacio();
  }
}

type Escucha = (estado: EstadoEscaneo) => void;

let estado: EstadoEscaneo = leerDeSession();
const escuchas = new Set<Escucha>();

function notificar() {
  // Nueva referencia de objeto siempre, para que React detecte el cambio.
  estado = { ...estado };
  guardarEnSession(estado);
  escuchas.forEach((fn) => fn(estado));
}

export function suscribirseAEscaneo(fn: Escucha): () => void {
  escuchas.add(fn);
  fn(estado);
  return () => {
    escuchas.delete(fn);
  };
}

export function obtenerEstadoEscaneo(): EstadoEscaneo {
  return estado;
}

export function limpiarEscaneo(): void {
  estado = estadoVacio();
  try {
    sessionStorage.removeItem(CLAVE_SESSION);
  } catch {
    /* no crítico */
  }
  notificar();
}

/**
 * Arranca el escaneo de un archivo (foto o PDF) EN SEGUNDO PLANO. La
 * función no espera a que termine — vuelve de inmediato para que la
 * pantalla pueda navegar a "Revisar" ya mismo, y desde ahí ir viendo los
 * clientes de cada página a medida que van llegando, sin sentir que la
 * app se quedó colgada.
 */
export function iniciarEscaneo(archivo: File): void {
  estado = { ...estadoVacio(), activo: true, procesando: true, nombreArchivo: archivo.name };
  notificar();
  procesarEnSegundoPlano(archivo).catch((err) => {
    estado.error = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
    estado.procesando = false;
    notificar();
  });
}

async function procesarEnSegundoPlano(archivo: File): Promise<void> {
  let paginas: File[];

  if (archivo.type === 'application/pdf') {
    try {
      paginas = await dividirPdfEnPaginas(archivo);
    } catch (err) {
      throw new Error(
        `No se pudo dividir el PDF en páginas: ${
          err instanceof Error ? err.message : 'error desconocido'
        }`
      );
    }
  } else {
    paginas = [archivo];
  }

  estado.totalPaginas = paginas.length;
  notificar();

  for (let i = 0; i < paginas.length; i++) {
    estado.paginaActual = i + 1;
    notificar();

    let resultado: OcrExtractResponse;
    try {
      resultado = await extraerDatos(paginas[i]);
    } catch (err) {
      const mensaje =
        err instanceof OcrServiceError
          ? err.message
          : `Error procesando la página ${i + 1}: ${
              err instanceof Error ? err.message : 'desconocido'
            }`;
      // No se corta todo el escaneo por una página que falló: se deja
      // constancia como advertencia y se sigue con las demás.
      estado.advertencias = [...estado.advertencias, `[Página ${i + 1}] ${mensaje}`];
      notificar();
      continue;
    }

    if (!estado.encabezado) estado.encabezado = resultado.encabezado;
    estado.clientes = [...estado.clientes, ...resultado.clientes];
    estado.advertencias = [...estado.advertencias, ...resultado.advertencias];
    estado.metodoExtraccion = resultado.metodo_extraccion;
    notificar();
  }

  estado.completado = true;
  estado.procesando = false;
  notificar();
  avisarSiCorresponde();
}

/**
 * Notifica al terminar, pero SOLO si el usuario no está mirando la app en
 * ese momento (pestaña oculta o sin foco) — si la tiene abierta, ya está
 * viendo el progreso en vivo en la pantalla de Revisión, y una
 * notificación ahí sería redundante/molesta.
 */
function avisarSiCorresponde(): void {
  if (!notificacionesPreferidas()) return;
  const escondida = typeof document !== 'undefined' && document.hidden;
  const sinFoco = typeof document !== 'undefined' && !document.hasFocus();
  if (!escondida && !sinFoco) return;

  const cantidad = estado.clientes.length;
  const advertencias = estado.advertencias.length;
  mostrarNotificacion('Escaneo completado ✓', {
    body:
      `${cantidad} cliente${cantidad === 1 ? '' : 's'} encontrado${cantidad === 1 ? '' : 's'}` +
      (advertencias > 0 ? ` · ${advertencias} advertencia(s) para revisar` : ''),
    tag: 'helanorte-escaneo',
  });
}

/**
 * Para cuando el resultado ya viene armado de afuera: un JSON ya
 * estructurado (de otro OCR, o un respaldo), o cuando se quiere reabrir
 * un escaneo. No pasa por el microservicio en absoluto.
 */
export function cargarResultadoDirecto(
  resultado: OcrExtractResponse,
  nombreArchivo: string
): void {
  estado = {
    activo: true,
    procesando: false,
    completado: true,
    interrumpido: false,
    error: null,
    paginaActual: resultado.paginas_procesadas || 1,
    totalPaginas: resultado.paginas_procesadas || 1,
    encabezado: resultado.encabezado,
    clientes: resultado.clientes,
    advertencias: resultado.advertencias,
    metodoExtraccion: resultado.metodo_extraccion,
    nombreArchivo,
  };
  notificar();
}
