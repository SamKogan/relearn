import { languageById } from "./languages"

export function speak(text: string, langId: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = languageById(langId)?.speech ?? "en-US"
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
