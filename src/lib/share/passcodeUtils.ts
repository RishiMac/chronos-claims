import type { ShareExpirationOption } from "@/types/share-package";

export async function hashPasscode(passcode: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`chronos-demo-v1:${passcode}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPasscodeHash(
  passcode: string,
  expectedHash: string
): Promise<boolean> {
  const hash = await hashPasscode(passcode);
  return hash === expectedHash;
}

export function computeExpiresAt(
  expiration: ShareExpirationOption,
  from = new Date()
): string {
  const expires = new Date(from);
  switch (expiration) {
    case "24h":
      expires.setHours(expires.getHours() + 24);
      break;
    case "7d":
      expires.setDate(expires.getDate() + 7);
      break;
    case "30d":
      expires.setDate(expires.getDate() + 30);
      break;
    case "never":
      expires.setFullYear(2099, 11, 31);
      break;
    default:
      expires.setDate(expires.getDate() + 7);
  }
  return expires.toISOString();
}

export function formatExpirationLabel(
  expiration: ShareExpirationOption,
  expiresAt: string
): string {
  if (expiration === "never") {
    return "Never (demo only)";
  }
  return new Date(expiresAt).toLocaleString();
}
