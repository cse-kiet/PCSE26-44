export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0
  let na = 0
  let nb = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1
  return dot / denom
}

export function topKSimilar<T extends { embedding: Float32Array }>(query: Float32Array, items: T[], k = 5) {
  const scored = items.map((it) => ({
    item: it,
    sim: cosineSimilarity(query, it.embedding),
  }))
  scored.sort((a, b) => b.sim - a.sim)
  return scored.slice(0, k)
}
