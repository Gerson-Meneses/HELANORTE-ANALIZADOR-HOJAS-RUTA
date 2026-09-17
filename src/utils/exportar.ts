import type { ClienteGuardado } from '../types/dominio';

const COLUMNAS: Array<{ clave: keyof ClienteGuardado; encabezado: string }> = [
  { clave: 'codigo', encabezado: 'Código' },
  { clave: 'nombre', encabezado: 'Nombre' },
  { clave: 'ruc_dni', encabezado: 'RUC/DNI' },
  { clave: 'canal', encabezado: 'Canal' },
  { clave: 'negocio', encabezado: 'Negocio' },
  { clave: 'direccion', encabezado: 'Dirección' },
  { clave: 'ucm_fecha', encabezado: 'Última compra' },
  { clave: 'muc_monto', encabezado: 'Monto última compra' },
  { clave: 'acu_mes', encabezado: 'Acumulado mes' },
  { clave: 'mma', encabezado: 'Mes anterior (MMA)' },
  { clave: 'obj_pdv', encabezado: 'Objetivo del mes' },
];

function celdaCsv(valor: unknown): string {
  if (valor == null) return '';
  const texto = String(valor);
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function clientesACsv(clientes: ClienteGuardado[]): string {
  const encabezado = COLUMNAS.map((c) => c.encabezado).join(',');
  const filas = clientes.map((cliente) =>
    COLUMNAS.map((c) => celdaCsv(cliente[c.clave])).join(',')
  );
  return [encabezado, ...filas].join('\n');
}

export function descargarArchivo(contenido: string, nombreArchivo: string, tipo: string) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
