import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Follow() {
  const navigate = useNavigate();

  // รูปสมาชิกกลุ่ม
  const userProfiles = {
    aong: "/images/Watcharapat.jpg",
    Skibidi: "/images/Patthiaon.jpg",
    Pysart: "/images/Khittitaj.jpg",
    Dog: "/images/Karnpon.jpg",
  };

  // รายชื่อเพื่อนที่ follow อยู่แล้ว
  const initialUsers = [
    { id: 1, name: "aong", username: "Aong12345", avatar: userProfiles.aong, isFollowing: true },
    { id: 2, name: "Skibidi", username: "Skibidy", avatar: userProfiles.Skibidi, isFollowing: true },
    { id: 3, name: "Pysart", username: "PysartDev", avatar: userProfiles.Pysart, isFollowing: true },
    { id: 4, name: "Dog", username: "DogDogbodbod34", avatar: userProfiles.Dog, isFollowing: true },
  ];

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(initialUsers);

  // toggle follow/unfollow
  const handleFollowToggle = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isFollowing: !u.isFollowing } : u))
    );
  };

  // ไปหน้า account ของชื่อที่พิมพ์
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim() !== "") {
      navigate(`/app/account/${search.trim()}`);
    }
  };

  return (
    <div className="p-10 w-full h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Follow</h1>

      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Find account..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-[#e0ebe2] bg-white text-gray-700"
        />
      </form>

      {/* 👥 รายชื่อผู้ใช้ที่เราติดตามอยู่ */}
      <div className="flex flex-col gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
          >
            {/* ซ้าย: avatar + ชื่อ */}
            <div className="flex items-center gap-4">
              <img
                src={u.avatar}
                alt={u.name}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
              <div>
                <p className="font-semibold text-gray-800">{u.name}</p>
                <p className="text-sm text-gray-500">@{u.username}</p>
              </div>
            </div>

            {/* ปุ่ม Follow / Following */}
            <button
              onClick={() => handleFollowToggle(u.id)}
              className={`px-5 py-1.5 rounded-full font-medium text-sm transition-all ${
                u.isFollowing
                  ? "bg-[#6dbf74] text-white hover:bg-[#5aa862]"
                  : "border border-[#6dbf74] text-[#6dbf74] hover:bg-[#eaf7eb]"
              }`}
            >
              {u.isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}