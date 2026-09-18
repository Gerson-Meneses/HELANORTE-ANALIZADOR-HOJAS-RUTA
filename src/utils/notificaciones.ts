const CLAVE_PREFERENCIA = 'helanorte:notificaciones_activadas';

export function soportaNotificaciones(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/** Preferencia del usuario (se guarda con el mismo formato que usePersistedState). */
export function notificacionesPreferidas(): boolean {
  try {
    const guardado = localStorage.getItem(CLAVE_PREFERENCIA);
    return guardado === null ? true : (JSON.parse(guardado) as boolean);
  } catch {
    return true;
  }
}

export function tienePermisoNotificaciones(): boolean {
  return soportaNotificaciones() && Notification.permission === 'granted';
}

let registroPromesa: Promise<ServiceWorkerRegistration | null> | null = null;

/**
 * Registra el Service Worker (una sola vez, aunque se llame varias
 * veces). Casi todos los navegadores móviles EXIGEN esto para poder
 * mostrar notificaciones — `new Notification()` sin Service Worker
 * lanza un error de "Illegal constructor" en Chrome/Opera Android.
 */
async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  if (!registroPromesa) {
    registroPromesa = navigator.serviceWorker
      .register('/sw.js')
      .catch(() => null);
  }
  return registroPromesa;
}

/**
 * Pide permiso al navegador. Solo muestra el diálogo si el usuario nunca
 * respondió antes (si ya dijo que sí o que no, respeta esa respuesta sin
 * volver a preguntar). Se recomienda llamarla a partir de una acción del
 * usuario (ej. tocar un interruptor en Ajustes, o al iniciar un escaneo),
 * no apenas carga la app — la mayoría de navegadores ignoran o bloquean
 * el pedido si no viene de una interacción real.
 */
export async function pedirPermisoNotificaciones(): Promise<NotificationPermission> {
  if (!soportaNotificaciones()) return 'denied';
  await registrarServiceWorker();
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Muestra una notificación del sistema. En navegadores móviles pasa por
 * el Service Worker (`showNotification`); en el resto cae al
 * constructor clásico. Si no hay permiso o algo falla, simplemente no
 * muestra nada — nunca rompe el flujo de la app por esto.
 */
export async function mostrarNotificacion(
  titulo: string,
  opciones?: NotificationOptions
): Promise<void> {
  if (!tienePermisoNotificaciones()) return;

  const registro = await registrarServiceWorker();
  try {
    if (registro) {
      await registro.showNotification(titulo, opciones);
    } else {
      const notif = new Notification(titulo, opciones);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    }
  } catch {
    // Navegador raro que no soporta ninguno de los dos caminos: se ignora.
  }
}
