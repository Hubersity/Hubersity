import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const API_URL = "http://localhost:8000";


export default function BlockedUsers() {
  const { t } = useTranslation();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // popup state
  const [confirmUnblockOpen, setConfirmUnblockOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const currentKey = localStorage.getItem("currentUserKey");
  const authData = currentKey
    ? JSON.parse(localStorage.getItem(currentKey) || "{}")
    : null;


  // Load the list of people we blocked
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      if (!authData?.token) return;

      try {
        const res = await fetch(`${API_URL}/block/list`, {
          headers: { Authorization: `Bearer ${authData.token}` },
        });

        const blockList = await res.json();

        const detailedUsers = await Promise.all(
          blockList.map(async (b) => {
            const uRes = await fetch(`${API_URL}/users/${b.blocked_id}`, {
              headers: { Authorization: `Bearer ${authData.token}` },
            });
            return await uRes.json();
          })
        );

        setBlockedUsers(detailedUsers);
        setLoading(false);
      } catch (err) {
        console.error("Error loading blocked users:", err);
        setLoading(false);
      }
    };

    fetchBlockedUsers();
  }, []);

  // Really Unblock
  const confirmUnblock = async () => {
    if (!selectedUser || !authData?.token) return;

    try {
      const res = await fetch(`${API_URL}/block/${selectedUser.uid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authData.token}` },
      });

      if (res.ok) {
        setBlockedUsers((prev) =>
          prev.filter((u) => u.uid !== selectedUser.uid)
        );
        setConfirmUnblockOpen(false);
        setSelectedUser(null);
      }
    } catch (err) {
      console.error("Unblock failed:", err);
    }
  };


  if (loading)
    return (
      <p className="px-10 py-10 text-gray-500">
        {t("blockedUsers.loading")}
      </p>
    );


  return (
    <div className="relative flex flex-col items-start justify-center px-10 py-8 w-full">
      {/* title */}
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {t("blockedUsers.title")}
      </h2>

      {/* List of blocked people */}
      <div className="flex flex-col gap-4 w-full">
        {blockedUsers.map((user) => (
          <div
            key={user.uid}
            className="flex items-center justify-between bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <img
                src={
                  user.profile_image
                    ? `${API_URL}${user.profile_image}`
                    : "/images/default-avatar.png"
                }
                alt={user.username}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
              <div>
                <p className="font-semibold text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>

            {/* Unblock button*/}
            <button
              onClick={() => {
                setSelectedUser(user);
                setConfirmUnblockOpen(true);
              }}
              className="px-5 py-1.5 rounded-full font-medium text-sm bg-[#ea4124] text-white hover:bg-[#d93a20] transition-all"
            >
              {t("blockedUsers.unblock")}
            </button>
          </div>
        ))}

        {blockedUsers.length === 0 && (
          <p className="text-gray-500 italic">
            {t("blockedUsers.noBlocked")}
          </p>
        )}
      </div>

      {/* POPUP Confirm Unblock */}
      {confirmUnblockOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmUnblockOpen(false)}
          />

          <div
            className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md mx-4 overflow-hidden animate-fadeIn"
            style={{ animation: "fadeIn 0.25s ease" }}
          >
            {/* HEADER */}
            <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                {t("blockedUsers.popupTitle")}
              </h3>
            </div>

            {/* BODY */}
            <div className="px-6 py-6 text-gray-700 text-center">
              <p className="text-sm mb-1">{t("blockedUsers.popupMessage")}</p>
              <p className="font-semibold text-gray-900 text-lg">
                @{selectedUser.username}?
              </p>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setConfirmUnblockOpen(false)}
                className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-medium transition"
              >
                {t("blockedUsers.cancel")}
              </button>

              <button
                onClick={confirmUnblock}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium shadow-md transition-all"
              >
                {t("blockedUsers.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
