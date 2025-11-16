// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// โหลดไฟล์ JSON ตรงโฟลเดอร์ lang
import en from "./lang/en.json";
import th from "./lang/th.json";
import jp from "./lang/jp.json";
import cn from "./lang/cn.json";
import kr from "./lang/kr.json";   // Korean
import fr from "./lang/fr.json";   // French
import ar from "./lang/ar.json";   // Arabic

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    th: { translation: th },
    jp: { translation: jp },
    cn: { translation: cn },
    kr: { translation: kr },  
    fr: { translation: fr },  
    ar: { translation: ar },  
  },
  lng: localStorage.getItem("appLang") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;