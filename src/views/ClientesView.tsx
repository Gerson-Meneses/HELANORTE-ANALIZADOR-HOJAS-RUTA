import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientesConSalud } from '../features/clients/useClientesConSalud';
import {
  ordenarClientes,
  agruparClientes,
  type CriterioOrden,
  type CriterioAgrupacion,
} from '../features/clients/ordenarYAgrupar';
import { TarjetaCliente } from '../features/clients/components/TarjetaCliente';
import { ControlesLista } from '../features/clients/components/ControlesLista';
import { PanelFiltros, type FiltroCongelador } from '../features/clients/components/PanelFiltros';
import { EncabezadoVista } from '../shared/components/EncabezadoVista';
import { EstadoVacio } from '../shared/components/EstadoVacio';
import { Boton } from '../shared/components/Boton';
import { Cargando } from '../shared/components/Cargando';
import { getTodosLosEscaneos } from '../db/database';
import type { Escaneo } from '../types/dominio';
import { formatearFechaCorta } from '../utils/formato';
import { usePersistedState, esPrimeraVez } from '../shared/hooks/usePersistedState';
import { guardarOrdenActual } from '../utils/ordenActual';
import styles from './ClientesView.module.css';

const DIAS_SEMANA = [
  'DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO',
];

function coincideBusqueda(texto: string, termino: string): boolean {
  return texto.toLowerCase().includes(termino.toLowerCase());
}

function etiquetaEscaneo(e: Escaneo): string {
  const { ruta_venta, dia_visita } = e.encabezado;
  const base = [ruta_venta, dia_visita].filter(Boolean).join(' · ');
  return base || `Escaneo del ${formatearFechaCorta(e.fecha_procesado)}`;
}

const CLAVE_RUTAS = 'helanorte:filtro_rutas';

export function ClientesView() {
  const navigate = useNavigate();
  const { clientes, cargando } = useClientesConSalud();

  const [busqueda, setBusqueda] = usePersistedState('helanorte:filtro_busqueda', '');
  const [orden, setOrden] = usePersistedState<CriterioOrden>('helanorte:filtro_orden', 'salud');
  const [ascendente, setAscendente] = usePersistedState('helanorte:filtro_asc', true);
  const [agrupacion, setAgrupacion] = usePersistedState<CriterioAgrupacion>(
    'helanorte:filtro_agrupacion',
    'ninguno'
  );
  const [filtroCongelador, setFiltroCongelador] = usePersistedState<FiltroCongelador>(
    'helanorte:filtro_congelador',
    'todos'
  );
  // Ahora son listas: se puede elegir más de una ruta, vendedor o canal a
  // la vez (todos combinables entre sí con las demás listas y con el resto
  // de filtros — todo se aplica en conjunto, con "Y" entre categorías y
  // "O" dentro de una misma categoría).
  const [rutasSeleccionadas, setRutasSeleccionadas] = usePersistedState<string[]>(
    CLAVE_RUTAS,
    []
  );
  const [vendedoresSeleccionados, setVendedoresSeleccionados] = usePersistedState<string[]>(
    'helanorte:filtro_vendedores',
    []
  );
  const [canalesSeleccionados, setCanalesSeleccionados] = usePersistedState<string[]>(
    'helanorte:filtro_canales',
    []
  );
  const [escaneos, setEscaneos] = useState<Escaneo[]>([]);

  useEffect(() => {
    getTodosLosEscaneos().then((lista) => {
      lista.sort((a, b) => b.fecha_procesado.localeCompare(a.fecha_procesado));
      setEscaneos(lista);

      // Solo la PRIMERA vez que se abre la app (nunca se guardó un filtro
      // de ruta todavía): si hoy es, por ejemplo, miércoles, y hay una hoja
      // escaneada con "DIA VISITA: MIERCOLES", se filtra por esa de una vez.
      if (esPrimeraVez(CLAVE_RUTAS)) {
        const hoy = DIAS_SEMANA[new Date().getDay()];
        const deHoy = lista.find((e) => e.encabezado.dia_visita?.toUpperCase() === hoy);
        if (deHoy) setRutasSeleccionadas([deHoy.id]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes.length]);

  const opcionesRuta = useMemo(
    () => escaneos.map((e) => ({ valor: e.id, etiqueta: etiquetaEscaneo(e) })),
    [escaneos]
  );

  const opcionesVendedor = useMemo(() => {
    const set = new Set(
      clientes.map((c) => c.vendedorEtiqueta).filter((v) => v && v !== 'Sin vendedor')
    );
    return Array.from(set).sort();
  }, [clientes]);

  const opcionesCanal = useMemo(() => {
    const set = new Set(
      clientes.map((c) => c.cliente.canal).filter((v): v is string => Boolean(v))
    );
    return Array.from(set).sort();
  }, [clientes]);

  const filtrados = useMemo(() => {
    let resultado = clientes;

    if (rutasSeleccionadas.length > 0) {
      resultado = resultado.filter((c) => rutasSeleccionadas.includes(c.cliente.escaneo_id));
    }
    if (vendedoresSeleccionados.length > 0) {
      resultado = resultado.filter((c) => vendedoresSeleccionados.includes(c.vendedorEtiqueta));
    }
    if (canalesSeleccionados.length > 0) {
      resultado = resultado.filter(
        (c) => c.cliente.canal && canalesSeleccionados.includes(c.cliente.canal)
      );
    }
    if (filtroCongelador === 'sin') {
      resultado = resultado.filter((c) => c.cliente.equipos.length === 0);
    } else if (filtroCongelador === 'con') {
      resultado = resultado.filter((c) => c.cliente.equipos.length >= 1);
    } else if (filtroCongelador === 'mas_de_uno') {
      resultado = resultado.filter((c) => c.cliente.equipos.length > 1);
    }
    if (busqueda.trim()) {
      resultado = resultado.filter(({ cliente }) =>
        [cliente.nombre, cliente.codigo, cliente.direccion, cliente.ruc_dni]
          .filter(Boolean)
          .some((campo) => coincideBusqueda(campo as string, busqueda))
      );
    }
    return resultado;
  }, [
    clientes,
    rutasSeleccionadas,
    vendedoresSeleccionados,
    canalesSeleccionados,
    filtroCongelador,
    busqueda,
  ]);

  const ordenados = useMemo(
    () => ordenarClientes(filtrados, orden, ascendente),
    [filtrados, orden, ascendente]
  );

  const grupos = useMemo(() => agruparClientes(ordenados, agrupacion), [ordenados, agrupacion]);

  // Recuerda el orden final mostrado, para que la ficha de detalle pueda
  // ofrecer "Siguiente"/"Anterior" respetando exactamente este orden.
  useEffect(() => {
    guardarOrdenActual(ordenados.map((c) => c.cliente.codigo).filter(Boolean) as string[]);
  }, [ordenados]);

  const cantidadFiltrosActivos =
    (rutasSeleccionadas.length > 0 ? 1 : 0) +
    (vendedoresSeleccionados.length > 0 ? 1 : 0) +
    (canalesSeleccionados.length > 0 ? 1 : 0) +
    (filtroCongelador !== 'todos' ? 1 : 0);

  function limpiarTodosLosFiltros() {
    setRutasSeleccionadas([]);
    setVendedoresSeleccionados([]);
    setCanalesSeleccionados([]);
    setFiltroCongelador('todos');
  }

  if (cargando) return <Cargando mensaje="Cargando clientes guardados…" />;

  if (clientes.length === 0) {
    return (
      <EstadoVacio
        icono="🍦"
        titulo="Todavía no hay nada escaneado"
        descripcion="Escanea la hoja de ruta de hoy (foto o PDF) para empezar a ver el análisis de tus clientes."
        accion={<Boton onClick={() => navigate('/escanear')}>Escanear ahora</Boton>}
      />
    );
  }

  const cuantosMalos = filtrados.filter((c) => c.salud.nivel === 'malo').length;

  return (
    <div>
      <EncabezadoVista
        titulo="Clientes"
        subtitulo={
          cuantosMalos > 0
            ? `${cuantosMalos} cliente(s) necesitan atención de ${filtrados.length} en total`
            : `${filtrados.length} clientes guardados`
        }
      />

      <PanelFiltros
        rutas={opcionesRuta}
        rutasSeleccionadas={rutasSeleccionadas}
        onRutas={setRutasSeleccionadas}
        vendedores={opcionesVendedor}
        vendedoresSeleccionados={vendedoresSeleccionados}
        onVendedores={setVendedoresSeleccionados}
        canales={opcionesCanal}
        canalesSeleccionados={canalesSeleccionados}
        onCanales={setCanalesSeleccionados}
        filtroCongelador={filtroCongelador}
        onFiltroCongelador={setFiltroCongelador}
        cantidadFiltrosActivos={cantidadFiltrosActivos}
        onLimpiarTodo={limpiarTodosLosFiltros}
      />

      <ControlesLista
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        orden={orden}
        onOrden={setOrden}
        ascendente={ascendente}
        onAscendente={setAscendente}
        agrupacion={agrupacion}
        onAgrupacion={setAgrupacion}
      />

      {grupos.map((grupo) => (
        <section key={grupo.clave} className={styles.grupo}>
          {agrupacion !== 'ninguno' && (
            <h2 className={styles.tituloGrupo}>
              {grupo.etiqueta} <span className={styles.contadorGrupo}>{grupo.items.length}</span>
            </h2>
          )}
          {grupo.items.map((item) => (
            <TarjetaCliente key={item.cliente.id} {...item} />
          ))}
        </section>
      ))}
    </div>
  );
}
