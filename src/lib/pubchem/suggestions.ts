import { translateCompoundName, suggestVietnameseName } from "../compound-alias";
import { callPug } from "./core";

interface SuggestionJson {
  dictionary_terms?: { compound?: string[] };
}

export async function getSuggestions(keyword: string): Promise<string[]> {
  const q = keyword.trim().replace(/[/\\]/g, "").slice(0, 60);
  if (q.length < 2) return [];

  // Common Vietnamese aliases (nước, muối, đường…) — put the real English form at the head of the suggestions.
  const vietnameseSuggestions = suggestVietnameseName(q);

  // Pure-numeric CID: PubChem autocomplete doesn't understand numbers, look it up directly without name suggestions.
  if (/^\d+$/.test(q)) return [];

  const data = await callPug<SuggestionJson>(
    `/autocomplete/compound/${encodeURIComponent(translateCompoundName(q))}/JSON?limit=8`,
  );
  const pubchemSuggestions = data?.dictionary_terms?.compound ?? [];
  return [...new Set([...vietnameseSuggestions, ...pubchemSuggestions])].slice(0, 8);
}
