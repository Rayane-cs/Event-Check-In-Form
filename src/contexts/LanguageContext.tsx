import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "fr" | "ar";

export const translations = {
  en: {
    dir: "ltr" as const,
    presence: {
      title: "Event Presence Check-In",
      subtitle: "Register your attendance",
      fullName: "Full Name",
      fullNamePh: "e.g. Ahmed Benali",
      speciality: "Speciality",
      specialityPh: "Select your speciality",
      level: "Academic Level",
      levelPh: "Select your level",
      feedback: "Feedback (Optional)",
      feedbackPh: "Your thoughts on the event...",
      submit: "Submit Check-In",
      submitting: "Submitting...",
      required: "This field is required.",
      success: "Check-in Successful",
      successMsg: "Your attendance has been registered.",
      error: "Something went wrong. Please try again.",
      specialities: [
        "Computer Science",
        "Physics",
        "Mathematics",
        "Other",
      ],
      closeModal: "Return Home",
    },
  },
  fr: {
    dir: "ltr" as const,
    presence: {
      title: "Présence - Enregistrement",
      subtitle: "Enregistrez votre présence",
      fullName: "Nom complet",
      fullNamePh: "ex. Ahmed Benali",
      speciality: "Spécialité",
      specialityPh: "Sélectionnez votre spécialité",
      level: "Niveau académique",
      levelPh: "Sélectionnez votre niveau",
      feedback: "Feedback (Optionnel)",
      feedbackPh: "Vos commentaires sur l'événement...",
      submit: "Valider L'enregistrement",
      submitting: "Envoi en cours...",
      required: "Ce champ est obligatoire.",
      success: "Enregistrement réussi",
      successMsg: "Votre présence a été enregistrée.",
      error: "Une erreur s'est produite. Veuillez réessayer.",
      specialities: [
        "Informatique",
        "Physique",
        "Mathématiques",
        "Autre",
      ],
      closeModal: "Retourner à l'accueil",
    },
  },
  ar: {
    dir: "rtl" as const,
    presence: {
      title: "تسجيل الحضور",
      subtitle: "سجل حضورك في الحدث",
      fullName: "الاسم الكامل",
      fullNamePh: "مثال: أحمد بن علي",
      speciality: "التخصص",
      specialityPh: "اختر تخصصك",
      level: "المستوى الأكاديمي",
      levelPh: "اختر مستواك",
      feedback: "التعليقات (اختياري)",
      feedbackPh: "آرائك حول الحدث...",
      submit: "إرسال التسجيل",
      submitting: "جاري الإرسال...",
      required: "هذا الحقل مطلوب.",
      success: "تم التسجيل بنجاح",
      successMsg: "تم تسجيل حضورك.",
      error: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      specialities: [
        "إعلام آلي",
        "فيزياء",
        "رياضيات",
        "أخرى",
      ],
      closeModal: "العودة للرئيسية",
    },
  },
};

type TranslationKeys = typeof translations.en;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TranslationKeys;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem("brainhack_lang");
    return (saved as Lang) || "en";
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("brainhack_lang", newLang);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = translations[lang].dir;
  }, [lang]);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t: translations[lang],
        dir: translations[lang].dir,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLang must be used within LanguageProvider");
  }
  return context;
};
