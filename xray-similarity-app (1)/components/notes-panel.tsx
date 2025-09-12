"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function NotesPanel({ onSave, disabled }: { onSave: (note?: string) => void; disabled?: boolean }) {
  const [note, setNote] = useState("")
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Textarea
          className="min-h-40"
          placeholder="Doctor notes, impressions, follow-up..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={disabled}
        />
        <div className="mt-3 flex items-center gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" disabled={disabled} onClick={() => onSave(note)}>
            Save to patient record
          </Button>
          <Button variant="secondary" disabled={!note} onClick={() => setNote("")}>
            Clear
          </Button>
        </div>
      </div>
      <div className="rounded-md border p-3">
        <p className="text-sm font-medium">Notes guidance</p>
        <ul className="text-xs text-muted-foreground mt-2 list-disc pl-4 space-y-1">
          <li>Describe visible findings and location.</li>
          <li>Report differential diagnoses.</li>
          <li>Add follow-up or further imaging suggestions.</li>
        </ul>
      </div>
    </div>
  )
}
