import React, { useState } from "react";
import { Globe2 } from "lucide-react";

export default function Language() {
  const [selectedLang, setSelectedLang] = useState("English");

  const languages = [
    { name: "Thai", emoji: "🇹🇭" },
    { name: "English", emoji: "🇬🇧" },
    { name: "Chinese", emoji: "🇨🇳" },
    { name: "Japanese", emoji: "🇯🇵" },
  ];

  return (
    <div className="p-6">
      {/* หัวข้อ */}
      <div className="flex items-center gap-3 mb-6">
        <Globe2 className="text-[#8cab93]" size={26} />
        <h2 className="text-2xl font-bold text-gray-800">
          Language
        </h2>
      </div>

      {/* คำอธิบาย */}
      <div className="mb-6">
        <p className="text-gray-800 font-medium text-base mb-1">
          App Language
        </p>
        <p className="text-sm text-gray-500 leading-relaxed">
          Select your preferred language for Hubersity menus, buttons, and navigation text.
        </p>
      </div>

      {/* กล่องเลือกภาษา */}
      <div className="bg-[#f7f6f6] border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-sm hover:shadow-md transition-all duration-300">
        {languages.map((lang, index) => (
          <label
            key={index}
            htmlFor={lang.name}
            className={`flex items-center justify-between py-3 px-4 rounded-xl cursor-pointer transition-all duration-300 border border-transparent ${
              selectedLang === lang.name
                ? "bg-[#e8f3ec] border-[#8cab93]"
                : "hover:bg-[#ececec]"
            }`}
          >
            {/* ชื่อภาษา + ธง */}
            <div className="flex items-center gap-3">
              <span className="text-xl">{lang.emoji}</span>
              <span className="text-gray-800 font-medium">{lang.name}</span>
            </div>

            {/* ปุ่มเลือก */}
            <input
              id={lang.name}
              type="radio"
              name="language"
              value={lang.name}
              checked={selectedLang === lang.name}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-5 h-5 accent-[#8cab93] cursor-pointer"
            />
          </label>
        ))}
      </div>

      {/* ปุ่ม Save */}
      <div className="mt-10">
        <button
          className="bg-[#8cab93] text-white font-medium px-8 py-2.5 rounded-full shadow-sm hover:bg-[#7da186] transition-all duration-300"
        >
          Save Language
        </button>
      </div>
    </div>
  );
}