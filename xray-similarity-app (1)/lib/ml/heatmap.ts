import { embedImageElement } from "./embedding"

export async function computeOcclusionHeatmap(imageUrl: string, canvas: HTMLCanvasElement) {
  const baseImg = await loadImage(imageUrl)

  // Fit image into canvas, maintain original intrinsic size for better display
  canvas.width = baseImg.naturalWidth || baseImg.width
  canvas.height = baseImg.naturalHeight || baseImg.height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height)

  // Create a working canvas at smaller resolution for speed (224x224)
  const W = 224
  const H = 224
  const work = document.createElement("canvas")
  work.width = W
  work.height = H
  const wctx = work.getContext("2d")!
  wctx.drawImage(baseImg, 0, 0, W, H)

  // Baseline embedding
  const baseEmb = await embedImageElement(work)

  // Sliding window occlusion grid
  const patch = 28
  const stride = 28
  const gx = Math.floor((W - patch) / stride) + 1
  const gy = Math.floor((H - patch) / stride) + 1
  const deltas: number[] = []

  for (let y = 0; y < gy; y++) {
    for (let x = 0; x < gx; x++) {
      // Copy original small image
      wctx.drawImage(baseImg, 0, 0, W, H)
      // Occlude region
      wctx.fillStyle = "rgba(0,0,0,0.6)"
      wctx.fillRect(x * stride, y * stride, patch, patch)
      const emb = await embedImageElement(work)
      const delta = cosineDistance(emb, baseEmb)
      deltas.push(delta)
    }
  }

  // Normalize deltas 0..1
  const max = Math.max(...deltas)
  const min = Math.min(...deltas)
  const norm = deltas.map((d) => (max > min ? (d - min) / (max - min) : 0))

  // Draw overlay heatmap onto display canvas (upscaled)
  const overlay = document.createElement("canvas")
  overlay.width = W
  overlay.height = H
  const octx = overlay.getContext("2d")!

  let idx = 0
  for (let y = 0; y < gy; y++) {
    for (let x = 0; x < gx; x++) {
      const v = norm[idx++]
      // Map v to red heat with alpha
      octx.fillStyle = `rgba(220, 38, 38, ${0.15 + 0.55 * v})` // red-600-ish varying alpha
      octx.fillRect(x * stride, y * stride, patch, patch)
    }
  }

  // Composite overlay onto original-size canvas
  // First redraw the original image
  ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height)
  // Then scale and overlay heatmap
  ctx.globalCompositeOperation = "source-over"
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height)
}

function cosineDistance(a: Float32Array, b: Float32Array): number {
  // 1 - cosine similarity
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
  return 1 - dot / denom
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
