/**
 * Resolves a stored file reference into something renderable.
 *
 * This module is imported by client components, so it must stay free of
 * secrets and of server-only env access. It replaces the five duplicated
 * `getProxyImageUrl` helpers that previously lived in TenantForm,
 * company-info, the two preview modals and pdf-generator.
 *
 * Stored references are full absolute URLs (see PLAN.md §3):
 *   current : https://crm.ebusinessplus.co/api/files/ebusiness/2-123.png
 *   legacy  : https://<nextcloud>/remote.php/dav/files/admin/ebusiness%2F2-123.png
 */

const FILES_PATH = "/api/files/";
const WEBDAV_MARKER = "/remote.php/dav/files/";

/** True for values written by the old Nextcloud/WebDAV integration. */
export function isLegacyRef(ref: string | null | undefined): boolean {
  return typeof ref === "string" && ref.includes(WEBDAV_MARKER);
}

/**
 * Turn a stored reference into a usable `src` / fetch target.
 *
 * - empty            -> null
 * - legacy WebDAV    -> routed through the legacy proxy shim until cleanup
 * - current/absolute -> returned unchanged (same-origin for our own files)
 * - bare object key  -> served from /api/files/ (forward compatibility)
 */
export function resolveFileUrl(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const value = ref.trim();
  if (!value) return null;

  if (isLegacyRef(value)) {
    return `/api/nextcloud/image?url=${encodeURIComponent(value)}`;
  }

  if (value.includes(FILES_PATH)) {
    return value;
  }

  // Already a same-origin path.
  if (value.startsWith("/")) {
    return value;
  }

  // Absolute URL we do not recognise (e.g. an external asset) — render as-is.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    return value;
  }

  // Bare object key, e.g. "ebusiness/2-123.png".
  return `${FILES_PATH}${value.replace(/^\/+/, "")}`;
}

/** Object key behind a reference, for callers that need to delete it. */
export function keyFromRef(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const idx = ref.indexOf(FILES_PATH);
  if (idx === -1) return null;
  const raw = ref.slice(idx + FILES_PATH.length).split("?")[0].split("#")[0];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
