const CLAVE_STORAGE = 'helanorte:ocr_url';
const URL_POR_DEFECTO = 'http://127.0.0.1:8001';

export function getOcrServiceUrl(): string {
  return localStorage.getItem(CLAVE_STORAGE) ?? URL_POR_DEFECTO;
}

export function setOcrServiceUrl(url: string): void {
  localStorage.setItem(CLAVE_STORAGE, url.trim().replace(/\/+$/, ''));
}
