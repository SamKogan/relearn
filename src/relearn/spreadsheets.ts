import { parseTable } from "./parseSheet"

export function sheetCsvUrls(input: string): string[] | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  if (url.hostname !== "docs.google.com") return null
  const match = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  const fileId = match?.[1]
  if (!fileId) return null
  const gid = url.searchParams.get("gid") ?? url.hash.match(/gid=(\d+)/)?.[1] ?? "0"
  return [
    `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv&gid=${gid}`,
  ]
}

export async function fetchSheetCsv(input: string): Promise<string> {
  const urls = sheetCsvUrls(input)
  if (!urls) {
    throw new Error("Paste a Google Sheets link, the kind that starts with docs.google.com/spreadsheets.")
  }
  let message = "I couldn't open that sheet."
  for (const url of urls) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        message = "That sheet didn't open. Set sharing to anyone with the link, or upload a CSV."
        continue
      }
      const text = await response.text()
      if (/<!doctype html/i.test(text) || /<html[\s>]/i.test(text)) {
        message =
          "That sheet isn't public. In Google Sheets, set General access to anyone with the link, or download a CSV and upload it."
        continue
      }
      return text
    } catch {
      message = "The browser couldn't read that link. Download the sheet as a CSV and upload the file."
    }
  }
  throw new Error(message)
}

export async function rowsFromFile(file: File): Promise<string[][]> {
  if (file.size > 8_000_000) throw new Error("That file is too big. Export just the saved-translations sheet.")
  const name = file.name.toLowerCase()
  if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) {
    const { readSheet } = await import("read-excel-file/browser")
    const sheet = await readSheet(file)
    return sheet.map((row) => row.map(cellToString))
  }
  if (name.endsWith(".xls")) throw new Error("Save that spreadsheet as .xlsx or CSV, then upload it again.")
  return parseTable(await file.text())
}

function cellToString(value: unknown): string {
  if (value == null) return ""
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).trim()
}
