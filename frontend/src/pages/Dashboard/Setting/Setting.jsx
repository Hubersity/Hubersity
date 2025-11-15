import { useState, useEffect } from "react";
import AccountSettings from "./AccountSettings";
import Language from "./Language";
import ForHelp from "./ForHelp";
import FromApp from "./SettingAdminReply"; 

export default function Setting() {
  // โหลดแท็บล่าสุด (default = Account Settings)
  const [selected, setSelected] = useState(
    localStorage.getItem("settingTab") || "Account Settings"
  );

  // เมื่อมีการเปลี่ยนแท็บ → เก็บลง localStorage
  useEffect(() => {
    localStorage.setItem("settingTab", selected);
  }, [selected]);

  // แสดงคอนเทนต์ตามแท็บที่เลือก
  const renderContent = () => {
    switch (selected) {
      case "Account Settings":
        return <AccountSettings />;
      case "Language":
        return <Language />;
      case "For Help":
        return <ForHelp />;
      case "From Hubersity":
        return <FromApp />;
      default:
        return <AccountSettings />;
    }
  };

  const menuItems = ["Account Settings", "Language", "For Help", "From Hubersity"]; 

  return (
    <div className="flex h-full bg-white rounded-lg border">
      {/* Left Menu */}
      <div className="w-1/4 border-r border-gray-200 p-4">
        {menuItems.map((item) => (
          <div
            key={item}
            onClick={() => setSelected(item)}
            className={`cursor-pointer p-2 rounded-lg mb-2 text-sm ${
              selected === item
                ? "bg-[#e0ebe2] text-emerald-700 font-semibold"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Right Content */}
      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}