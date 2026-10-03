/**
 * MinIO / S3 storage adapter.
 *
 * SERVER ONLY — this module reads secret env vars and must never be imported
 * from a client component. It is imported exclusively by route handlers under
 * `src/app/api/files/`.
 *
 * Design notes (see /root/apps/ebusiness-migration/PLAN.md §3):
 *  - Object keys mirror the historical Nextcloud path exactly:
 *      `{tenantName}/{fileName}`  e.g. `ebusiness/2-1773085055105.png`
 *  - A "folder" is a 0-byte marker object `{tenantName}/`, which keeps folders
 *    visible in the MinIO console the way MKCOL did on WebDAV.
 *  - The value persisted in Mongo is a full absolute URL built by
 *    `buildPublicUrl()`, because `src/lib/schemas.ts` validates those fields
 *    with `z.string().url()`.
 */
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const BUCKET = process.env.S3_BUCKET || "ebusiness";

/** Content types the upload path accepts. Mirrors the client-side allow-list. */
const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
  "image/gif",
]);

/** Hard ceiling for a single stored object. Client limit is 5MB; leave headroom. */
export const MAX_OBJECT_BYTES = 8 * 1024 * 1024;

let cachedClient: S3Client | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not configured. Set the S3_* environment variables on the deployment (see runbook-minio.md).`
    );
  }
  return value;
}

/**
 * Lazily construct the client so that importing this module during `next build`
 * (when runtime secrets are absent) does not throw.
 */
function s3(): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({
      endpoint: requireEnv("S3_ENDPOINT"),
      region: process.env.S3_REGION || "us-east-1",
      forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || "true") !== "false",
      credentials: {
        accessKeyId: requireEnv("S3_ACCESS_KEY"),
        secretAccessKey: requireEnv("S3_SECRET_KEY"),
      },
    });
  }
  return cachedClient;
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

/**
 * Normalise a tenant name into a safe key prefix.
 *
 * Deliberately conservative: it only removes path-traversal segments and
 * leading/trailing slashes. Spaces and other characters are preserved because
 * they are legal in S3 keys and are what the Nextcloud layout stored today.
 */
export function sanitizeFolderName(folderName: string): string {
  return (folderName || "")
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");
}

/** `{tenantName}/{fileName}` — the same shape the WebDAV path used. */
export function buildKey(folderName: string, fileName: string): string {
  const folder = sanitizeFolderName(folderName);
  const file = (fileName || "").replace(/\\/g, "/").split("/").filter((s) => s && s !== "." && s !== "..").join("/");
  if (!file) throw new Error("fileName is required");
  return folder ? `${folder}/${file}` : file;
}

/** Split a key back into its folder and file parts. */
export function parseKey(key: string): { folderName: string; fileName: string } {
  const clean = (key || "").replace(/^\/+/, "");
  const idx = clean.lastIndexOf("/");
  if (idx === -1) return { folderName: "", fileName: clean };
  return { folderName: clean.slice(0, idx), fileName: clean.slice(idx + 1) };
}

// ---------------------------------------------------------------------------
// Stored reference (full URL) <-> key
// ---------------------------------------------------------------------------

const FILES_PATH = "/api/files/";

/** Public origin used to build the absolute URL stored in Mongo. */
export function publicAppUrl(): string {
  const raw = process.env.PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
  const trimmed = raw.replace(/\/+$/, "");
  if (!trimmed) {
    throw new Error(
      "PUBLIC_APP_URL (or NEXTAUTH_URL) must be set so stored file references are absolute URLs."
    );
  }
  return trimmed;
}

/**
 * The value persisted in `tenants.logo_url` / `tenants.stamp_url`.
 *
 * Each key segment is percent-encoded so a tenant name containing URL-special
 * characters (`#`, `?`, `%`, spaces) cannot truncate the reference. `#` matters
 * most: unencoded it would turn everything after it into a fragment and the
 * stored URL would point at the wrong object.
 *
 * `keyFromRef` below decodes symmetrically, and Next's catch-all route delivers
 * already-decoded segments, so the key round-trips.
 */
export function buildPublicUrl(key: string): string {
  const encoded = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${publicAppUrl()}${FILES_PATH}${encoded}`;
}

/**
 * Recover the object key from a stored reference.
 *
 * Matches on the `/api/files/` path rather than the configured origin so that
 * references written under a previous hostname still resolve.
 */
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

// ---------------------------------------------------------------------------
// Content types
// ---------------------------------------------------------------------------

/** Returns the normalised type if it is an accepted image type, else null. */
export function resolveContentType(raw?: string | null): string | null {
  const ct = (raw || "").split(";")[0].trim().toLowerCase();
  if (!ct) return null;
  const normalised = ct === "image/jpg" ? "image/jpeg" : ct;
  return ALLOWED_CONTENT_TYPES.has(normalised) ? normalised : null;
}

// ---------------------------------------------------------------------------
// Object operations
// ---------------------------------------------------------------------------

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  const candidate = body as
    | { transformToByteArray?: () => Promise<Uint8Array> }
    | AsyncIterable<Uint8Array>
    | null;

  if (candidate && typeof (candidate as { transformToByteArray?: unknown }).transformToByteArray === "function") {
    return Buffer.from(await (candidate as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray());
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of candidate as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  if (body.byteLength > MAX_OBJECT_BYTES) {
    throw new Error(`Object exceeds the ${MAX_OBJECT_BYTES} byte limit`);
  }
  await s3().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: body.byteLength,
    })
  );
}

export async function getObject(
  key: string
): Promise<{ body: Buffer; contentType: string; contentLength: number } | null> {
  try {
    const result = await s3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const declared = Number(result.ContentLength ?? 0);
    if (declared > MAX_OBJECT_BYTES) {
      throw new Error("Object exceeds the maximum readable size");
    }
    const body = await bodyToBuffer(result.Body);
    return {
      body,
      contentType: result.ContentType || "application/octet-stream",
      contentLength: body.byteLength,
    };
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw error;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** True when at least one object exists under `{folderName}/`. */
export async function prefixExists(folderName: string): Promise<boolean> {
  const folder = sanitizeFolderName(folderName);
  if (!folder) return false;
  const result = await s3().send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: `${folder}/`,
      MaxKeys: 1,
    })
  );
  return (result.KeyCount ?? 0) > 0;
}

/**
 * Create the folder marker `{folderName}/` (0 bytes).
 *
 * S3 has no directories; this keeps the tenant folder visible in the MinIO
 * console exactly as the WebDAV MKCOL call did.
 */
export async function createFolderMarker(folderName: string): Promise<void> {
  const folder = sanitizeFolderName(folderName);
  if (!folder) throw new Error("folderName is required");
  await s3().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `${folder}/`,
      Body: Buffer.alloc(0),
      ContentType: "application/x-directory",
      ContentLength: 0,
    })
  );
}
