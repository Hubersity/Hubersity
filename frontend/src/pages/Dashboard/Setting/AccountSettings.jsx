import { useState } from "react";
import ChangePassword from "./ChangePassword";
import BlockedUsers from "./BlockedUsers";
import DeleteAccount from "./DeleteAccount";

export default function AccountSettings() {
  const [selectedSub, setSelectedSub] = useState("Change Password");

  const renderSub = () => {
    switch (selectedSub) {
      case "Change Password":
        return <ChangePassword />;
      case "Blocked Users":
        return <BlockedUsers />;
      case "Delete Account":
        return <DeleteAccount />;
      default:
        return <ChangePassword />;
    }
  };

  return (
    <div className="flex h-full">
      {/* คอลัมน์เมนูย่อย */}
      <div className="w-1/4 border-r border-gray-200 p-4">
        {["Change Password", "Blocked Users", "Delete Account"].map((sub) => (
          <div
            key={sub}
            onClick={() => setSelectedSub(sub)}
            className={`cursor-pointer p-2 rounded-lg mb-2 text-sm ${
              selectedSub === sub
                ? "bg-[#e0ebe2] text-emerald-700 font-semibold"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            {sub}
          </div>
        ))}
      </div>

      {/* พื้นที่เนื้อหา */}
      <div className="flex-1 p-6">{renderSub()}</div>
    </div>
  );
}