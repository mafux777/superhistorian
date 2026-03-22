"use client";

import { useHistorianStore } from "@/lib/store";

const LANGUAGES = [
  { code: "English", label: "English", flag: "🇬🇧" },
  { code: "French", label: "Français", flag: "🇫🇷" },
  { code: "German", label: "Deutsch", flag: "🇩🇪" },
  { code: "Spanish", label: "Español", flag: "🇪🇸" },
  { code: "Bahasa Indonesia", label: "Bahasa", flag: "🇮🇩" },
];

export default function LanguageSelector() {
  const { selectedLanguage, setSelectedLanguage } = useHistorianStore();
  const current = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];

  return (
    <select
      value={selectedLanguage}
      onChange={(e) => setSelectedLanguage(e.target.value)}
      className="px-3 py-1.5 text-xs font-mono text-sepia border border-sepia/30 rounded-lg hover:bg-sepia/10 transition-colors bg-transparent cursor-pointer appearance-none"
      style={{ backgroundImage: "none" }}
      title="Output language"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.label}
        </option>
      ))}
    </select>
  );
}
