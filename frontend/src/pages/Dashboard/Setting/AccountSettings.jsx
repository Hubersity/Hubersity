import { useState } from "react";
import { useTranslation } from "react-i18next";
import ChangePassword from "./ChangePassword";
import BlockedUsers from "./BlockedUsers";
import DeleteAccount from "./DeleteAccount";

export default function AccountSettings() {
  const { t } = useTranslation();

  const menuList = [
    { key: "changePassword", label: t("settings.changePassword") },
    { key: "blockedUsers", label: t("settings.blockedUsers") },
    { key: "deleteAccount", label: t("settings.deleteAccount") },
  ];

  const [selectedSub, setSelectedSub] = useState("changePassword");

  const renderSub = () => {
    switch (selectedSub) {
      case "changePassword":
        return <ChangePassword />;
      case "blockedUsers":
        return <BlockedUsers />;
      case "deleteAccount":
        return <DeleteAccount />;
      default:
        return <ChangePassword />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar Submenu */}
      <div className="w-1/4 border-r border-gray-200 p-4">
        {menuList.map((item) => (
          <div
            key={item.key}
            onClick={() => setSelectedSub(item.key)}
            className={`cursor-pointer p-2 rounded-lg mb-2 text-sm ${
              selectedSub === item.key
                ? "bg-[#e0ebe2] text-emerald-700 font-semibold"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6">{renderSub()}</div>
    </div>
  );
}