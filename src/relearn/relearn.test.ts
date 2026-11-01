import { describe, expect, it } from "vitest"
import { choiceOptions, mergeCards, pairsToCards } from "./cards"
import { SAMPLE_SHEET } from "./decks"
import { isClose, isCorrect } from "./grade"
import { hintFor } from "./hints"
import { parseTable, rowsToCards } from "./parseSheet"
import { accuracy, applyResult, mastery, pickRound } from "./schedule"
import { sheetCsvUrls } from "./spreadsheets"
import type { Card, WordStat } from "./types"

describe("grading", () => {
  it("accepts Hebrew finals, niqqud, and spacing", () => {
    expect(isCorrect("מלך", "מֶלֶךְ")).toBe(true)
    expect(isCorrect("סוף", "סופ")).toBe(true)
    expect(isCorrect("בית ספר", "בית  ספר")).toBe(true)
  })

  it("accepts case, articles, and a leading to", () => {
    expect(isCorrect("Fireflies", "fireflies")).toBe(true)
    expect(isCorrect("In drought", "in drought")).toBe(true)
    expect(isCorrect("to plant", "plant")).toBe(true)
    expect(isCorrect("Bank", "the bank")).toBe(true)
    expect(isCorrect("Mutual Responsibility", "mutual responsibility")).toBe(true)
  })

  it("accepts any listed sense, and rejects a different word", () => {
    expect(isCorrect("you (masculine)", "you")).toBe(true)
    expect(isCorrect("of / belonging to", "belonging to")).toBe(true)
    expect(isCorrect("he", "she")).toBe(false)
    expect(isCorrect("שלום", "")).toBe(false)
  })

  it("notices a near miss", () => {
    expect(isClose("Fireflies", "Fireflis")).toBe(true)
    expect(isClose("שלום", "כלב")).toBe(false)
  })
})

describe("hints", () => {
  it("never prints the whole answer", () => {
    for (const answer of ["גחליליות", "Fireflies", "פרץ החוצה"]) {
      for (const level of [1, 2, 3] as const) {
        expect(hintFor(answer, level).includes(answer)).toBe(false)
      }
    }
  })
})

describe("saved translations sheet", () => {
  it("reads either direction and skips other languages", () => {
    const rows = [
      ["Source language", "Target language", "Source text", "Translated text"],
      ...SAMPLE_SHEET.map((row) => [...row]),
      ["French", "English", "chien", "dog"],
    ]
    const parsed = rowsToCards(rows, "he")
    expect(parsed.cards).toHaveLength(SAMPLE_SHEET.length)
    expect(parsed.skipped).toBe(1)
    expect(parsed.cards.find((card) => card.learning === "גחליליות")?.known).toBe("Fireflies")
    expect(parsed.cards.find((card) => card.learning === "לשתול")?.known).toBe("to plant")
  })

  it("reads a two-column list and quoted commas", () => {
    const parsed = rowsToCards(
      [
        ["Fireflies", "גחליליות"],
        ["לשתול", "to plant"],
      ],
      "he",
    )
    expect(parsed.cards.map((card) => card.learning).sort()).toEqual(["גחליליות", "לשתול"])
    const quoted = parseTable('Hebrew,English,"hello, there",עולם\n')
    expect(quoted[0]).toEqual(["Hebrew", "English", "hello, there", "עולם"])
  })
})

describe("updating a list", () => {
  it("adds new pairs and keeps the ones already saved", () => {
    const existing = pairsToCards(
      [
        ["כלב", "dog"],
        ["סוף", "end"],
      ],
      "he",
      "en",
    )
    const incoming = pairsToCards(
      [
        ["כָּלֶב", "Dog"],
        ["סופ", "end"],
        ["חתול", "cat"],
      ],
      "he",
      "en",
    )
    const merged = mergeCards(existing, incoming)
    expect(merged.map((card) => card.learning)).toEqual(["כלב", "סוף", "חתול"])
    expect(merged[0]?.id).toBe(existing[0]?.id)
    expect(merged[1]?.id).toBe(existing[1]?.id)
  })
})

describe("scheduling", () => {
  it("fills a fresh deck with new words", () => {
    const cards = Array.from({ length: 20 }, (_, index) => ({ id: `c${index}` }))
    const round = pickRound(cards, {}, 10, () => 0.2)
    expect(round).toHaveLength(10)
    expect(new Set(round.map((card) => card.id)).size).toBe(10)
  })

  it("mixes missed words with new ones and leaves solid words out", () => {
    const cards = Array.from({ length: 12 }, (_, index) => ({ id: `c${index}` }))
    const stats: Record<string, WordStat | undefined> = {}
    stats.c0 = applyResult(undefined, "miss", 1)
    stats.c1 = applyResult(applyResult(applyResult(undefined, "clean", 1), "clean", 2), "clean", 3)
    const round = pickRound(cards, stats, 10, () => 0.1)
    const ids = round.map((card) => card.id)
    expect(ids).toContain("c0")
    expect(ids).not.toContain("c1")
  })

  it("reviews solid words once nothing else is left", () => {
    const cards = [{ id: "a" }, { id: "b" }, { id: "c" }]
    const solid = applyResult(applyResult(applyResult(undefined, "clean", 1), "clean", 2), "clean", 3)
    const stats = { a: solid, b: solid, c: solid }
    expect(mastery(solid)).toBe("solid")
    expect(pickRound(cards, stats, 2, () => 0.4)).toHaveLength(2)
  })

  it("does not count a hint as a clean answer", () => {
    const helped = applyResult(undefined, "helped", 1)
    expect(accuracy(helped)).toBe(0)
    expect(mastery(helped)).toBe("shaky")
    const clean = applyResult(helped, "clean", 2)
    expect(clean.streak).toBe(1)
    expect(applyResult(clean, "miss", 3).streak).toBe(0)
  })
})

describe("choices and links", () => {
  it("builds four choices that include the answer", () => {
    const cards: Card[] = ["א", "ב", "ג", "ד", "ה"].map((learning, index) => ({
      id: String(index),
      learning,
      known: `word ${index}`,
      learningLang: "he",
      knownLang: "en",
    }))
    const options = choiceOptions(cards[0] as Card, cards, "recall", () => 0.3)
    expect(options).toHaveLength(4)
    expect(options).toContain("א")
  })

  it("only accepts a Google Sheets link", () => {
    expect(sheetCsvUrls("https://example.com/spreadsheets/d/abc")).toBeNull()
    const urls = sheetCsvUrls("https://docs.google.com/spreadsheets/d/abc_123/edit#gid=7")
    expect(urls?.[0]).toContain("/d/abc_123/export?format=csv&gid=7")
  })
})
