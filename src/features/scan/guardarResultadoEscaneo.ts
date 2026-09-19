import type { Cliente, Encabezado } from '../../types/ocr';
import type { ClienteGuardado, Escaneo, HistorialCliente } from '../../types/dominio';
import { guardarClientes, guardarEscaneo, agregarHistorial } from '../../db/database';

export async function guardarResultadoEscaneo(params: {
  encabezado: Encabezado;
  clientes: Cliente[];
  nombreArchivo: string;
  metodoExtraccion: string;
  paginasProcesadas: number;
}): Promise<Escaneo> {
  const ahora = new Date().toISOString();
  const escaneo: Escaneo = {
    id: crypto.randomUUID(),
    fecha_procesado: ahora,
    encabezado: params.encabezado,
    nombre_archivo: params.nombreArchivo,
    metodo_extraccion: params.metodoExtraccion,
    paginas_procesadas: params.paginasProcesadas,
  };

  const clientesGuardados: ClienteGuardado[] = params.clientes
    .filter((c) => c.codigo) // sin código no hay forma de identificarlo de forma estable
    .map((c) => ({
      ...c,
      id: c.codigo as string,
      escaneo_id: escaneo.id,
      actualizado_en: ahora,
    }));

  await guardarEscaneo(escaneo);
  await guardarClientes(clientesGuardados);

  const puntosHistorial: HistorialCliente[] = clientesGuardados.map((c) => ({
    id: crypto.randomUUID(),
    codigo: c.codigo as string,
    fecha: ahora,
    acu_mes: c.acu_mes,
    muc_monto: c.muc_monto,
    obj_pdv: c.obj_pdv,
    ren_maquina: c.ren_maquina,
  }));
  await Promise.all(puntosHistorial.map(agregarHistorial));

  return escaneo;
}
