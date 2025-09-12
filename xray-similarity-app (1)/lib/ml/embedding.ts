let mobilenetModel: any | null = null

type ProgressFn = (p01: number) => void

export async function ensureModel(progress?: ProgressFn) {
  if (mobilenetModel) return mobilenetModel
  const [{ default: tf }, mobilenet] = await Promise.all([
    import("@tensorflow/tfjs"),
    import("@tensorflow-models/mobilenet"),
  ])
  progress?.(0.3)
  // mobilenet v2 provides embeddings via infer(img, true)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  mobilenetModel = await (mobilenet as any).load({ version: 2, alpha: 1.0 })
  progress?.(1)
  return mobilenetModel
}

export async function embedImageElement(
  img: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  progress?: ProgressFn,
): Promise<Float32Array> {
  const model = await ensureModel((p) => progress?.(p * 0.7))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const t = model.infer(img, true) // embedding tensor
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const data = await t.data()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  t.dispose?.()
  progress?.(1)
  return new Float32Array(data as Float32Array)
}
