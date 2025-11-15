import React from "react";
import { AlertTriangle, LogOut } from "lucide-react";

export default function DeleteAccount() {
  const user = {
    name: "Dog",
    username: "DogDogbodbod34",
    age: 19,
    image: "/images/Karnpon.jpg",
  };

  return (
    <div className="flex justify-center items-start w-full px-6 pt-4 pb-10 -mt-4">
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
            src={user.image}
            alt={user.username}
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md"
          />

          {/* User Info */}
          <div className="text-center space-y-1">
            <p className="text-2xl font-semibold text-gray-900">{user.name}</p>
            <p className="text-gray-500">@{user.username}</p>
            <p className="text-gray-700 text-sm">Age: {user.age}</p>
          </div>

          {/* Divider */}
          <div className="w-full border-t my-4"></div>

          {/* Logout Button */}
          <button
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>

          {/* Danger Zone */}
          <div className="w-full mt-6 bg-red-50 border border-red-200 rounded-xl p-5 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-red-700">Danger Zone</h3>
            <p className="text-sm text-red-600 mt-1">
              Deleting your account is permanent and cannot be undone.
            </p>

            <button
              className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl shadow-md transition"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}