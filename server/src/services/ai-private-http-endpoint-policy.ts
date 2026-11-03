import { isIP } from "node:net";

const PRIVATE_HTTP_ALLOWLIST_ENV = "PAPERCLIP_AI_PRIVATE_HTTP_ENDPOINT_ALLOWLIST";

function isLoopback(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
}

function isPrivateIpv4(hostname: string): boolean {
  if (isIP(hostname) !== 4) return false;
  const [first, second] = hostname.split(".").map(Number);
  return first === 10 || first === 192 && second === 168 || first === 172 && second >= 16 && second <= 31;
}

function normalizeAllowlistedOrigin(value: string): string | null {
  try {
    const endpoint = new URL(value);
    if (endpoint.protocol !== "http:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== "/") return null;
    return endpoint.origin.toLowerCase();
  } catch {
    return null;
  }
}

function allowlistedOrigins(raw: string): ReadonlySet<string> {
  return new Set(raw.split(",").map(entry => normalizeAllowlistedOrigin(entry.trim())).filter((entry): entry is string => entry !== null));
}

/**
 * Private-network AI endpoints are off by default. An operator must explicitly
 * allow each HTTP origin because a connection can otherwise cause a runtime to
 * send credentials to a private service.
 */
export function assertAiPrivateHttpEndpointAllowed(baseUrl: string, rawAllowlist = process.env[PRIVATE_HTTP_ALLOWLIST_ENV] ?? ""): void {
  const endpoint = new URL(baseUrl);
  if (endpoint.protocol !== "http:" || isLoopback(endpoint.hostname)) return;
  if (!isPrivateIpv4(endpoint.hostname)) return;
  if (allowlistedOrigins(rawAllowlist).has(endpoint.origin.toLowerCase())) return;
  throw new Error(`Private-network HTTP AI endpoints require an exact origin in ${PRIVATE_HTTP_ALLOWLIST_ENV}.`);
}
