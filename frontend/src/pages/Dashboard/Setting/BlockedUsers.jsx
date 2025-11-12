const blockedUsers = [
  {
    name: "aong",
    username: "Aong12345",
    image: "/images/Watcharapat.jpg",
  },
  {
    name: "Rose",
    username: "RoseAisp",
    image: "/images/Karnpon.jpg",
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
      <div className="flex flex-col space-y-5 w-full max-w-md">
        {blockedUsers.map((user, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b border-gray-200 pb-3"
          >
            {/* โปรไฟล์ */}
            <div className="flex items-center gap-4">
              <img
                src={user.image}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
              <div>
                <p className="font-medium text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-400">{user.username}</p>
              </div>
            </div>

            {/* ปุ่ม Unblock */}
            <button className="bg-[#ea4124] text-white px-5 py-1.5 rounded-full text-sm hover:bg-[#d93a20] transition">
              Unblock
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}