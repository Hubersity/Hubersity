import React, { useEffect, useState } from "react";
import { AlertTriangle, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const API_URL = `${import.meta.env.VITE_API_URL}`;

function DeleteConfirmModal({ onCancel, onConfirm }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="relative w-[420px] bg-white rounded-2xl shadow-xl border border-red-300 overflow-hidden"
      >
        {/* HEADER */}
        <div className="bg-red-100 px-6 py-4 border-b border-red-200 flex items-center gap-3">
          <AlertTriangle className="text-red-600 w-6 h-6" />
          <h2 className="text-lg font-semibold text-red-700">
            {t("deleteAccount.modalTitle")}
          </h2>
        </div>

        {/* BODY */}
        <div className="px-6 py-6 text-center space-y-3">
          <p className="text-gray-700">{t("deleteAccount.modalText1")}</p>
          <p className="text-red-600 font-medium text-sm">
            {t("deleteAccount.modalText2")}
          </p>
        </div>

        {/* BUTTONS */}
        <div className="px-6 pb-6 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
          >
            {t("deleteAccount.cancel")}
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition shadow-md shadow-red-300"
          >
            {t("deleteAccount.confirmDelete")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function DeleteAccount() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem("currentUserKey");
    if (!key) return navigate("/login");

    setUser(JSON.parse(localStorage.getItem(key) || "{}"));
  }, []);

  if (!user) return null;

  const getProfileImage = () => {
    if (!user?.profile_image) return "/images/default-avatar.png";

    const img = user.profile_image;

    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads/")) return `${API_URL}${img}`;
    if (img.startsWith("uploads/")) return `${API_URL}/${img}`;
    if (img.startsWith("user/")) return `${API_URL}/uploads/${img}`;

    return `${API_URL}/uploads/user/${img}`;
  };

  const handleLogout = () => {
    const key = localStorage.getItem("currentUserKey");
    if (key) localStorage.removeItem(key);

    localStorage.removeItem("currentUserKey");
    navigate("/login");
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/users/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || t("deleteAccount.deleteFailed"));
        return;
      }

      const key = localStorage.getItem("currentUserKey");
      if (key) localStorage.removeItem(key);

      localStorage.removeItem("currentUserKey");

      alert(t("deleteAccount.deletedSuccess"));
      navigate("/signup");
    } catch (err) {
      alert(t("deleteAccount.networkError"));
    }
  };

  return (
    <div className="flex justify-center items-start w-full px-6 pt-4 pb-10 -mt-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-red-50 to-orange-50 border-b flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            {t("deleteAccount.title")}
          </h2>
        </div>

        <div className="px-10 py-10 flex flex-col items-center space-y-6">
          <img
            src={getProfileImage()}
            alt={user.username}
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md"
          />

          <div className="text-center space-y-1">
            <p className="text-2xl font-semibold text-gray-900">
              {user.name || user.username}
            </p>
            <p className="text-gray-500">@{user.username}</p>
          </div>

          <div className="w-full border-t my-4"></div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            {t("deleteAccount.logout")}
          </button>

          {/* Danger Zone */}
          <div className="w-full mt-6 bg-red-50 border border-red-200 rounded-xl p-5 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-red-700">
              {t("deleteAccount.dangerTitle")}
            </h3>
            <p className="text-sm text-red-600 mt-1">
              {t("deleteAccount.dangerText")}
            </p>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl shadow-md transition"
            >
              {t("deleteAccount.deleteButton")}
            </button>
          </div>
        </div>
      </div>

      {/* POPUP */}
      {showDeleteModal && (
        <DeleteConfirmModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}