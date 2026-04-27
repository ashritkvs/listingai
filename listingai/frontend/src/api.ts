import type { GenerateRequest, GenerateResponse } from "./types";

const DEFAULT_API_BASE = "http://localhost:8000";

export function getApiBase(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? DEFAULT_API_BASE;
}

export async function generateListings(
  payload: GenerateRequest,
): Promise<GenerateResponse> {
  const res = await fetch(`${getApiBase()}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    try {
      const parsed = JSON.parse(text) as { detail?: string };
      throw new Error(parsed.detail || `Request failed (${res.status})`);
    } catch {
      throw new Error(text || `Request failed (${res.status})`);
    }
  }

  return JSON.parse(text) as GenerateResponse;
}

