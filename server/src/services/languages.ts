export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", zh: "Chinese", de: "German", es: "Spanish",
  ru: "Russian", ko: "Korean", fr: "French", ja: "Japanese",
  pt: "Portuguese", tr: "Turkish", pl: "Polish", nl: "Dutch",
  ar: "Arabic", sv: "Swedish", it: "Italian", id: "Indonesian",
  hi: "Hindi", fi: "Finnish", vi: "Vietnamese", he: "Hebrew",
  uk: "Ukrainian", el: "Greek", ms: "Malay", cs: "Czech",
  ro: "Romanian", da: "Danish", hu: "Hungarian", ta: "Tamil",
  no: "Norwegian", th: "Thai", ur: "Urdu", hr: "Croatian",
  bg: "Bulgarian", lt: "Lithuanian", la: "Latin", cy: "Welsh",
  sk: "Slovak", te: "Telugu", fa: "Persian", bn: "Bengali",
  sr: "Serbian", sl: "Slovenian", sw: "Swahili", ka: "Georgian",
  be: "Belarusian", gu: "Gujarati", am: "Amharic", yi: "Yiddish",
  lo: "Lao", uz: "Uzbek", fo: "Faroese", ht: "Haitian Creole",
  ps: "Pashto", tk: "Turkmen", nn: "Norwegian Nynorsk", mt: "Maltese",
  sa: "Sanskrit", lb: "Luxembourgish", my: "Myanmar", bo: "Tibetan",
  tl: "Tagalog", mg: "Malagasy", as: "Assamese", tt: "Tatar",
  haw: "Hawaiian", ln: "Lingala", ha: "Hausa", ba: "Bashkir",
  jw: "Javanese", su: "Sundanese", yue: "Cantonese",
  ca: "Catalan", ml: "Malayalam", kn: "Kannada", et: "Estonian",
  mk: "Macedonian", br: "Breton", eu: "Basque", is: "Icelandic",
  hy: "Armenian", ne: "Nepali", mn: "Mongolian", bs: "Bosnian",
  kk: "Kazakh", sq: "Albanian", gl: "Galician", mr: "Marathi",
  pa: "Punjabi", si: "Sinhala", km: "Khmer", sn: "Shona",
  yo: "Yoruba", so: "Somali", af: "Afrikaans", oc: "Occitan",
  tg: "Tajik", sd: "Sindhi", az: "Azerbaijani", lv: "Latvian",
};

export const SUPPORTED_LANGUAGES = [
  "en", "zh", "de", "es", "ru", "ko", "fr", "ja", "pt", "tr",
  "pl", "ca", "nl", "ar", "sv", "it", "id", "hi", "fi", "vi",
  "he", "uk", "el", "ms", "cs", "ro", "da", "hu", "ta", "no",
  "th", "ur", "hr", "bg", "lt", "la", "ml", "cy", "sk",
  "te", "fa", "lv", "bn", "sr", "az", "sl", "kn", "et", "mk",
  "br", "eu", "is", "hy", "ne", "mn", "bs", "kk", "sq", "sw",
  "gl", "mr", "pa", "si", "km", "sn", "yo", "so", "af", "oc",
  "ka", "be", "tg", "sd", "gu", "am", "yi", "lo", "uz", "fo",
  "ht", "ps", "tk", "nn", "mt", "sa", "lb", "my", "bo", "tl",
  "mg", "as", "tt", "haw", "ln", "ha", "ba", "jw", "su", "yue",
];

export const TRANSLATION_TARGETS = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "no", name: "Norwegian" },
  { code: "cs", name: "Czech" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "uk", name: "Ukrainian" },
  { code: "bg", name: "Bulgarian" },
  { code: "hr", name: "Croatian" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "sr", name: "Serbian" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ur", name: "Urdu" },
  { code: "fa", name: "Persian" },
  { code: "sw", name: "Swahili" },
  { code: "tl", name: "Filipino" },
];

export function validateLanguage(detectedLang: string | null) {
  if (!detectedLang) {
    return {
      supported: false as const,
      message:
        "We couldn't detect the language in your audio. Please ensure the file contains clear speech and try again.",
    };
  }

  if (!SUPPORTED_LANGUAGES.includes(detectedLang)) {
    return {
      supported: false as const,
      message: `Sorry, "${detectedLang}" is not currently supported. We support 98+ languages including English, Spanish, French, German, Chinese, Japanese, and more.`,
    };
  }

  return {
    supported: true as const,
    language: detectedLang,
    languageName: LANGUAGE_NAMES[detectedLang] || detectedLang,
  };
}

export function validateTranslationTarget(targetLang: string) {
  const target = TRANSLATION_TARGETS.find((t) => t.code === targetLang);
  if (!target) {
    return {
      valid: false as const,
      message: `Translation to "${targetLang}" is not currently supported.`,
    };
  }
  return { valid: true as const, language: target };
}
