import Constants from "expo-constants";

const BASE =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ??
  "https://rescore-nodd.netlify.app";

export interface ClassifiedItem {
  original_text: string;
  area: "hygiene" | "structure" | "confidence";
  taxonomy_id: string | null;
  legal_basis: string | null;
  is_priority: boolean;
}

export interface Classification {
  rating_before: number | null;
  scores_before: { hygiene: number | null; structure: number | null; confidence: number | null };
  scores_are_stated: boolean;
  items: ClassifiedItem[];
  hard_stops: Array<{ id: string; original_text: string }>;
  out_of_scope: string | null;
}

/** Reads an inspection report through the same endpoint the web app uses. */
export async function classifyReport(text: string): Promise<Classification> {
  const response = await fetch(`${BASE}/api/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error ?? "We could not read that report. Try again in a moment.");
  }
  return body as Classification;
}
