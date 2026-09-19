import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Cliente, Encabezado, EquipoAsignado } from '../types/ocr';
import { EncabezadoVista } from '../shared/components/EncabezadoVista';
import { Boton } from '../shared/components/Boton';
import { FilaClienteEditable } from '../features/scan/components/FilaClienteEditable';
import { EditorEncabezado } from '../features/scan/components/EditorEncabezado';
import { guardarResultadoEscaneo } from '../features/scan/guardarResultadoEscaneo';
import { useEscaneoEnProgreso } from '../features/scan/useEscaneoEnProgreso';
import { limpiarEscaneo } from '../features/scan/scanManager';
import styles from './RevisarView.module.css';

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
  const navigate = useNavigate();
  const progreso = useEscaneoEnProgreso();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [encabezado, setEncabezado] = useState<Encabezado | null>(null);
  const [guardando, setGuardando] = useState(false);
  const cantidadIncorporada = useRef(0);

  // A medida que van llegando páginas del gestor de escaneo, se van
  // AGREGANDO al final de la lista editable, sin tocar las que el usuario
  // ya empezó a corregir — así puede ir revisando la página 1 mientras la
  // 2 y 3 siguen procesándose solas.
  useEffect(() => {
    if (progreso.clientes.length > cantidadIncorporada.current) {
      const nuevos = progreso.clientes.slice(cantidadIncorporada.current);
      setClientes((prev) => [...prev, ...nuevos]);
      cantidadIncorporada.current = progreso.clientes.length;
    }
  }, [progreso.clientes]);

  useEffect(() => {
    if (progreso.encabezado && !encabezado) {
      setEncabezado(progreso.encabezado);
    }
  }, [progreso.encabezado, encabezado]);

  const codigosConAdvertencia = extraerCodigosConAdvertencia(progreso.advertencias);

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
    setEncabezado((prev) => (prev ? { ...prev, [campo]: valor } : prev));
  }

  function eliminarCliente(indice: number) {
    setClientes((prev) => prev.filter((_, i) => i !== indice));
  }

  function descartar() {
    limpiarEscaneo();
    navigate('/escanear');
  }

  async function confirmarGuardado() {
    if (!encabezado) return;
    setGuardando(true);
    try {
      await guardarResultadoEscaneo({
        encabezado,
        clientes,
        nombreArchivo: progreso.nombreArchivo,
        metodoExtraccion: progreso.metodoExtraccion,
        paginasProcesadas: progreso.totalPaginas || 1,
      });
      limpiarEscaneo();
      navigate('/');
    } finally {
      setGuardando(false);
    }
  }

  if (!progreso.activo) {
    return (
      <div className={styles.vacio}>
        <p>No hay ningún escaneo en curso ni resultado para revisar.</p>
        <Boton onClick={() => navigate('/escanear')}>Ir a escanear</Boton>
      </div>
    );
  }

  if (progreso.error && clientes.length === 0) {
    return (
      <div className={styles.vacio}>
        <p className={styles.error}>{progreso.error}</p>
        <Boton onClick={() => navigate('/escanear')}>Volver a intentar</Boton>
      </div>
    );
  }

  return (
    <div className={styles.vista}>
      <EncabezadoVista
        titulo="Revisar antes de guardar"
        subtitulo={`${clientes.length} cliente(s) encontrados hasta ahora`}
      />

      {progreso.interrumpido && (
        <div className={styles.avisoInterrumpido}>
          <strong>El escaneo se interrumpió antes de terminar</strong> — probablemente el
          navegador se quedó sin memoria y recargó la página (pasa seguido al usar la cámara
          en Android). Esto es lo que se alcanzó a procesar; revísalo y guárdalo, y si faltan
          páginas puedes escanearlas aparte.
        </div>
      )}

      {progreso.procesando && (
        <div className={styles.progreso}>
          <span className={styles.spinnerChico} />
          <span>
            Procesando página {progreso.paginaActual} de {progreso.totalPaginas || '…'} — puedes
            ir revisando lo que ya llegó mientras tanto.
          </span>
        </div>
      )}

      {encabezado && (
        <EditorEncabezado encabezado={encabezado} onCambiar={cambiarEncabezado} />
      )}

      {progreso.advertencias.length > 0 && (
        <div className={styles.avisoGeneral}>
          <strong>{progreso.advertencias.length} advertencia(s) del OCR.</strong>{' '}
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

        {clientes.length === 0 && progreso.procesando && (
          <p className={styles.esperandoPrimeraPagina}>
            Esperando los primeros resultados de la página 1…
          </p>
        )}
      </div>

      <div className={styles.barraInferior}>
        <Boton variante="secundario" onClick={descartar} disabled={guardando}>
          Descartar
        </Boton>
        <Boton
          onClick={confirmarGuardado}
          disabled={guardando || progreso.procesando || clientes.length === 0}
          title={progreso.procesando ? 'Espera a que terminen todas las páginas' : undefined}
        >
          {guardando
            ? 'Guardando…'
            : progreso.procesando
              ? 'Procesando…'
              : `Guardar ${clientes.length} clientes`}
        </Boton>
      </div>
    </div>
  );
}
