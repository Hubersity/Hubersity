import React, { useEffect, useState } from "react";
import { AlertTriangle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const API_URL = "http://localhost:8000";


function DeleteConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* DARK BG */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* MODAL BOX */}
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
            Confirm Account Deletion
          </h2>
        </div>

        {/* BODY */}
        <div className="px-6 py-6 text-center space-y-3">
          <p className="text-gray-700">
            Are you absolutely sure you want to delete your account?
          </p>

          <p className="text-red-600 font-medium text-sm">
            This action is permanent and cannot be undone.
          </p>
        </div>

        {/* BUTTONS */}
        <div className="px-6 pb-6 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200
              text-gray-700 font-medium transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700
              text-white font-semibold transition shadow-md shadow-red-300"
          >
            Delete Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}


export default function DeleteAccount() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load User
  useEffect(() => {
    const key = localStorage.getItem("currentUserKey");
    if (!key) return navigate("/login");

    const data = JSON.parse(localStorage.getItem(key) || "{}");
    setUser(data);
  }, []);

  if (!user) return null;

  // FIX PATH FOR PROFILE IMAGE
  const getProfileImage = () => {
    if (!user?.profile_image) return "/images/default-avatar.png";

    const img = user.profile_image;

    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads/")) return `http://localhost:8000${img}`;
    if (img.startsWith("uploads/")) return `http://localhost:8000/${img}`;
    if (img.startsWith("user/"))
      return `http://localhost:8000/uploads/${img}`;

    return `http://localhost:8000/uploads/user/${img}`;
  };

  // LOGOUT
  const handleLogout = () => {
    const key = localStorage.getItem("currentUserKey");
    if (key) localStorage.removeItem(key);

    localStorage.removeItem("currentUserKey");
    navigate("/login");
  };

  // DELETE ACCOUNT
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
        alert(err.detail || "Failed to delete account.");
        return;
      }

      const key = localStorage.getItem("currentUserKey");
      if (key) localStorage.removeItem(key);

      localStorage.removeItem("currentUserKey");

      alert("Your account has been deleted.");
      navigate("/signup");
    } catch (err) {
      alert("Network error.");
    }
  };

  return (
    <div className="flex justify-center items-start w-full px-6 pt-4 pb-10 -mt-4">

      {/* MAIN CARD */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-red-50 to-orange-50 border-b flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Account Management
          </h2>
        </div>

        {/* BODY */}
        <div className="px-10 py-10 flex flex-col items-center space-y-6">

          {/* Avatar */}
          <img
            src={getProfileImage()}
            alt={user.username}
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md"
          />

          {/* User Info */}
          <div className="text-center space-y-1">
            <p className="text-2xl font-semibold text-gray-900">
              {user.name || user.username}
            </p>
            <p className="text-gray-500">@{user.username}</p>
          </div>

          <div className="w-full border-t my-4"></div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200
            text-gray-700 py-3 rounded-xl font-medium transition shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>

          {/* DANGER ZONE */}
          <div className="w-full mt-6 bg-red-50 border border-red-200 rounded-xl p-5 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-red-700">Danger Zone</h3>
            <p className="text-sm text-red-600 mt-1">
              Deleting your account is permanent and cannot be undone.
            </p>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl shadow-md transition"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* SHOW POPUP */}
      {showDeleteModal && (
        <DeleteConfirmModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}