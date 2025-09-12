"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { computeOcclusionHeatmap } from "@/lib/ml/heatmap"

export function HeatmapViewer({ imageUrl }: { imageUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(true)
  }, [imageUrl])

  async function run() {
    const canvas = canvasRef.current
    if (!canvas) return
    setBusy(true)
    try {
      await computeOcclusionHeatmap(imageUrl, canvas)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    // draw base image initially
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      c.width = img.width
      c.height = img.height
      ctx.drawImage(img, 0, 0, c.width, c.height)
    }
    img.src = imageUrl
  }, [imageUrl])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button className="bg-blue-600 hover:bg-blue-700" disabled={busy} onClick={run}>
          {busy ? "Computing…" : "Compute Heatmap"}
        </Button>
        <Button variant="secondary" onClick={() => setVisible((v) => !v)}>
          {visible ? "Hide Overlay" : "Show Overlay"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Occlusion sensitivity: darker red = region impacting similarity more.
        </p>
      </div>
      <div className="overflow-auto rounded-md border">
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", opacity: visible ? 1 : 0.5 }} />
      </div>
    </div>
  )
}
