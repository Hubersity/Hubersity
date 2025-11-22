import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export default function Notifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);

  const handleFollowBack = (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, isFollowing: !n.isFollowing } : n
      )
    );
  };

  useEffect(() => {
    const currentKey = localStorage.getItem("currentUserKey");
    const authData = currentKey
      ? JSON.parse(localStorage.getItem(currentKey) || "{}")
      : null;

    if (!authData?.token) return;

    async function fetchNotifications() {
      try {
        const res = await fetch(`${API_URL}/notification/me`, {
          headers: {
            Authorization: `Bearer ${authData.token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch notifications");

        const raw = await res.json();

        const formatted = raw.map((n) => ({
          id: n.id,
          type: n.type || "system",
          name: n.sender_username,
          avatar: n.sender_avatar ? `${API_URL}${n.sender_avatar}` : "/images/default-avatar.png",
          time: groupTime(n.created_at),
          text: n.message,
          isFollowing: false,
        }));

        setNotifications(formatted);
      } catch (err) {
        console.error("Error loading notifications:", err);
      }
    }

    fetchNotifications();
  }, []);

  function groupTime(dateStr) {
    const created = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    if (created >= today && created < new Date(today.getTime() + 86400000))
      return "today";
    if (created >= yesterday && created < today) return "yesterday";
    if (created >= startOfWeek && created <= endOfWeek) return "thisWeek";
    return created.toISOString().split("T")[0];
  }

  const grouped = notifications.reduce((acc, cur) => {
    acc[cur.time] = acc[cur.time] ? [...acc[cur.time], cur] : [cur];
    return acc;
  }, {});

  const order = ["today", "yesterday", "thisWeek"];

  const sections = order
    .filter((key) => grouped[key])
    .concat(
      Object.keys(grouped)
        .filter((key) => !order.includes(key))
        .sort()
        .reverse()
    );


  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] bg-white overflow-hidden">

      {/* Header */}
      <div className="p-6 border-b bg-white">
        <h1 className="text-2xl font-semibold text-gray-800">
          {t("notification.title")}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">

        {sections.length === 0 && (
          <p className="text-gray-500 text-sm">{t("notification.noNotification")}</p>
        )}

        {sections.map((section) => (
          <div key={section}>
            <h2 className="text-gray-500 font-medium mb-4 capitalize">
              {t(`notification.${section}`, section)}
            </h2>

            <div className="flex flex-col gap-4">
              {grouped[section].map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between border-b pb-4 last:border-none"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={n.avatar}
                      alt={n.name}
                      className="w-12 h-12 rounded-full border object-cover"
                    />
                    <div>
                      <p className="text-gray-800 font-medium">
                        {n.name}{" "}
                        <span className="text-gray-600 font-normal">
                          {n.text}
                        </span>
                      </p>
                    </div>
                  </div>

                  {n.type === "follow" && (
                    <button
                      onClick={() => handleFollowBack(n.id)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                        n.isFollowing
                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : "bg-[#6dbf74] text-white hover:bg-[#5aa862]"
                      }`}
                    >
                      {n.isFollowing
                        ? t("notification.following")
                        : t("notification.followBack")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
