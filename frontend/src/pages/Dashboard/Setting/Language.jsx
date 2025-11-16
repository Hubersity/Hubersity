import React, { useState } from "react";
import { Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Language() {
  const { i18n } = useTranslation();

  // ใช้ค่าภาษาของ i18n (en/th/jp/cn)
  const [selectedLang, setSelectedLang] = useState(
    localStorage.getItem("appLang") || "en"
  );

  const languages = [
    { code: "th", label: "Thai", emoji: "🇹🇭" },
    { code: "en", label: "English", emoji: "🇬🇧" },
    { code: "cn", label: "Chinese", emoji: "🇨🇳" },
    { code: "jp", label: "Japanese", emoji: "🇯🇵" },
  ];

  const handleSave = () => {
    i18n.changeLanguage(selectedLang);
    localStorage.setItem("appLang", selectedLang);

    // รีโหลดเพื่อให้ sidebar/topbar เปลี่ยนภาษา
    window.location.reload();
  };

  return (
    <div className="p-6">
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <Globe2 className="text-[#8cab93]" size={26} />
        <h2 className="text-2xl font-bold text-gray-800">Language</h2>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-gray-800 font-medium text-base mb-1">
          App Language
        </p>
        <p className="text-sm text-gray-500 leading-relaxed">
          Select your preferred language for Hubersity menus and navigation.
        </p>
      </div>

      {/* Language Options */}
      <div className="bg-[#f7f6f6] border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-sm">
        {languages.map((lang) => (
          <label
            key={lang.code}
            className={`flex items-center justify-between py-3 px-4 rounded-xl cursor-pointer transition border ${
              selectedLang === lang.code
                ? "bg-[#e8f3ec] border-[#8cab93]"
                : "border-transparent hover:bg-[#ececec]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{lang.emoji}</span>
              <span className="text-gray-800 font-medium">{lang.label}</span>
            </div>

            <input
              type="radio"
              name="language"
              value={lang.code}
              checked={selectedLang === lang.code}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-5 h-5 accent-[#8cab93]"
            />
          </label>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-10">
        <button
          onClick={handleSave}
          className="bg-[#8cab93] text-white font-medium px-8 py-2.5 rounded-full shadow-sm hover:bg-[#7da186]"
        >
          Save Language
        </button>
      </div>
    </div>
  );
}