const NOTES_KEY = "patientNotes.v1"
const RECORDS_KEY = "patientRecords.v1"

export type PatientRecord = {
  timestamp: number
  severity: number
  bestLabel: string
  note?: string
}

export function saveRecord(patientId: string, record: PatientRecord) {
  const all = loadAll<Record<string, PatientRecord[]>>(RECORDS_KEY) || {}
  const arr = all[patientId] || []
  arr.push(record)
  all[patientId] = arr
  persist(RECORDS_KEY, all)
}

export function getRecordsForPatient(patientId: string): PatientRecord[] {
  const all = loadAll<Record<string, PatientRecord[]>>(RECORDS_KEY) || {}
  return all[patientId] || []
}

export function saveNotes(patientId: string, notes: string) {
  const all = loadAll<Record<string, string>>(NOTES_KEY) || {}
  all[patientId] = notes
  persist(NOTES_KEY, all)
}

export function getNotes(patientId: string): string {
  const all = loadAll<Record<string, string>>(NOTES_KEY) || {}
  return all[patientId] || ""
}

function loadAll<T = unknown>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn("[v0] storage persist failed", e)
  }
}
