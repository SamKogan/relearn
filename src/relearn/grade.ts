const PUNCTUATION = /[.,!?;:"“”„‟«»()[\]{}״]/g
const NIQQUD = /[\u0591-\u05C7]/g
const FINALS: Record<string, string> = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" }

function normalizeHebrew(word: string): string {
  let normalized = ""
  for (const character of word.normalize("NFC").replace(NIQQUD, "")) {
    normalized += FINALS[character] ?? character
  }
  return normalized
}

export function senses(text: string): string[] {
  const parts = text
    .split(/\s*(?:\/|;|\|)\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : [text.trim()]
}

/** Stable identity for a pair: case, niqqud, and final letters do not create a second card. */
export function foldKey(text: string): string {
  const stripped = text.normalize("NFC").replace(/[\u0591-\u05C7]/g, "").replace(/\s+/g, " ").trim()
  if (/[\u0590-\u05FF]/.test(stripped)) return normalizeHebrew(stripped)
  return stripped.toLocaleLowerCase("en")
}

function loose(text: string): string {
  const stripped = text
    .normalize("NFC")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(PUNCTUATION, " ")
    .replace(/[־–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (/[\u0590-\u05FF]/.test(stripped)) return normalizeHebrew(stripped)
  return stripped.toLocaleLowerCase("en")
}

function variants(sense: string): string[] {
  const forms = new Set<string>()
  const base = loose(sense)
  if (base) forms.add(base)
  const withoutParen = loose(sense.replace(/\([^)]*\)/g, " "))
  if (withoutParen) forms.add(withoutParen)
  const withoutLead = withoutParen.replace(/^(the|a|an|to)\s+/, "").trim()
  if (withoutLead) forms.add(withoutLead)
  return [...forms]
}

export function isCorrect(expected: string, typed: string): boolean {
  const typedForms = variants(typed).filter(Boolean)
  if (typedForms.length === 0) return false
  const accepted = new Set(senses(expected).flatMap(variants))
  return typedForms.some((form) => accepted.has(form))
}

export function isClose(expected: string, typed: string): boolean {
  const typedForms = variants(typed).filter(Boolean)
  if (typedForms.length === 0) return false
  const accepted = senses(expected).flatMap(variants)
  return typedForms.some((typedForm) => {
    const limit = Array.from(typedForm).length > 6 ? 2 : 1
    return accepted.some((form) => {
      const distance = levenshtein(typedForm, form)
      return distance > 0 && distance <= limit
    })
  })
}

function levenshtein(leftText: string, rightText: string): number {
  const left = Array.from(leftText)
  const right = Array.from(rightText)
  const row = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let i = 1; i <= left.length; i++) {
    let diagonal = row[0] ?? 0
    row[0] = i
    for (let j = 1; j <= right.length; j++) {
      const current = row[j] ?? 0
      const previous = row[j - 1] ?? 0
      const next =
        left[i - 1] === right[j - 1] ? diagonal : Math.min(diagonal, previous, current) + 1
      diagonal = current
      row[j] = next
    }
  }
  return row[right.length] ?? 0
}
