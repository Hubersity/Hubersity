import React from "react";

export default function DeleteAccount() {
  // mock ข้อมูลผู้ใช้ (เอาไว้ก่อน ถ้ายังไม่เชื่อม backend)
  const user = {
    name: "Dog",
    username: "DogDogbodbod34",
    age: 19,
    image: "/images/Karnpon.jpg", 
  };

  return (
    <div className="flex flex-col items-center justify-center px-10 py-8 w-full">
      {/* หัวข้อ */}
      <h2 className="text-xl font-semibold text-gray-800 mb-6 self-start">
        Delete Account
      </h2>

      {/* ส่วนแสดงข้อมูลผู้ใช้ */}
      <div className="flex flex-col items-center text-center space-y-4">
        <img
          src={user.image}
          alt={user.name}
          className="w-28 h-28 rounded-full object-cover border-2 border-gray-200"
        />
        <div>
          <p className="text-lg font-semibold text-gray-800">
            Username : {user.name}
          </p>
          <p className="text-gray-400 font-medium">
            name : {user.username}
          </p>
          <p className="text-gray-800 font-medium">Age: {user.age}</p>
        </div>
      </div>

      {/* ข้อความยืนยัน */}
      <div className="mt-8 flex items-center gap-4">
        <p className="text-gray-800 font-medium">
          Do you confirm to delete account
        </p>
        <button className="bg-[#ea4124] text-white font-medium px-6 py-2 rounded-full hover:bg-[#d93a20] transition">
          Confirm
        </button>
      </div>
    </div>
  );
}