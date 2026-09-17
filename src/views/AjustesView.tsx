import { useEffect, useRef, useState } from 'react';
import { EncabezadoVista } from '../shared/components/EncabezadoVista';
import { Boton } from '../shared/components/Boton';
import { useClientesConSalud } from '../features/clients/useClientesConSalud';
import { EditorCriterioSalud } from '../features/clients/components/EditorCriterioSalud';
import { getOcrServiceUrl, setOcrServiceUrl } from '../features/scan/api/config';
import { verificarSalud } from '../features/scan/api/ocrClient';
import { getTodosLosClientes, exportarRespaldo, importarRespaldo } from '../db/database';
import { clientesACsv, descargarArchivo } from '../utils/exportar';
import type { CriterioSalud } from '../types/dominio';
import styles from './AjustesView.module.css';

type EstadoConexion = 'sin_probar' | 'probando' | 'ok' | 'error';

export function AjustesView() {
  const { config, actualizarConfig } = useClientesConSalud();
  const [url, setUrl] = useState(getOcrServiceUrl());
  const [estadoConexion, setEstadoConexion] = useState<EstadoConexion>('sin_probar');
  const inputImportar = useRef<HTMLInputElement>(null);
  const [mensajeImportar, setMensajeImportar] = useState<string | null>(null);

  useEffect(() => {
    setEstadoConexion('sin_probar');
  }, [url]);

  async function probarConexion() {
    setOcrServiceUrl(url);
    setEstadoConexion('probando');
    const ok = await verificarSalud();
    setEstadoConexion(ok ? 'ok' : 'error');
  }

  async function actualizarCriterioGlobal(criterio: CriterioSalud) {
    const criterios = config.criterios.map((c) => (c.id === criterio.id ? criterio : c));
    await actualizarConfig({ ...config, criterios });
  }

  async function actualizarCuotaGeneral(valor: string) {
    const monto = Number(valor);
    await actualizarConfig({
      ...config,
      cuotaGeneralPorMaquina: Number.isNaN(monto) || monto < 0 ? 0 : monto,
    });
  }

  async function exportarCsv() {
    const clientes = await getTodosLosClientes();
    const csv = clientesACsv(clientes);
    descargarArchivo(csv, `clientes-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  }

  async function exportarRespaldoCompleto() {
    const respaldo = await exportarRespaldo();
    descargarArchivo(
      JSON.stringify(respaldo, null, 2),
      `respaldo-helanorte-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
  }

  async function manejarImportar(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    try {
      const texto = await archivo.text();
      const respaldo = JSON.parse(texto);
      await importarRespaldo(respaldo);
      setMensajeImportar('Respaldo importado correctamente.');
    } catch {
      setMensajeImportar('No se pudo leer ese archivo como respaldo válido.');
    }
  }

  return (
    <div className={styles.vista}>
      <EncabezadoVista titulo="Ajustes" />

      <section className={styles.seccion}>
        <h2 className={styles.tituloSeccion}>Servicio de OCR</h2>
        <p className={styles.ayuda}>
          La URL de tu microservicio de OCR (el que corre con FastAPI/Docker). Por ejemplo,
          la de Render una vez desplegado.
        </p>
        <div className={styles.filaUrl}>
          <input
            type="url"
            className={styles.input}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://tu-servicio.onrender.com"
          />
          <Boton variante="secundario" onClick={probarConexion}>
            Probar
          </Boton>
        </div>
        {estadoConexion === 'probando' && <p className={styles.estado}>Probando conexión…</p>}
        {estadoConexion === 'ok' && (
          <p className={`${styles.estado} ${styles.ok}`}>✓ Conectado correctamente</p>
        )}
        {estadoConexion === 'error' && (
          <p className={`${styles.estado} ${styles.error}`}>
            ✕ No se pudo conectar. Revisa la URL y que el servicio esté encendido.
          </p>
        )}
      </section>

      <section className={styles.seccion}>
        <h2 className={styles.tituloSeccion}>Cuota general por congelador</h2>
        <p className={styles.ayuda}>
          Monto que se espera que venda CADA congelador al mes (S/). Si un cliente tiene 2
          congeladores, su cuota total esperada será el doble. Se usa solo cuando ese cliente
          no tiene una cuota manual propia asignada en su ficha.
        </p>
        <input
          type="number"
          inputMode="decimal"
          className={`num ${styles.input}`}
          placeholder="0 = desactivado"
          defaultValue={config.cuotaGeneralPorMaquina || ''}
          onBlur={(e) => actualizarCuotaGeneral(e.target.value)}
        />
      </section>

      <section className={styles.seccion}>
        <h2 className={styles.tituloSeccion}>Reglas del semáforo de salud</h2>
        <p className={styles.ayuda}>
          Define qué se considera "bueno", "regular" o "malo" para cada criterio. Estas reglas
          aplican a todos los clientes, salvo que personalices alguno desde su propia ficha.
        </p>
        {config.criterios.map((criterio) => (
          <EditorCriterioSalud
            key={criterio.id}
            criterio={criterio}
            onCambiar={actualizarCriterioGlobal}
          />
        ))}
      </section>

      <section className={styles.seccion}>
        <h2 className={styles.tituloSeccion}>Datos</h2>
        <div className={styles.botonesDatos}>
          <Boton variante="secundario" onClick={exportarCsv}>
            Exportar clientes a CSV
          </Boton>
          <Boton variante="secundario" onClick={exportarRespaldoCompleto}>
            Descargar respaldo completo (JSON)
          </Boton>
          <Boton variante="secundario" onClick={() => inputImportar.current?.click()}>
            Restaurar desde un respaldo
          </Boton>
          <input
            ref={inputImportar}
            type="file"
            accept="application/json"
            className={styles.inputOculto}
            onChange={manejarImportar}
          />
        </div>
        {mensajeImportar && <p className={styles.ayuda}>{mensajeImportar}</p>}
        <p className={styles.notaRespaldo}>
          Todo se guarda solo en este dispositivo/navegador. Si cambias de celular o borras
          los datos del navegador, usa el respaldo para no perder tu historial.
        </p>
      </section>
    </div>
  );
}
