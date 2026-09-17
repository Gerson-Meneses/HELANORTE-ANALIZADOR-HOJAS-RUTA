import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Cliente, Encabezado, EquipoAsignado, OcrExtractResponse } from '../types/ocr';
import { EncabezadoVista } from '../shared/components/EncabezadoVista';
import { Boton } from '../shared/components/Boton';
import { FilaClienteEditable } from '../features/scan/components/FilaClienteEditable';
import { EditorEncabezado } from '../features/scan/components/EditorEncabezado';
import { guardarResultadoEscaneo } from '../features/scan/guardarResultadoEscaneo';
import styles from './RevisarView.module.css';

interface EstadoNavegacion {
  resultado: OcrExtractResponse;
  nombreArchivo: string;
}

/** Códigos de cliente mencionados en alguna advertencia del backend. */
function extraerCodigosConAdvertencia(advertencias: string[]): Set<string> {
  const codigos = new Set<string>();
  for (const texto of advertencias) {
    const m = texto.match(/\[([^\]]+)\]/);
    if (m) codigos.add(m[1]);
  }
  return codigos;
}

export function RevisarView() {
  const location = useLocation();
  const navigate = useNavigate();
  const estado = location.state as EstadoNavegacion | null;

  const [clientes, setClientes] = useState<Cliente[]>(estado?.resultado.clientes ?? []);
  const [encabezado, setEncabezado] = useState<Encabezado>(
    estado?.resultado.encabezado ?? {
      empresa: null,
      fecha_reporte: null,
      vendedor_numero: null,
      vendedor_nombre: null,
      ruta_venta: null,
      dia_visita: null,
      total_clientes_visitar: null,
    }
  );
  const [guardando, setGuardando] = useState(false);

  if (!estado) {
    return (
      <div className={styles.vacio}>
        <p>No hay ningún resultado de escaneo para revisar.</p>
        <Boton onClick={() => navigate('/escanear')}>Ir a escanear</Boton>
      </div>
    );
  }

  // Se captura en constante local porque TypeScript no propaga el chequeo
  // "if (!estado)" de arriba hacia el interior de las funciones anidadas
  // (closures) definidas más abajo.
  const { resultado, nombreArchivo } = estado;
  const codigosConAdvertencia = extraerCodigosConAdvertencia(resultado.advertencias);

  function cambiarCampo(indice: number, campo: keyof Cliente, valor: string) {
    setClientes((prev) => {
      const copia = [...prev];
      const esNumero = [
        'muc_monto',
        'acu_mes',
        'mma',
        'mpp',
        'ren_maquina',
        'obj_pdv',
      ].includes(campo as string);
      copia[indice] = {
        ...copia[indice],
        [campo]: esNumero ? (valor === '' ? null : Number(valor)) : valor,
      };
      return copia;
    });
  }

  function cambiarEquipos(indice: number, equipos: EquipoAsignado[]) {
    setClientes((prev) => {
      const copia = [...prev];
      copia[indice] = { ...copia[indice], equipos };
      return copia;
    });
  }

  function cambiarEncabezado(campo: keyof Encabezado, valor: string) {
    setEncabezado((prev) => ({ ...prev, [campo]: valor }));
  }

  function eliminarCliente(indice: number) {
    setClientes((prev) => prev.filter((_, i) => i !== indice));
  }

  async function confirmarGuardado() {
    setGuardando(true);
    try {
      await guardarResultadoEscaneo({
        encabezado,
        clientes,
        nombreArchivo,
        metodoExtraccion: resultado.metodo_extraccion,
      });
      navigate('/');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className={styles.vista}>
      <EncabezadoVista
        titulo="Revisar antes de guardar"
        subtitulo={`${clientes.length} clientes`}
      />

      <EditorEncabezado encabezado={encabezado} onCambiar={cambiarEncabezado} />

      {resultado.advertencias.length > 0 && (
        <div className={styles.avisoGeneral}>
          <strong>{resultado.advertencias.length} advertencia(s) del OCR.</strong>{' '}
          Los clientes marcados como "Revisar" abajo vienen abiertos para que confirmes esos
          datos.
        </div>
      )}

      <div className={styles.lista}>
        {clientes.map((cliente, indice) => (
          <FilaClienteEditable
            key={`${cliente.codigo}-${indice}`}
            cliente={cliente}
            tieneAdvertencia={codigosConAdvertencia.has(cliente.codigo ?? '')}
            onCambiar={(campo, valor) => cambiarCampo(indice, campo, valor)}
            onCambiarEquipos={(equipos) => cambiarEquipos(indice, equipos)}
            onEliminar={() => eliminarCliente(indice)}
          />
        ))}
      </div>

      <div className={styles.barraInferior}>
        <Boton variante="secundario" onClick={() => navigate('/escanear')} disabled={guardando}>
          Descartar
        </Boton>
        <Boton onClick={confirmarGuardado} disabled={guardando || clientes.length === 0}>
          {guardando ? 'Guardando…' : `Guardar ${clientes.length} clientes`}
        </Boton>
      </div>
    </div>
  );
}
