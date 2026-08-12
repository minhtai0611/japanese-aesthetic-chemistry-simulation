/** Classic Levenshtein edit distance — dynamic-programming algorithm, no AI. */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let previousRow = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const currentRow = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        previousRow[j] + 1,
        currentRow[j - 1] + 1,
        previousRow[j - 1] + cost,
      );
    }
    previousRow = currentRow;
  }
  return previousRow[n];
}

/** Finds up to `limit` closest matches in `candidates` for `keyword`, by Levenshtein distance. */
export function suggestClosestMatch(keyword: string, candidates: readonly string[], limit = 4): string[] {
  const t = keyword.trim().toLowerCase();
  if (!t) return [];
  return [...candidates]
    .map((candidate) => ({ candidate, distance: levenshteinDistance(t, candidate.toLowerCase()) }))
    .filter(({ distance, candidate }) => distance <= Math.max(3, Math.floor(candidate.length * 0.4)))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
