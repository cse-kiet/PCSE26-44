"use client"

import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export function UploadDropzone({ onImageSelected }: { onImageSelected: (url: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const onFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      if (!file.type.startsWith("image/")) return
      const url = URL.createObjectURL(file)
      onImageSelected(url)
    },
    [onImageSelected],
  )

  return (
    <div
      className={`border-2 border-dashed rounded-md p-6 text-sm transition ${
        dragOver ? "border-blue-600 bg-blue-50/40" : "border-muted-foreground/20"
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        onFiles(e.dataTransfer.files)
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Drag & drop an X-ray image</p>
          <p className="text-muted-foreground text-xs">or choose a file from your device</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => inputRef.current?.click()} type="button">
            Browse…
          </Button>
          <Button variant="secondary" onClick={() => onImageSelected(null)} type="button">
            Clear
          </Button>
        </div>
      </div>
    </div>
  )
}
