import type * as PdfjsLib from 'pdfjs-dist';

// Escala relativa a 72 DPI (la unidad "punto" de PDF.js): 300/72 ≈ 4.17.
// Se usa 300 DPI a propósito porque el microservicio de OCR ya viene
// afinado y probado con esa resolución — bajarla degrada la precisión
// (se probó y se descartó en el backend por la misma razón).
const ESCALA_300_DPI = 300 / 72;

let pdfjsLibPromise: Promise<typeof PdfjsLib> | null = null;

/**
 * pdf.js pesa >1 MB — se carga solo la primera vez que hace falta (cuando
 * el usuario realmente sube un PDF), no en la carga inicial de la app.
 * Import dinámico = Vite lo separa en su propio archivo aparte.
 */
async function cargarPdfjs(): Promise<typeof PdfjsLib> {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist').then(async (lib) => {
      const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
      lib.GlobalWorkerOptions.workerSrc = workerUrl;
      return lib;
    });
  }
  return pdfjsLibPromise;
}

/**
 * Convierte un PDF (File) en una lista de imágenes PNG, una por página,
 * renderizadas en el navegador con pdf.js. Cada imagen se puede subir al
 * microservicio de OCR exactamente igual que si fuera una foto.
 */
export async function dividirPdfEnPaginas(archivo: File): Promise<File[]> {
  const pdfjsLib = await cargarPdfjs();
  const bytes = await archivo.arrayBuffer();
  const tareaCarga = pdfjsLib.getDocument({ data: bytes });
  const documento = await tareaCarga.promise;

  const paginas: File[] = [];
  for (let numero = 1; numero <= documento.numPages; numero++) {
    const pagina = await documento.getPage(numero);
    const viewport = pagina.getViewport({ scale: ESCALA_300_DPI });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const contexto = canvas.getContext('2d');
    if (!contexto) throw new Error('No se pudo preparar el lienzo para renderizar el PDF.');

    await pagina.render({ canvasContext: contexto, viewport, canvas }).promise;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
    if (!blob) throw new Error(`No se pudo convertir la página ${numero} a imagen.`);

    const nombreBase = archivo.name.replace(/\.pdf$/i, '');
    paginas.push(new File([blob], `${nombreBase}-pagina-${numero}.png`, { type: 'image/png' }));

    // Libera el lienzo cuanto antes; en documentos largos, en un celular,
    // acumular canvases sin soltar puede pesar bastante.
    canvas.width = 0;
    canvas.height = 0;
  }

  await tareaCarga.destroy();
  return paginas;
}
