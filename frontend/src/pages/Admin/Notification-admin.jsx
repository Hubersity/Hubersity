import React, { useState, useEffect } from "react";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export default function NotificationsAdmin() {
  const [notifications, setNotifications] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [sections, setSections] = useState([]);

  function groupByDate(notifs) {
    if (!notifs || notifs.length === 0) return {};

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const groupedData = {};

    notifs.forEach((n) => {
      if (!n.created_at) return; // guard against null created_at

      const created = new Date(n.created_at);
      if (isNaN(created)) return; // guard against invalid date

      const dateStr = created.toISOString().split("T")[0];

      if (created >= today) {
        groupedData.today = [...(groupedData.today || []), n];
      } else if (created >= yesterday && created < today) {
        groupedData.yesterday = [...(groupedData.yesterday || []), n];
      } else {
        groupedData[dateStr] = [...(groupedData[dateStr] || []), n];
      }
    });

    return groupedData;
  }

  useEffect(() => {
    async function fetchAdminNotifications() {
      try {
        const key = localStorage.getItem("currentUserKey");
        const auth = key ? JSON.parse(localStorage.getItem(key)) : null;

        if (!auth?.token) {
          console.error("No auth token found");
          return;
        }

        const response = await fetch(`${API_URL}/notification/admin`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch notifications");

        const raw = await response.json();

        const formatted = raw.map((n) => ({
          id: n.id,
          name: n.sender_username,
          avatar: n.sender_avatar
            ? `${API_URL}${n.sender_avatar}`
            : "/images/default-avatar.png",
          created_at: n.created_at,
          text: n.message,
          is_read: n.is_read || false,
        }));

        setNotifications(formatted);

        const groupedData = groupByDate(formatted);
        setGrouped(groupedData);

        const order = ["today", "yesterday"];
        const extra = Object.keys(groupedData)
          .filter((k) => !order.includes(k))
          .sort()
          .reverse();

        setSections(order.filter((k) => groupedData[k]).concat(extra));
      } catch (err) {
        console.error("Fetch error:", err);
      }
    }

    fetchAdminNotifications();
  }, []);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] bg-white overflow-hidden">
      <div className="p-6 border-b bg-white">
        <h1 className="text-2xl font-semibold text-gray-800">Notification</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
        {sections.map((section) => (
          <div key={section}>
            <h2 className="text-gray-500 font-medium mb-4 capitalize">
              {section}
            </h2>
            <div className="flex flex-col gap-4">
              {grouped[section]?.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between border-b pb-4 last:border-b-0"
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
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
