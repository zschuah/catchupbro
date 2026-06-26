import axios from "axios";

/**
 * Firebase Realtime Database REST endpoint, e.g.
 * https://my-project-default-rtdb.firebaseio.com
 * Set VITE_FIREBASE_DB_URL in .env.
 */
const DB_URL =
  import.meta.env.VITE_FIREBASE_DB_URL ??
  "https://YOUR-PROJECT-default-rtdb.firebaseio.com";

export const firebase = axios.create({
  baseURL: DB_URL,
  headers: { "Content-Type": "application/json" },
});

/** Build "/trips/ABC.json" with optional query params (e.g. { shallow: true }). */
function url(path: string, params?: Record<string, string | boolean>): string {
  const clean = path.replace(/^\/+|\/+$/g, "");
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    search.set(key, String(value));
  }
  const qs = search.toString();
  return `/${clean}.json${qs ? `?${qs}` : ""}`;
}

// ----------------------------------------------------------------------------
// Typed REST verbs. Note: Firebase returns `null` (not 404) for missing paths.
// ----------------------------------------------------------------------------

export async function fbGet<T>(
  path: string,
  params?: Record<string, string | boolean>,
): Promise<T | null> {
  const { data } = await firebase.get<T | null>(url(path, params));
  return data;
}

export async function fbPut<T>(path: string, body: T): Promise<T> {
  const { data } = await firebase.put<T>(url(path), body);
  return data;
}

/** POST lets Firebase generate a push id, returned as { name }. */
export async function fbPost<T>(
  path: string,
  body: T,
): Promise<{ name: string }> {
  const { data } = await firebase.post<{ name: string }>(url(path), body);
  return data;
}

export async function fbPatch<T extends object>(
  path: string,
  body: Partial<T> | Record<string, unknown>,
): Promise<void> {
  await firebase.patch(url(path), body);
}

export async function fbDelete(path: string): Promise<void> {
  await firebase.delete(url(path));
}
