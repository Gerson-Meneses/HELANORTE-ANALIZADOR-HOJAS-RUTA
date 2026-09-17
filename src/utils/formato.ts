export function formatearMoneda(valor: number | null | undefined): string {
  if (valor == null) return '—';
  return valor.toLocaleString('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  });
}

export function formatearNumero(valor: number | null | undefined): string {
  if (valor == null) return '—';
  return valor.toLocaleString('es-PE', { maximumFractionDigits: 2 });
}

/** Convierte "DD/MM/AAAA" a Date, o null si no se puede interpretar. */
export function parsearFechaReporte(fecha: string | null | undefined): Date | null {
  if (!fecha) return null;
  const partes = fecha.split('/');
  if (partes.length !== 3) return null;
  const [dd, mm, aaaa] = partes.map(Number);
  const d = new Date(aaaa, mm - 1, dd);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function diasDesde(fecha: string | null | undefined): number | null {
  const d = parsearFechaReporte(fecha);
  if (!d) return null;
  const hoy = new Date();
  const diffMs = hoy.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatearFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Convierte "DD/MM/AAAA" a "AAAA-MM". Si no se puede interpretar, null. */
export function anioMesDesdeFecha(fecha: string | null | undefined): string | null {
  const d = parsearFechaReporte(fecha);
  if (!d) return null;
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mes}`;
}

const NOMBRES_MES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "2026-08" -> "agosto 2026" */
export function etiquetaAnioMes(anioMes: string): string {
  const [anio, mes] = anioMes.split('-').map(Number);
  const nombre = NOMBRES_MES[(mes ?? 1) - 1] ?? anioMes;
  return `${nombre} ${anio}`;
}
