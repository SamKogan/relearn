import { pairsToCards } from "./cards"
import { hebrewCommon } from "./data/hebrewCommon"
import { rowsToCards } from "./parseSheet"
import type { Deck } from "./types"

export function commonDeck(langId: string): Deck | null {
  if (langId !== "he") return null
  return {
    id: "common:he",
    title: "1,000 common Hebrew words",
    source: "common",
    learningLang: "he",
    cards: pairsToCards(hebrewCommon, "he", "en"),
  }
}

export const SAMPLE_SHEET: readonly (readonly [string, string, string, string])[] = [
  ["Hebrew", "English", "גחליליות", "Fireflies"],
  ["Hebrew", "English", "גזעי", "racial"],
  ["Hebrew", "English", "גור כלבים", "Puppy"],
  ["Hebrew", "English", "גוסס", "dying"],
  ["Hebrew", "English", "גדה", "Bank"],
  ["Hebrew", "English", "בשורות", "tidings"],
  ["Hebrew", "English", "בצורת", "In drought"],
  ["Hebrew", "English", "בעודו", "While"],
  ["Hebrew", "English", "בילוי", "recreation"],
  ["Hebrew", "English", "בהמה", "animal"],
  ["Hebrew", "English", "אסופה", "collection"],
  ["Hebrew", "English", "אודם", "redness"],
  ["Hebrew", "English", "אוגר", "hamster"],
  ["Hebrew", "English", "אביר", "knight"],
  ["Hebrew", "English", "אבדות", "losses"],
  ["English", "Hebrew", "to plant", "לשתול"],
  ["English", "Hebrew", "stubborn", "עקשן"],
  ["English", "Hebrew", "sober up", "להתפכח"],
  ["English", "Hebrew", "rot", "רקוב"],
  ["English", "Hebrew", "rhymes", "חרוזים"],
  ["English", "Hebrew", "rhyme", "חריזה"],
  ["English", "Hebrew", "flashes", "מהבהבים"],
  ["English", "Hebrew", "flash", "הבהק"],
  ["English", "Hebrew", "continent", "יבשת"],
  ["English", "Hebrew", "commentary", "פרשנות"],
  ["English", "Hebrew", "burst out", "פרץ החוצה"],
  ["Hebrew", "English", "ערבות הדדית", "Mutual Responsibility"],
  ["Hebrew", "English", "מגירה", "Drawer"],
  ["Hebrew", "English", "מאורעות", "Events"],
  ["Hebrew", "English", "מאובזרים", "equipped"],
  ["Hebrew", "English", "לשררה", "To power"],
  ["Hebrew", "English", "לשרור", "prevail"],
  ["Hebrew", "English", "לשער", "suppose"],
]

export function sampleDeck(): Deck {
  return {
    id: "sample:he",
    title: "Sample saved words",
    source: "sample",
    learningLang: "he",
    cards: rowsToCards(
      SAMPLE_SHEET.map((row) => [...row]),
      "he",
    ).cards,
  }
}
