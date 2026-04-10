import { useLang, Lang } from "@/contexts/LanguageContext";

const langLabels: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "ar", label: "AR" },
];

export const LanguageSwitcher = () => {
  const { lang, setLang } = useLang();

  return (
    <div className="language-switcher">
      {langLabels.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          title={label}
          className={`lang-btn ${lang === code ? "active" : ""}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
