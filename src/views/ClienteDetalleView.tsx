import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientesConSalud } from '../features/clients/useClientesConSalud';
import {
  getHistorialDeCliente,
  guardarClientes,
  eliminarCliente as eliminarClienteDB,
  getEscaneo,
  guardarEscaneo,
} from '../db/database';
import type { HistorialCliente, CriterioSalud } from '../types/dominio';
import type { Cliente, Encabezado, EquipoAsignado } from '../types/ocr';
import type { Escaneo } from '../types/dominio';
import { EncabezadoVista } from '../shared/components/EncabezadoVista';
import { InsigniaSalud } from '../shared/components/InsigniaSalud';
import { Sparkline } from '../shared/components/Sparkline';
import { Boton } from '../shared/components/Boton';
import { Cargando } from '../shared/components/Cargando';
import { DesgloseSalud } from '../features/clients/components/DesgloseSalud';
import { EditorCriterioSalud } from '../features/clients/components/EditorCriterioSalud';
import { EditorCuotas } from '../features/clients/components/EditorCuotas';
import { EditorEquipos } from '../features/clients/components/EditorEquipos';
import { EditorEncabezado } from '../features/scan/components/EditorEncabezado';
import { formatearMoneda, diasDesde, formatearFechaCorta } from '../utils/formato';
import { leerOrdenActual } from '../utils/ordenActual';
import styles from './ClienteDetalleView.module.css';

const CAMPOS_TEXTO: Array<{ clave: keyof Cliente; etiqueta: string }> = [
  { clave: 'nombre', etiqueta: 'Nombre' },
  { clave: 'ruc_dni', etiqueta: 'RUC / DNI' },
  { clave: 'canal', etiqueta: 'Canal' },
  { clave: 'negocio', etiqueta: 'Negocio' },
  { clave: 'direccion', etiqueta: 'Dirección' },
  { clave: 'ucm_fecha', etiqueta: 'Última compra (DD/MM/AAAA)' },
];

const CAMPOS_NUMERO: Array<{ clave: keyof Cliente; etiqueta: string }> = [
  { clave: 'muc_monto', etiqueta: 'Monto últ. compra' },
  { clave: 'acu_mes', etiqueta: 'Acumulado mes' },
  { clave: 'mma', etiqueta: 'Mes anterior (MMA)' },
  { clave: 'mpp', etiqueta: 'Promedio x pedido (MPP)' },
  { clave: 'ren_maquina', etiqueta: 'Rendimiento x máquina' },
  { clave: 'obj_pdv', etiqueta: 'Objetivo (hoja OCR)' },
];

const CAMPOS_NUMERICOS = new Set(CAMPOS_NUMERO.map((c) => c.clave));

export function ClienteDetalleView() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const { clientes, config, cargando, recargar, actualizarConfig } = useClientesConSalud();

  const [historial, setHistorial] = useState<HistorialCliente[]>([]);
  const [notas, setNotas] = useState('');
  const [mostrarPersonalizar, setMostrarPersonalizar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState<Cliente | null>(null);
  const [escaneoActual, setEscaneoActual] = useState<Escaneo | null>(null);
  const [guardandoRuta, setGuardandoRuta] = useState(false);

  const item = clientes.find((c) => c.cliente.codigo === codigo);

  useEffect(() => {
    if (!codigo) return;
    getHistorialDeCliente(codigo).then(setHistorial);
  }, [codigo]);

  useEffect(() => {
    if (item) setNotas(item.cliente.notas ?? '');
  }, [item]);

  useEffect(() => {
    if (item) getEscaneo(item.cliente.escaneo_id).then((e) => setEscaneoActual(e ?? null));
  }, [item?.cliente.escaneo_id]);

  if (cargando) return <Cargando mensaje="Cargando…" />;

  if (!item || !codigo) {
    return (
      <div className={styles.noEncontrado}>
        <p>No se encontró este cliente.</p>
        <Boton onClick={() => navigate('/')}>Volver a la lista</Boton>
      </div>
    );
  }

  const { cliente, salud } = item;
  const dias = diasDesde(cliente.ucm_fecha);
  // Ya se validó arriba que `codigo` existe; se fija en una constante para
  // que las funciones anidadas de más abajo no lo vean como "posiblemente
  // undefined" (TypeScript no propaga ese chequeo dentro de closures).
  const codigoCliente: string = codigo;

  // Navegación Siguiente/Anterior según el orden que se veía en la lista.
  const orden = leerOrdenActual();
  const posicion = orden.indexOf(codigoCliente);
  const anteriorCodigo = posicion > 0 ? orden[posicion - 1] : null;
  const siguienteCodigo =
    posicion >= 0 && posicion < orden.length - 1 ? orden[posicion + 1] : null;

  async function guardarNotas() {
    await guardarClientes([{ ...cliente, notas }]);
    await recargar();
  }

  function iniciarEdicion() {
    setBorrador({ ...cliente });
    setEditando(true);
  }

  function cambiarCampoBorrador(campo: keyof Cliente, valor: string) {
    setBorrador((prev) => {
      if (!prev) return prev;
      const esNumero = CAMPOS_NUMERICOS.has(campo);
      return { ...prev, [campo]: esNumero ? (valor === '' ? null : Number(valor)) : valor };
    });
  }

  function cambiarEquiposBorrador(equipos: EquipoAsignado[]) {
    setBorrador((prev) => (prev ? { ...prev, equipos } : prev));
  }

  async function guardarEdicion() {
    if (!borrador) return;
    await guardarClientes([
      { ...cliente, ...borrador, id: cliente.id, escaneo_id: cliente.escaneo_id },
    ]);
    setEditando(false);
    setBorrador(null);
    await recargar();
  }

  function cancelarEdicion() {
    setEditando(false);
    setBorrador(null);
  }

  async function eliminarEsteCliente() {
    const confirmado = window.confirm(
      `¿Eliminar a "${cliente.nombre ?? cliente.codigo}" de la lista? Esto no se puede deshacer.`
    );
    if (!confirmado) return;
    await eliminarClienteDB(cliente.id);
    navigate('/');
  }

  function cambiarEncabezadoBorrador(campo: keyof Encabezado, valor: string) {
    setEscaneoActual((prev) =>
      prev ? { ...prev, encabezado: { ...prev.encabezado, [campo]: valor } } : prev
    );
  }

  async function guardarEncabezado() {
    if (!escaneoActual) return;
    setGuardandoRuta(true);
    try {
      await guardarEscaneo(escaneoActual);
      await recargar();
    } finally {
      setGuardandoRuta(false);
    }
  }

  function overridesDeEsteCliente(): Record<string, Partial<CriterioSalud>> {
    return config.overridesPorCliente[codigoCliente] ?? {};
  }

  function criterioResuelto(base: CriterioSalud): CriterioSalud {
    const override = overridesDeEsteCliente()[base.id];
    return override ? { ...base, ...override } : base;
  }

  function tieneOverride(criterioId: string): boolean {
    return Boolean(overridesDeEsteCliente()[criterioId]);
  }

  async function guardarOverride(criterio: CriterioSalud) {
    const nuevosOverrides = { ...overridesDeEsteCliente(), [criterio.id]: criterio };
    await actualizarConfig({
      ...config,
      overridesPorCliente: { ...config.overridesPorCliente, [codigoCliente]: nuevosOverrides },
    });
  }

  async function quitarOverride(criterioId: string) {
    const nuevosOverrides = { ...overridesDeEsteCliente() };
    delete nuevosOverrides[criterioId];
    await actualizarConfig({
      ...config,
      overridesPorCliente: { ...config.overridesPorCliente, [codigoCliente]: nuevosOverrides },
    });
  }

  return (
    <div className={styles.vista}>
      <EncabezadoVista titulo={cliente.nombre || 'Cliente'} subtitulo={cliente.codigo ?? ''} />

      <div className={styles.navegacionRapida}>
        <button
          type="button"
          disabled={!anteriorCodigo}
          onClick={() => anteriorCodigo && navigate(`/clientes/${anteriorCodigo}`)}
        >
          ‹ Anterior
        </button>
        {orden.length > 0 && posicion >= 0 && (
          <span className={styles.posicion}>
            {posicion + 1} de {orden.length}
          </span>
        )}
        <button
          type="button"
          disabled={!siguienteCodigo}
          onClick={() => siguienteCodigo && navigate(`/clientes/${siguienteCodigo}`)}
        >
          Siguiente ›
        </button>
      </div>

      <div className={styles.contenido}>
        <section className={styles.tarjetaInfo}>
          <div className={styles.encabezadoTarjeta}>
            <InsigniaSalud nivel={salud.nivel} />
            {!editando && (
              <button type="button" className={styles.botonEditar} onClick={iniciarEdicion}>
                ✎ Editar
              </button>
            )}
          </div>

          {editando && borrador ? (
            <>
              <div className={styles.camposEdicion}>
                {CAMPOS_TEXTO.map(({ clave, etiqueta }) => (
                  <label key={clave} className={styles.campoEdicion}>
                    <span>{etiqueta}</span>
                    <input
                      type="text"
                      value={(borrador[clave] as string) ?? ''}
                      onChange={(e) => cambiarCampoBorrador(clave, e.target.value)}
                    />
                  </label>
                ))}
                {CAMPOS_NUMERO.map(({ clave, etiqueta }) => (
                  <label key={clave} className={styles.campoEdicion}>
                    <span>{etiqueta}</span>
                    <input
                      className="num"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={borrador[clave] == null ? '' : String(borrador[clave])}
                      onChange={(e) => cambiarCampoBorrador(clave, e.target.value)}
                    />
                  </label>
                ))}
              </div>

              <EditorEquipos equipos={borrador.equipos} onCambiar={cambiarEquiposBorrador} />

              {cliente.texto_crudo && (
                <details className={styles.detalleCrudo}>
                  <summary>Ver texto crudo leído por el OCR</summary>
                  <pre className={styles.pre}>{cliente.texto_crudo}</pre>
                </details>
              )}

              <div className={styles.accionesEdicion}>
                <Boton variante="secundario" onClick={cancelarEdicion}>
                  Cancelar
                </Boton>
                <Boton onClick={guardarEdicion}>Guardar cambios</Boton>
              </div>

              <Boton
                variante="peligro"
                onClick={eliminarEsteCliente}
                className={styles.botonEliminar}
              >
                Eliminar este cliente
              </Boton>
            </>
          ) : (
            <>
              <dl className={styles.datos}>
                <div>
                  <dt>Sec.</dt>
                  <dd>{cliente.sec ?? '—'}</dd>
                </div>
                <div>
                  <dt>Categoría</dt>
                  <dd>{cliente.ctg ?? '—'}</dd>
                </div>
                <div>
                  <dt>RUC / DNI</dt>
                  <dd className="num">{cliente.ruc_dni ?? '—'}</dd>
                </div>
                <div>
                  <dt>Canal</dt>
                  <dd>{cliente.canal ?? '—'}</dd>
                </div>
                <div>
                  <dt>Negocio</dt>
                  <dd>{cliente.negocio ?? '—'}</dd>
                </div>
                <div className={styles.datoAncho}>
                  <dt>Dirección</dt>
                  <dd>{cliente.direccion ?? '—'}</dd>
                </div>
                <div>
                  <dt>Última compra</dt>
                  <dd>
                    {cliente.ucm_fecha ?? '—'}
                    {dias != null && ` (hace ${dias} días)`}
                  </dd>
                </div>
                <div>
                  <dt>Monto última compra</dt>
                  <dd className="num">{formatearMoneda(cliente.muc_monto)}</dd>
                </div>
                <div>
                  <dt>Acumulado del mes</dt>
                  <dd className="num">{formatearMoneda(cliente.acu_mes)}</dd>
                </div>
                <div>
                  <dt>Monto mes anterior (MMA)</dt>
                  <dd className="num">{formatearMoneda(cliente.mma)}</dd>
                </div>
                <div>
                  <dt>Promedio x pedido (MPP)</dt>
                  <dd className="num">{formatearMoneda(cliente.mpp)}</dd>
                </div>
                <div>
                  <dt>Rendimiento x máquina</dt>
                  <dd className="num">{formatearMoneda(cliente.ren_maquina)}</dd>
                </div>
                <div>
                  <dt>Objetivo (hoja OCR)</dt>
                  <dd className="num">{formatearMoneda(cliente.obj_pdv)}</dd>
                </div>
                {item.pctCuota != null && (
                  <div>
                    <dt>% de cuota por máquina{item.cuotaEsManual ? '' : ' (general)'}</dt>
                    <dd className="num">{Math.round(item.pctCuota)}%</dd>
                  </div>
                )}
              </dl>

              <div className={styles.bloqueEquipos}>
                <span className={styles.etiquetaBloque}>
                  {cliente.equipos.length > 1
                    ? `Congeladores asignados (${cliente.equipos.length})`
                    : 'Congelador asignado'}
                </span>
                {cliente.equipos.length === 0 ? (
                  <p className={styles.sinEquipo}>Sin congelador asignado en esta hoja.</p>
                ) : (
                  <ul className={styles.listaEquipos}>
                    {cliente.equipos.map((eq, i) => (
                      <li key={i} className="num">
                        {eq.marca} {eq.modelo_codigo}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {cliente.texto_crudo && (
                <details className={styles.detalleCrudo}>
                  <summary>Ver texto crudo leído por el OCR</summary>
                  <pre className={styles.pre}>{cliente.texto_crudo}</pre>
                </details>
              )}

              {cliente.direccion && (
                <a
                  className={styles.enlaceMapa}
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    cliente.direccion
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir dirección en Google Maps
                </a>
              )}
            </>
          )}
        </section>

        {escaneoActual && (
          <section>
            <h2 className={styles.tituloSeccion}>Datos de la ruta / vendedor</h2>
            <EditorEncabezado
              encabezado={escaneoActual.encabezado}
              onCambiar={cambiarEncabezadoBorrador}
            />
            <p className={styles.infoEscaneo}>
              Procesado con: {escaneoActual.metodo_extraccion} · {escaneoActual.paginas_procesadas}{' '}
              página(s) · {formatearFechaCorta(escaneoActual.fecha_procesado)}
            </p>
            <Boton
              variante="secundario"
              onClick={guardarEncabezado}
              disabled={guardandoRuta}
              className={styles.botonGuardarRuta}
            >
              {guardandoRuta ? 'Guardando…' : 'Guardar datos de la ruta'}
            </Boton>
          </section>
        )}

        <section>
          <h2 className={styles.tituloSeccion}>Por qué tiene este semáforo</h2>
          <DesgloseSalud resultado={salud} />
        </section>

        <section>
          <h2 className={styles.tituloSeccion}>Cuota del mes</h2>
          <EditorCuotas
            codigoCliente={codigoCliente}
            anioMes={item.anioMes}
            equipos={cliente.equipos}
            acuMes={cliente.acu_mes}
            onCambio={recargar}
          />
        </section>

        <section>
          <h2 className={styles.tituloSeccion}>Historial de acumulado</h2>
          <Sparkline
            valores={historial.map((h) => h.acu_mes ?? 0).filter((v) => v > 0)}
          />
          {historial.length > 0 && (
            <p className={styles.fechaUltimoPunto}>
              Último dato: {formatearFechaCorta(historial[historial.length - 1].fecha)}
            </p>
          )}
        </section>

        <section>
          <h2 className={styles.tituloSeccion}>Notas</h2>
          <textarea
            className={styles.textarea}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            onBlur={guardarNotas}
            placeholder="Ej: pidió que lo visiten después de las 3pm los martes…"
            rows={3}
          />
        </section>

        <section>
          <button
            type="button"
            className={styles.togglePersonalizar}
            onClick={() => setMostrarPersonalizar((v) => !v)}
          >
            {mostrarPersonalizar ? '▾' : '▸'} Personalizar reglas de salud para este cliente
          </button>

          {mostrarPersonalizar && (
            <div className={styles.personalizar}>
              <p className={styles.ayudaPersonalizar}>
                Por defecto usa las reglas globales (configurables en Ajustes). Aquí puedes
                ajustar los umbrales solo para {cliente.nombre}.
              </p>
              {config.criterios.map((base) => (
                <div key={base.id}>
                  <EditorCriterioSalud
                    criterio={criterioResuelto(base)}
                    onCambiar={guardarOverride}
                  />
                  {tieneOverride(base.id) && (
                    <button
                      type="button"
                      className={styles.quitarOverride}
                      onClick={() => quitarOverride(base.id)}
                    >
                      Usar la regla global de nuevo
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
