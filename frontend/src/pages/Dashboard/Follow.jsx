import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";

export default function Follow() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const token = JSON.parse(localStorage.getItem(localStorage.getItem("currentUserKey") || ""))?.token;

  // โหลดรายชื่อคนที่เราติดตาม
  useEffect(() => {
    if (!token) return;

    const fetchFollowing = async () => {
      try {
        const res = await fetch(`${API_URL}/follow/following`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch following:", err);
      }
    };

    fetchFollowing();
  }, [token]);

  // Follow user
  const handleFollow = async (uid) => {
    try {
      const res = await fetch(`${API_URL}/follow/${uid}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // รีโหลดรายการ follow ใหม่
        const newRes = await fetch(`${API_URL}/follow/following`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await newRes.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Follow failed:", err);
    }
  };

  // Unfollow user
  const handleUnfollow = async (uid) => {
    try {
      const res = await fetch(`${API_URL}/follow/${uid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // ลบจาก state ทันที
        setUsers((prev) => prev.filter((u) => u.uid !== uid));
      }
    } catch (err) {
      console.error("Unfollow failed:", err);
    }
  };

  // ค้นหา user
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

      {/* รายชื่อผู้ใช้ที่เราติดตามอยู่ */}
      <div className="flex flex-col gap-4">
        {users.length === 0 ? (
          <p className="text-gray-500 text-sm">You haven't followed anyone yet.</p>
        ) : (
          users.map((u) => (
            <div
              key={u.uid}
              className="flex items-center justify-between bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
            >
              {/* ซ้าย: avatar + ชื่อ */}
              <div className="flex items-center gap-4">
                <img
                  src={
                    u.profile_image
                      ? u.profile_image.startsWith("http")
                        ? u.profile_image
                        : `${API_URL}${u.profile_image}`
                      : "/images/default.jpg"
                  }
                  alt={u.name}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <p className="font-semibold text-gray-800">{u.name || u.username}</p>
                  <p className="text-sm text-gray-500">@{u.username}</p>
                </div>
              </div>

              {/* ปุ่ม Follow / Following */}
              <button
                onClick={() => handleUnfollow(u.uid)}
                className="px-5 py-1.5 rounded-full font-medium text-sm bg-[#6dbf74] text-white hover:bg-[#5aa862] transition-all"
              >
                Following
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}