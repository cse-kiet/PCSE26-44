"use client"

import { useMemo } from "react"
import { getRecordsForPatient } from "@/lib/storage"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function ProgressionChart({ patientId }: { patientId: string }) {
  const data = useMemo(() => {
    const records = getRecordsForPatient(patientId)
    return records
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((r) => ({
        time: new Date(r.timestamp).toLocaleString(),
        severity: Number(r.severity.toFixed(3)),
      }))
  }, [patientId])

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No saved records yet.</p>
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="severity" stroke="#2563eb" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
