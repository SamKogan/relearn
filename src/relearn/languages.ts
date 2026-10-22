export type Lang = {
  id: string
  name: string
  native: string
  dir: "rtl" | "ltr"
  speech: string
  aliases: string[]
}

export const languages: readonly Lang[] = [
  { id: "he", name: "Hebrew", native: "עברית", dir: "rtl", speech: "he-IL", aliases: ["hebrew", "he", "iw", "עברית"] },
  { id: "en", name: "English", native: "English", dir: "ltr", speech: "en-US", aliases: ["english", "en", "אנגלית"] },
  { id: "es", name: "Spanish", native: "Español", dir: "ltr", speech: "es-ES", aliases: ["spanish", "es", "español", "espanol"] },
  { id: "fr", name: "French", native: "Français", dir: "ltr", speech: "fr-FR", aliases: ["french", "fr", "français", "francais"] },
  { id: "de", name: "German", native: "Deutsch", dir: "ltr", speech: "de-DE", aliases: ["german", "de", "deutsch"] },
  { id: "ar", name: "Arabic", native: "العربية", dir: "rtl", speech: "ar", aliases: ["arabic", "ar", "العربية"] },
  { id: "ru", name: "Russian", native: "Русский", dir: "ltr", speech: "ru-RU", aliases: ["russian", "ru", "русский"] },
  { id: "it", name: "Italian", native: "Italiano", dir: "ltr", speech: "it-IT", aliases: ["italian", "it", "italiano"] },
  { id: "pt", name: "Portuguese", native: "Português", dir: "ltr", speech: "pt-PT", aliases: ["portuguese", "pt", "português", "portugues", "portuguese (brazil)", "portuguese (portugal)"] },
  { id: "zh", name: "Chinese", native: "中文", dir: "ltr", speech: "zh-CN", aliases: ["chinese", "zh", "mandarin", "chinese (simplified)", "chinese (traditional)"] },
  { id: "ja", name: "Japanese", native: "日本語", dir: "ltr", speech: "ja-JP", aliases: ["japanese", "ja"] },
  { id: "ko", name: "Korean", native: "한국어", dir: "ltr", speech: "ko-KR", aliases: ["korean", "ko"] },
  { id: "yi", name: "Yiddish", native: "ייִדיש", dir: "rtl", speech: "yi", aliases: ["yiddish", "yi", "יידיש"] },
  { id: "nl", name: "Dutch", native: "Nederlands", dir: "ltr", speech: "nl-NL", aliases: ["dutch", "nl", "nederlands"] },
  { id: "pl", name: "Polish", native: "Polski", dir: "ltr", speech: "pl-PL", aliases: ["polish", "pl", "polski"] },
  { id: "tr", name: "Turkish", native: "Türkçe", dir: "ltr", speech: "tr-TR", aliases: ["turkish", "tr", "türkçe", "turkce"] },
  { id: "el", name: "Greek", native: "Ελληνικά", dir: "ltr", speech: "el-GR", aliases: ["greek", "el"] },
  { id: "uk", name: "Ukrainian", native: "Українська", dir: "ltr", speech: "uk-UA", aliases: ["ukrainian", "uk"] },
  { id: "hi", name: "Hindi", native: "हिन्दी", dir: "ltr", speech: "hi-IN", aliases: ["hindi", "hi"] },
  { id: "fa", name: "Persian", native: "فارسی", dir: "rtl", speech: "fa-IR", aliases: ["persian", "farsi", "fa", "فارسی"] },
]

const byId = new Map(languages.map((language) => [language.id, language]))

export function languageById(id: string | undefined): Lang | undefined {
  if (!id) return undefined
  return byId.get(id)
}

export function languageFromLabel(label: string): Lang | undefined {
  const folded = label.trim().toLocaleLowerCase("en")
  if (!folded) return undefined
  return languages.find(
    (language) =>
      language.id === folded ||
      language.name.toLocaleLowerCase("en") === folded ||
      language.native === label.trim() ||
      language.aliases.includes(folded),
  )
}

export function textDirection(langId: string): "rtl" | "ltr" {
  return languageById(langId)?.dir ?? "ltr"
}
