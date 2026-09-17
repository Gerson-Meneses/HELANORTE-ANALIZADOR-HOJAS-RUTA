import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  ClienteGuardado,
  Escaneo,
  HistorialCliente,
  ConfigSalud,
  CuotaMensual,
} from '../types/dominio';

const DB_NAME = 'helanorte-ocr';
const DB_VERSION = 2;

interface AppDB extends DBSchema {
  clientes: {
    key: string; // codigo
    value: ClienteGuardado;
    indexes: { 'por_escaneo': string };
  };
  escaneos: {
    key: string; // uuid
    value: Escaneo;
  };
  historial: {
    key: string; // uuid
    value: HistorialCliente;
    indexes: { 'por_codigo': string };
  };
  cuotas: {
    key: string;
    value: CuotaMensual;
    indexes: { 'por_codigo': string };
  };
  config: {
    key: string; // 'salud' | otras claves de config a futuro
    value: unknown;
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('clientes')) {
          const store = db.createObjectStore('clientes', { keyPath: 'id' });
          store.createIndex('por_escaneo', 'escaneo_id');
        }
        if (!db.objectStoreNames.contains('escaneos')) {
          db.createObjectStore('escaneos', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('historial')) {
          const store = db.createObjectStore('historial', { keyPath: 'id' });
          store.createIndex('por_codigo', 'codigo');
        }
        if (!db.objectStoreNames.contains('cuotas')) {
          const store = db.createObjectStore('cuotas', { keyPath: 'id' });
          store.createIndex('por_codigo', 'codigo_cliente');
        }
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config');
        }
      },
    });
  }
  return dbPromise;
}

/* ------------------------------------------------------------------ */
/* Clientes                                                             */
/* ------------------------------------------------------------------ */

export async function getTodosLosClientes(): Promise<ClienteGuardado[]> {
  const db = await getDB();
  return db.getAll('clientes');
}

export async function guardarClientes(clientes: ClienteGuardado[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('clientes', 'readwrite');
  await Promise.all([...clientes.map((c) => tx.store.put(c)), tx.done]);
}

export async function eliminarCliente(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('clientes', id);
}

/* ------------------------------------------------------------------ */
/* Escaneos                                                             */
/* ------------------------------------------------------------------ */

export async function guardarEscaneo(escaneo: Escaneo): Promise<void> {
  const db = await getDB();
  await db.put('escaneos', escaneo);
}

export async function getEscaneo(id: string): Promise<Escaneo | undefined> {
  const db = await getDB();
  return db.get('escaneos', id);
}

export async function getTodosLosEscaneos(): Promise<Escaneo[]> {
  const db = await getDB();
  return db.getAll('escaneos');
}

/* ------------------------------------------------------------------ */
/* Cuotas mensuales (por cliente, opcionalmente por equipo)             */
/* ------------------------------------------------------------------ */

export async function getTodasLasCuotas(): Promise<CuotaMensual[]> {
  const db = await getDB();
  return db.getAll('cuotas');
}

export async function getCuotasDeCliente(codigo: string): Promise<CuotaMensual[]> {
  const db = await getDB();
  return db.getAllFromIndex('cuotas', 'por_codigo', codigo);
}

export async function guardarCuota(cuota: CuotaMensual): Promise<void> {
  const db = await getDB();
  await db.put('cuotas', cuota);
}

export async function eliminarCuota(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('cuotas', id);
}

/* ------------------------------------------------------------------ */
/* Historial                                                            */
/* ------------------------------------------------------------------ */

export async function agregarHistorial(punto: HistorialCliente): Promise<void> {
  const db = await getDB();
  await db.put('historial', punto);
}

export async function getHistorialDeCliente(codigo: string): Promise<HistorialCliente[]> {
  const db = await getDB();
  const puntos = await db.getAllFromIndex('historial', 'por_codigo', codigo);
  return puntos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/* ------------------------------------------------------------------ */
/* Config (reglas de salud, preferencias)                               */
/* ------------------------------------------------------------------ */

export async function getConfig<T>(clave: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get('config', clave) as Promise<T | undefined>;
}

export async function setConfig<T>(clave: string, valor: T): Promise<void> {
  const db = await getDB();
  await db.put('config', valor, clave);
}

export async function getConfigSalud(): Promise<ConfigSalud | undefined> {
  return getConfig<ConfigSalud>('salud');
}

export async function setConfigSalud(config: ConfigSalud): Promise<void> {
  await setConfig('salud', config);
}

/* ------------------------------------------------------------------ */
/* Respaldo / restauración completa                                     */
/* ------------------------------------------------------------------ */

export interface Respaldo {
  version: 1;
  exportado_en: string;
  clientes: ClienteGuardado[];
  escaneos: Escaneo[];
  historial: HistorialCliente[];
  cuotas: CuotaMensual[];
  configSalud?: ConfigSalud;
}

export async function exportarRespaldo(): Promise<Respaldo> {
  const [clientes, escaneos, cuotas, configSalud] = await Promise.all([
    getTodosLosClientes(),
    getTodosLosEscaneos(),
    getTodasLasCuotas(),
    getConfigSalud(),
  ]);
  const db = await getDB();
  const historial = await db.getAll('historial');
  return {
    version: 1,
    exportado_en: new Date().toISOString(),
    clientes,
    escaneos,
    historial,
    cuotas,
    configSalud,
  };
}

export async function importarRespaldo(respaldo: Respaldo): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ['clientes', 'escaneos', 'historial', 'cuotas', 'config'],
    'readwrite'
  );
  await Promise.all([
    ...respaldo.clientes.map((c) => tx.objectStore('clientes').put(c)),
    ...respaldo.escaneos.map((e) => tx.objectStore('escaneos').put(e)),
    ...respaldo.historial.map((h) => tx.objectStore('historial').put(h)),
    ...(respaldo.cuotas ?? []).map((q) => tx.objectStore('cuotas').put(q)),
    respaldo.configSalud
      ? tx.objectStore('config').put(respaldo.configSalud, 'salud')
      : Promise.resolve(),
    tx.done,
  ]);
}
