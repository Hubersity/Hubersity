import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const API_URL = "http://localhost:8000";

function UnfollowConfirmModal({ open, onClose, onConfirm, user }) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4 animate-fadeIn overflow-hidden">
        
        {/* header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("follow.modalTitle")}
          </h3>
        </div>

        {/* body */}
        <div className="px-6 py-6 text-center space-y-4">
          <img
            src={
              user?.profile_image
                ? user.profile_image.startsWith("http")
                  ? user.profile_image
                  : `${API_URL}${user.profile_image}`
                : "/images/default.jpg"
            }
            alt={user?.name}
            className="w-20 h-20 rounded-full object-cover border shadow-sm mx-auto"
          />

          <p className="text-gray-700 text-base">
            {t("follow.modalMessage")}{" "}
            <span className="font-semibold text-gray-900">@{user?.username}</span>?
          </p>

          <p className="text-sm text-gray-500">
            {t("follow.modalSubMessage")}
          </p>
        </div>

        {/* footer */}
        <div className="px-6 py-4 flex justify-end gap-3 bg-gray-50 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-white transition"
          >
            {t("follow.cancel")}
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
          >
            {t("follow.unfollow")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Follow() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);

  const token =
    JSON.parse(localStorage.getItem(localStorage.getItem("currentUserKey") || ""))?.token;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);

  // โหลดรายชื่อผู้ใช้ที่เราติดตาม
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

  // ค้นหา user
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim() !== "") {
      navigate(`/app/account/${search.trim()}`);
    }
  };

  return (
    <div className="p-10 w-full h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {t("follow.title")}
      </h1>

      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder={t("follow.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-[#e0ebe2] bg-white text-gray-700"
        />
      </form>

      {/* รายชื่อผู้ใช้ที่เราติดตาม */}
      <div className="flex flex-col gap-4">
        {users.length === 0 ? (
          <p className="text-gray-500 text-sm">{t("follow.noFollow")}</p>
        ) : (
          users.map((u) => (
            <div
              key={u.uid}
              className="flex items-center justify-between bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <img
                  src={
                    u.profile_image
                      ? u.profile_image.startsWith("http")
                        ? u.profile_image
                        : `${API_URL}${u.profile_image}`
                      : "/images/default.jpg"
                  }
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  alt={u.name}
                />

                <div>
                  <p className="font-semibold text-gray-800">
                    {u.name || u.username}
                  </p>
                  <p className="text-sm text-gray-500">@{u.username}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setTargetUser(u);
                  setConfirmOpen(true);
                }}
                className="px-5 py-1.5 rounded-full font-medium text-sm bg-[#6dbf74] text-white hover:bg-[#5aa862] transition-all"
              >
                {t("follow.following")}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <UnfollowConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        user={targetUser}
        onConfirm={() => {
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}