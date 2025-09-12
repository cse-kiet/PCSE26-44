import { embedImageElement } from "./embedding"

export type RefItem = {
  id: string
  label: "Normal" | "Pneumonia" | "Tuberculosis" | "COVID-19" | "Fibrosis" | "Effusion"
  path: string
  embedding: Float32Array
}

const REF_META = [
  { id: "normal-1", label: "Normal", path: "/images/dataset/normal-1.jpg" },
  { id: "pneumonia-1", label: "Pneumonia", path: "/images/dataset/pneumonia-1.jpg" },
  { id: "tb-1", label: "Tuberculosis", path: "/images/dataset/tb-1.jpg" },
  { id: "covid-1", label: "COVID-19", path: "/images/dataset/covid-1.jpg" },
  { id: "fibrosis-1", label: "Fibrosis", path: "/images/dataset/fibrosis-1.jpg" },
  { id: "effusion-1", label: "Effusion", path: "/images/dataset/effusion-1.jpg" },
] as const

const CACHE_KEY = "refEmbeddings.v1"

type CacheEntry = {
  id: string
  label: RefItem["label"]
  path: string
  emb: number[]
}

export async function ensureReferenceEmbeddings(onProgress?: (p01: number) => void): Promise<RefItem[]> {
  const cached = loadCache()
  if (cached) {
    return cached.map((c) => ({
      id: c.id,
      label: c.label,
      path: c.path,
      embedding: new Float32Array(c.emb),
    }))
  }
  const results: RefItem[] = []
  for (let i = 0; i < REF_META.length; i++) {
    const m = REF_META[i]
    const img = await loadImage(m.path)
    const emb = await embedImageElement(img)
    results.push({
      id: m.id,
      label: m.label,
      path: m.path,
      embedding: emb,
    })
    onProgress?.((i + 1) / REF_META.length)
  }
  saveCache(results)
  return results
}

function loadCache(): CacheEntry[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry[]
    return parsed
  } catch {
    return null
  }
}

function saveCache(items: RefItem[]) {
  try {
    const payload: CacheEntry[] = items.map((r) => ({
      id: r.id,
      label: r.label,
      path: r.path,
      emb: Array.from(r.embedding),
    }))
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch (e) {
    console.warn("[v0] failed to save reference embeddings", e)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}
