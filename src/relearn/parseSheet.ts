import { cardKey } from "./cards"
import { foldKey } from "./grade"
import { languageById, languageFromLabel, type Lang } from "./languages"
import type { Card } from "./types"

const DISTINCT_SCRIPT = new Set(["he", "yi", "ar", "fa", "ru", "uk", "el"])

export function parseTable(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const delimiter = detectDelimiter(cleaned)
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let index = 0; index < cleaned.length; index++) {
    const character = cleaned[index] ?? ""
    if (quoted) {
      if (character === '"') {
        if (cleaned[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        cell += character
      }
      continue
    }
    if (character === '"') {
      quoted = true
      continue
    }
    if (character === delimiter) {
      row.push(cell.trim())
      cell = ""
      continue
    }
    if (character === "\n") {
      row.push(cell.trim())
      cell = ""
      if (row.some((value) => value !== "")) rows.push(row)
      row = []
      continue
    }
    cell += character
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell.trim())
    if (row.some((value) => value !== "")) rows.push(row)
  }
  return rows
}

function detectDelimiter(text: string): "," | "\t" | ";" {
  const first = text.split("\n").find((line) => line.trim()) ?? ""
  const scores = { ",": 0, "\t": 0, ";": 0 }
  let quoted = false
  for (const character of first) {
    if (character === '"') quoted = !quoted
    else if (!quoted && (character === "," || character === "\t" || character === ";")) scores[character] += 1
  }
  if (scores["\t"] > 0 && scores["\t"] >= scores[","] && scores["\t"] >= scores[";"]) return "\t"
  if (scores[";"] > scores[","]) return ";"
  return ","
}

export function rowsToCards(
  rows: readonly (readonly string[])[],
  learningLang: string,
): { cards: Card[]; skipped: number } {
  const learning = languageById(learningLang)
  if (!learning) return { cards: [], skipped: 0 }
  const cards: Card[] = []
  const seen = new Set<string>()
  let skipped = 0
  for (const raw of rows) {
    const row = raw.map((cell) => cell.trim())
    if (row.every((cell) => cell === "")) continue
    if (isHeader(row)) continue
    const card = cardFromRow(row, learning)
    if (!card) {
      skipped += 1
      continue
    }
    if (seen.has(card.id)) continue
    seen.add(card.id)
    cards.push(card)
    if (cards.length >= 5000) break
  }
  return { cards, skipped }
}

function isHeader(row: string[]): boolean {
  const cells = row.map((cell) => cell.toLocaleLowerCase("en"))
  if (
    (cells[0] === "source language" || cells[0] === "from_lang") &&
    (cells[1] === "target language" || cells[1] === "to_lang")
  ) {
    return true
  }
  if (cells[2] === "source text" || cells[2] === "translated text") return true
  if (cells[2] === "text" && cells[3] === "translation") return true
  if (cells[0] === "front" && cells[1] === "back") return true
  return false
}

function cardFromRow(row: string[], learning: Lang): Card | null {
  const langA = languageFromLabel(row[0] ?? "")
  const langB = languageFromLabel(row[1] ?? "")
  if (langA && langB && row[2] && row[3]) {
    if (langA.id === learning.id && langB.id !== learning.id) return makeCard(learning, row[2], row[3], langB.id)
    if (langB.id === learning.id && langA.id !== learning.id) return makeCard(learning, row[3], row[2], langA.id)
    return null
  }
  const filled = row.filter(Boolean)
  if (filled.length < 2) return null
  return fromTwoColumns(filled[0] ?? "", filled[1] ?? "", learning)
}

function fromTwoColumns(first: string, second: string, learning: Lang): Card | null {
  const scoreA = scriptScore(first, learning.id)
  const scoreB = scriptScore(second, learning.id)
  if (scoreA > scoreB && scoreA > 0) return makeCard(learning, first, second, guessLang(second))
  if (scoreB > scoreA && scoreB > 0) return makeCard(learning, second, first, guessLang(first))
  if (DISTINCT_SCRIPT.has(learning.id)) return null
  return makeCard(learning, second, first, guessLang(first))
}

function scriptScore(text: string, langId: string): number {
  const pattern =
    langId === "he" || langId === "yi"
      ? /[\u0590-\u05FF]/g
      : langId === "ar" || langId === "fa"
        ? /[\u0600-\u06FF]/g
        : langId === "ru" || langId === "uk"
          ? /[\u0400-\u04FF]/g
          : langId === "el"
            ? /[\u0370-\u03FF]/g
            : /[A-Za-zÀ-ÖØ-öø-ÿ]/g
  return text.match(pattern)?.length ?? 0
}

function guessLang(text: string): string {
  if (/[\u0590-\u05FF]/.test(text)) return "he"
  if (/[\u0600-\u06FF]/.test(text)) return "ar"
  if (/[\u0400-\u04FF]/.test(text)) return "ru"
  if (/[\u0370-\u03FF]/.test(text)) return "el"
  return "en"
}

function makeCard(learning: Lang, learningText: string, knownText: string, knownLang: string): Card | null {
  const learned = learningText.trim()
  const known = knownText.trim()
  if (!learned || !known) return null
  if (Array.from(learned).length > 280 || Array.from(known).length > 280) return null
  if (foldKey(learned) === foldKey(known)) return null
  return {
    id: cardKey(learning.id, learned, known),
    learning: learned,
    known,
    learningLang: learning.id,
    knownLang,
  }
}
