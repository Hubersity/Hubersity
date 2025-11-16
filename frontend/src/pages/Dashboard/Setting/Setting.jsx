import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import AccountSettings from "./AccountSettings";
import Language from "./Language";
import ForHelp from "./ForHelp";
import FromApp from "./SettingAdminReply";

export default function Setting() {
  const { t } = useTranslation();

  // เมนูทั้งหมด + key ใช้กับ i18n
  const menuItems = [
    { key: "accountSettings", label: t("setting.accountSettings") },
    { key: "language", label: t("setting.language") },
    { key: "forHelp", label: t("setting.forHelp") },
    { key: "fromHubersity", label: t("setting.fromHubersity") }
  ];

  // อ่านแท็บล่าสุดจาก localStorage (default = accountSettings)
  const [selected, setSelected] = useState(
    localStorage.getItem("settingTab") || "accountSettings"
  );

  // เมื่อเปลี่ยนแท็บ → เซฟลง localStorage
  useEffect(() => {
    localStorage.setItem("settingTab", selected);
  }, [selected]);

  // เลือกคอนเทนต์ตามแท็บ
  const renderContent = () => {
    switch (selected) {
      case "accountSettings":
        return <AccountSettings />;
      case "language":
        return <Language />;
      case "forHelp":
        return <ForHelp />;
      case "fromHubersity":
        return <FromApp />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="flex h-full bg-white rounded-lg border">
      {/* Left Menu */}
      <div className="w-1/4 border-r border-gray-200 p-4">
        {menuItems.map((item) => (
          <div
            key={item.key}
            onClick={() => setSelected(item.key)}
            className={`cursor-pointer p-2 rounded-lg mb-2 text-sm ${
              selected === item.key
                ? "bg-[#e0ebe2] text-emerald-700 font-semibold"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Right Content */}
      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}