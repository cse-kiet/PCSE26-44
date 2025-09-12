"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Ref = {
  id: string
  label: string
  path: string
}

type TopItem = { ref: Ref; similarity: number }

export function SimilarityResults({
  analysis,
}: {
  analysis: null | {
    top: TopItem[]
    severity: number
    bestLabel: string
  }
}) {
  if (!analysis) {
    return <p className="text-sm text-muted-foreground">Upload and analyze an image to see results.</p>
  }
  const { top, severity, bestLabel } = analysis
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Most similar case</p>
            <p className="text-base font-medium">{bestLabel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Severity (0-1)</p>
            <p className="text-base font-medium">{severity.toFixed(2)}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Severity is a heuristic vs “Normal” references. For clinical use, validate with real datasets.
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Similar Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {top.map((t) => (
              <li key={t.ref.id} className="rounded-md border p-2">
                <div className="aspect-square w-full rounded-sm overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    src={t.ref.path || "/placeholder.svg"}
                    alt={`${t.ref.label} reference`}
                    className="object-contain max-h-48"
                  />
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium">{t.ref.label}</p>
                  <p className="text-xs text-muted-foreground">Similarity: {t.similarity.toFixed(3)}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
