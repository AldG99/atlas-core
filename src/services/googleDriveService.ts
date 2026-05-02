const CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID;
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'Orderly';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleAccounts = any;

// Los tokens de Google expiran en 3600 s. Usamos un margen de 5 min para renovar antes.
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

let tokenClient: GoogleAccounts | null = null;
let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

function isTokenValid(): boolean {
  return (
    cachedToken !== null &&
    tokenExpiresAt !== null &&
    Date.now() < tokenExpiresAt - TOKEN_EXPIRY_BUFFER_MS
  );
}

function clearToken(): void {
  cachedToken = null;
  tokenExpiresAt = null;
}

const loadGSI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as GoogleAccounts).google?.accounts) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
    document.head.appendChild(script);
  });
};

const getAccessToken = async (): Promise<string> => {
  await loadGSI();
  const google = (window as GoogleAccounts).google;

  if (!tokenClient) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response: { access_token?: string; error?: string }) => {
        if (response.error || !response.access_token) {
          throw new Error(response.error ?? 'Error al obtener token');
        }
        cachedToken = response.access_token;
      }
    });
  }

  if (isTokenValid()) {
    return cachedToken!;
  }

  return new Promise<string>((resolve, reject) => {
    tokenClient.requestAccessToken({
      prompt: cachedToken ? '' : 'consent',
      callback: (response: { access_token?: string; expires_in?: number; error?: string }) => {
        if (response.error || !response.access_token) {
          clearToken();
          reject(new Error(response.error ?? 'Error al obtener token'));
          return;
        }
        cachedToken = response.access_token;
        // expires_in viene en segundos; usamos 3600 como fallback seguro
        const expiresIn = response.expires_in ?? 3600;
        tokenExpiresAt = Date.now() + expiresIn * 1000;
        resolve(response.access_token);
      },
    } as Parameters<typeof tokenClient.requestAccessToken>[0]);
  });
};

// Ejecuta un fetch autenticado. Si recibe 401 limpia el token y reintenta una vez.
async function authedFetch(
  url: string,
  options: RequestInit = {},
  retried = false
): Promise<Response> {
  const token = await getAccessToken();
  const res = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });

  if (res.status === 401 && !retried) {
    clearToken();
    return authedFetch(url, options, true);
  }

  return res;
}

const getOrCreateFolder = async (): Promise<string> => {
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );

  const searchRes = await authedFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`
  );

  if (!searchRes.ok) throw new Error('Error al buscar carpeta en Drive');

  const { files } = await searchRes.json();
  if (files?.length > 0) return files[0].id;

  const createRes = await authedFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) throw new Error('Error al crear carpeta en Drive');

  const folder = await createRes.json();
  return folder.id;
};

export const uploadCSVToDrive = async (csvContent: string, fileName: string): Promise<string> => {
  const folderId = await getOrCreateFolder();

  const metadata = JSON.stringify({
    name: fileName,
    mimeType: 'text/csv',
    parents: [folderId]
  });

  const form = new FormData();
  form.append('metadata', new Blob([metadata], { type: 'application/json' }));
  form.append('file', new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' }));

  const res = await authedFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=webViewLink',
    { method: 'POST', body: form }
  );

  if (!res.ok) throw new Error('Error al subir archivo a Drive');

  const data = await res.json();
  if (!data.webViewLink) throw new Error('No se recibió enlace del archivo');

  return data.webViewLink;
};
