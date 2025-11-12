import { useState } from "react";
import AccountSettings from "./AccountSettings";
import Language from "./Language";
import ForHelp from "./ForHelp";

export default function Setting() {
  const [selected, setSelected] = useState("Account Settings");

  const renderContent = () => {
    switch (selected) {
      case "Account Settings":
        return <AccountSettings />;
      case "Language":
        return <Language />;
      case "For Help":
        return <ForHelp />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="flex h-full bg-white rounded-lg border">
      {/* คอลัมน์ซ้าย */}
      <div className="w-1/4 border-r border-gray-200 p-4">
        {["Account Settings", "Language", "For Help"].map((item) => (
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

      {/* คอนเทนต์ด้านขวา */}
      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}