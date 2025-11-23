import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const API_URL = `${import.meta.env.VITE_API_URL}`;


export default function ChangePassword() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordAgain, setNewPasswordAgain] = useState("");
  const [errors, setErrors] = useState({
    current: "",
    newPass: [],
    confirm: "",
    api: "",
  });
  const currentKey = localStorage.getItem("currentUserKey");
  const authData = currentKey
    ? JSON.parse(localStorage.getItem(currentKey) || "{}")
    : null;

  // IG-style password rules
  const validateNewPassword = (password) => {
    return [
      { text: t("changePassword.rule1"), valid: password.length >= 8 },
      { text: t("changePassword.rule2"), valid: /[A-Z]/.test(password) },
      { text: t("changePassword.rule3"), valid: /\d/.test(password) },
      {
        text: t("changePassword.rule4"),
        valid: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      },
    ];
  };

  const handleSubmit = async () => {
    let newErrors = { current: "", newPass: [], confirm: "", api: "" };

    const rules = validateNewPassword(newPassword);
    newErrors.newPass = rules.filter((r) => !r.valid);

    if (newPassword !== newPasswordAgain) {
      newErrors.confirm = t("changePassword.errorMatch");
    }

    if (!currentPassword) {
      newErrors.current = t("changePassword.errorCurrent");
    }

    setErrors(newErrors);

    if (newErrors.current || newErrors.newPass.length > 0 || newErrors.confirm) return;

    try {
      const res = await fetch(`${API_URL}/users/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData?.token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_new_password: newPasswordAgain,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({ ...prev, api: data.detail || "Something went wrong" }));
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordAgain("");
      setErrors({ current: "", newPass: [], confirm: "", api: "" });

      alert("Password changed successfully!");
    } catch (err) {
      setErrors((prev) => ({ ...prev, api: "Network error. Please try again." }));
    }
  };


  return (
    <div className="flex flex-col items-start px-10 py-8 w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {t("changePassword.title")}
      </h2>

      <div className="flex flex-col space-y-6 w-full">

        {/* Current Password */}
        <div className="flex flex-col">
          <label className="text-gray-700 text-sm font-medium mb-1">
            {t("changePassword.current")}
          </label>

          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-[#f4f4f4] border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-400 transition"
          />

          {errors.current && (
            <motion.p
              key="currentError"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-xs mt-1"
            >
              {errors.current}
            </motion.p>
          )}
        </div>

        {/* New Password */}
        <div className="flex flex-col">
          <label className="text-gray-700 text-sm font-medium mb-1">
            {t("changePassword.new")}
          </label>

          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-[#f4f4f4] border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-400 transition"
          />

          {newPassword.length > 0 && (
            <div className="mt-3 space-y-1">
              {validateNewPassword(newPassword).map((rule, idx) => (
                <AnimatePresence key={idx}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-xs"
                  >
                    {rule.valid ? (
                      <span className="text-green-600 text-lg font-bold">✔</span>
                    ) : (
                      <span className="text-red-500 text-lg font-bold">✕</span>
                    )}

                    <span className={rule.valid ? "text-green-600" : "text-red-500"}>
                      {rule.text}
                    </span>
                  </motion.div>
                </AnimatePresence>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col">
          <label className="text-gray-700 text-sm font-medium mb-1">
            {t("changePassword.confirmNew")}
          </label>

          <input
            type="password"
            value={newPasswordAgain}
            onChange={(e) => setNewPasswordAgain(e.target.value)}
            className="w-full bg-[#f4f4f4] border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-400 transition"
          />

          {errors.confirm && (
            <motion.p
              key="confirmError"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-xs mt-1"
            >
              {errors.confirm}
            </motion.p>
          )}
        </div>

        {errors.api && (
          <p className="text-red-500 text-sm text-center">{errors.api}</p>
        )}

        {/* Submit Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleSubmit}
            className="bg-[#8cab93] hover:bg-[#7fa586] text-white font-medium shadow-md px-8 py-2 rounded-full transition"
          >
            {t("changePassword.confirmBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
