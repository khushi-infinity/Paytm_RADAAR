import { readFileSync } from "node:fs";
import path from "node:path";

let loaded = false;

/** Load .env once (Next.js API routes don't auto-load it when run via tsx-less dev). */
export function loadEnv(): void {
  if (loaded) return;
  loaded = true;
  try {
    // resolved from the process working directory (project root), NOT
    // import.meta.url: a URL-based reference makes bundlers treat .env as a
    // build-time dependency and fail the build when the file is absent
    // (e.g. Railway, where secrets come from platform Variables).
    const text = readFileSync(path.join(process.cwd(), ".env"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  } catch {
    // .env optional if vars are exported in the shell or set by the platform
  }
}

export function env(name: string): string {
  loadEnv();
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}, check .env`);
  return v.trim();
}

export function tryEnv(name: string): string | undefined {
  loadEnv();
  return process.env[name]?.trim() || undefined;
}
