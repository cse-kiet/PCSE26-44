"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { UploadDropzone } from "@/components/uploader"
import { SimilarityResults } from "@/components/similarity-results"
import { NotesPanel } from "@/components/notes-panel"
import { ProgressionChart } from "@/components/progression-chart"
import { HeatmapViewer } from "@/components/heatmap-viewer"
import { ensureReferenceEmbeddings, type RefItem } from "@/lib/ml/reference"
import { embedImageElement } from "@/lib/ml/embedding"
import { cosineSimilarity } from "@/lib/ml/similarity"
import { saveRecord } from "@/lib/storage"

type AnalysisResult = {
  embedding: Float32Array
  top: Array<{ ref: RefItem; similarity: number }>
  severity: number
  bestLabel: string
}

export default function Page() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)

  // Simple, readable color system (4 colors total):
  // - Primary: Blue 600
  // - Neutrals: White, Gray-100/900
  // - Accent: none (heatmap is canvas-only)
  useEffect(() => {
    setProgress(isAnalyzing ? 35 : 0)
  }, [isAnalyzing])

  async function handleAnalyze() {
    if (!imageUrl) return
    setIsAnalyzing(true)
    setProgress(10)
    try {
      // Load references and compute cached embeddings on first use
      const refs = await ensureReferenceEmbeddings((p) => setProgress(10 + Math.floor(p * 30)))
      setProgress(45)

      // Load uploaded image
      const img = await loadImage(imageUrl)
      setProgress(55)

      // Compute embedding
      const emb = await embedImageElement(img, (p) => setProgress(55 + Math.floor(p * 20)))
      setProgress(78)

      // Similarity search
      const scored = refs.map((r) => ({
        ref: r,
        similarity: cosineSimilarity(emb, r.embedding),
      }))
      scored.sort((a, b) => b.similarity - a.similarity)
      const top = scored.slice(0, 5)

      // Severity heuristic: compare top disease vs average of normals
      const normalSims = scored.filter((s) => s.ref.label === "Normal").map((s) => s.similarity)
      const avgNormal = normalSims.length ? avgNormalSim(normalSims) : 0.5
      const topDisease = scored.find((s) => s.ref.label !== "Normal")
      const severityRaw = Math.max(0, (topDisease?.similarity ?? 0) - avgNormal)
      const severity = Math.min(1, severityRaw / 0.5) // normalize into 0..1

      const bestLabel = top.find(Boolean)?.ref.label ?? "Unknown"

      setAnalysis({ embedding: emb, top, severity, bestLabel })
      setProgress(100)
    } catch (e) {
      console.error("[v0] analysis error", e)
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false)
        setProgress(0)
      }, 300)
    }
  }

  function onSaveRecord(note?: string) {
    if (!patientId || !analysis) return
    saveRecord(patientId, {
      timestamp: Date.now(),
      severity: analysis.severity,
      bestLabel: analysis.bestLabel,
      note: note ?? "",
    })
  }

  return (
    <main className="mx-auto max-w-5xl p-6 md:p-8 font-sans">
      <header className="mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold text-balance">Chest X-ray Similarity Explorer</h1>
          <span className="text-xs md:text-sm text-muted-foreground">Offline-friendly • On-device ML</span>
        </div>
        <p className="text-sm md:text-base text-muted-foreground mt-2 text-pretty">
          Upload a chest X-ray to find similar cases, get a severity estimate, an explainability heatmap, and track
          progression over time.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>1) Upload X-ray</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UploadDropzone onImageSelected={setImageUrl} />
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
              <input
                className="w-full md:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                placeholder="Patient ID (optional for progression)"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!imageUrl || isAnalyzing}
                onClick={handleAnalyze}
              >
                {isAnalyzing ? "Analyzing…" : "Analyze X-ray"}
              </Button>
            </div>
            {isAnalyzing ? (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">Running model on-device…</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("aspect-square rounded-md bg-muted overflow-hidden flex items-center justify-center")}>
              {imageUrl ? (
                // Always set crossOrigin when rendering images into canvas elsewhere
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt="Uploaded chest x-ray"
                  className="max-h-80 object-contain"
                />
              ) : (
                <img src="/upload-a-chest-x-ray-to-preview.jpg" alt="placeholder" className="opacity-60" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Supported: JPG, PNG. Processed entirely in your browser.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="results" className="mt-6">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="heatmap" disabled={!analysis || !imageUrl}>
            Explainability
          </TabsTrigger>
          <TabsTrigger value="notes" disabled={!analysis}>
            Doctor Notes
          </TabsTrigger>
          <TabsTrigger value="progression" disabled={!patientId}>
            Progression
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-4">
          <SimilarityResults analysis={analysis} />
        </TabsContent>

        <TabsContent value="heatmap" className="mt-4">
          {imageUrl && analysis ? (
            <HeatmapViewer imageUrl={imageUrl} />
          ) : (
            <p className="text-sm text-muted-foreground">Analyze an image to view the heatmap.</p>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesPanel onSave={onSaveRecord} disabled={!analysis} />
        </TabsContent>

        <TabsContent value="progression" className="mt-4">
          {patientId ? (
            <ProgressionChart patientId={patientId} />
          ) : (
            <p className="text-sm text-muted-foreground">Enter a Patient ID to see progression.</p>
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}

function avgNormalSim(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
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
