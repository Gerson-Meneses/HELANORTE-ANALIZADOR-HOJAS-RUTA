/**
 * Estos tipos reflejan EXACTAMENTE los modelos Pydantic del microservicio
 * de OCR (`app/schemas.py`). Si cambias un campo allá, cámbialo aquí también.
 */

export interface EquipoAsignado {
  marca: string | null;
  modelo_codigo: string | null;
}

export interface Cliente {
  sec: string | null;
  ctg: string | null;
  codigo: string | null;
  nombre: string | null;
  ruc_dni: string | null;
  canal: string | null;
  negocio: string | null;
  direccion: string | null;

  ucm_fecha: string | null; // "DD/MM/AAAA"
  muc_monto: number | null;
  acu_mes: number | null;
  mma: number | null;
  mpp: number | null;
  ren_maquina: number | null;
  obj_pdv: number | null;

  equipos: EquipoAsignado[];

  texto_crudo?: string | null;
}

export interface Encabezado {
  empresa: string | null;
  fecha_reporte: string | null;
  vendedor_numero: string | null;
  vendedor_nombre: string | null;
  ruta_venta: string | null;
  dia_visita: string | null;
  total_clientes_visitar: number | null;
}

export interface OcrExtractResponse {
  encabezado: Encabezado;
  clientes: Cliente[];
  paginas_procesadas: number;
  metodo_extraccion: string;
  advertencias: string[];
}
