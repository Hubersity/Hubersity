import React from "react";

const blockedUsers = [
  {
    name: "aong",
    username: "Aong12345",
    image: "/images/Watcharapat.jpg",
  },
  {
    name: "Rose",
    username: "RoseAisp",
    image: "/images/Patthiaon.jpg",
  },
  {
    name: "Dog",
    username: "DogDogbodbod34",
    image: "/images/Karnpon.jpg",
  },
];

export default function BlockedUsers() {
  return (
    <div className="flex flex-col items-start justify-center px-10 py-8 w-full">
      {/* หัวข้อ */}
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Blocked Users
      </h2>

      {/* รายชื่อผู้ใช้ที่ถูกบล็อก */}
      <div className="flex flex-col gap-4 w-full">
        {blockedUsers.map((user, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
          >
            {/* ซ้าย: avatar + ชื่อ */}
            <div className="flex items-center gap-4">
              <img
                src={user.image}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
              <div>
                <p className="font-semibold text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>

            {/* ปุ่ม Unblock */}
            <button className="px-5 py-1.5 rounded-full font-medium text-sm bg-[#ea4124] text-white hover:bg-[#d93a20] transition-all">
              Unblock
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}