import React, { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function NotificationsAdmin() {
  function groupByDate(notifications) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    const formatDate = (date) => date.toISOString().split("T")[0];
    const grouped = {};


    notifications.forEach((n) => {
      const created = new Date(n.created_at);
      const dateStr = formatDate(created);

      if (created >= today && created < new Date(today.getTime() + 86400000)) {
        grouped["today"] = grouped["today"] ? [...grouped["today"], n] : [n];
      } else if (created >= yesterday && created < today) {
        grouped["yesterday"] = grouped["yesterday"] ? [...grouped["yesterday"], n] : [n];
      } else if (created >= startOfWeek && created <= endOfWeek) {
        grouped["this week"] = grouped["this week"] ? [...grouped["this week"], n] : [n];
      } else {
        grouped[dateStr] = grouped[dateStr] ? [...grouped[dateStr], n] : [n];
      }
    });

    return grouped;
  }

  // Group by time
  const grouped = groupByDate(notifications);
  const order = ["today", "yesterday", "this week"];
  const sections = order
    .filter((k) => grouped[k])
    .concat(Object.keys(grouped).filter((k) => !order.includes(k)).sort().reverse());


  useEffect(() => {
    async function fetchAdminNotifications() {
      try {
        const response = await fetch(`${API_URL}/notification/admin`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const raw = await response.json();

        const formatted = raw.map((n) => ({
          id: n.id,
          name: n.sender_username,
          avatar: n.sender_avatar ? `${API_URL}${n.sender_avatar}` : "/images/default-avatar.png",
          created_at: n.created_at,
          text: n.message,
          is_read: n.is_read || false
        }));

        setNotifications(formatted);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    }

    fetchAdminNotifications();
  }, []);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] bg-white overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <h1 className="text-2xl font-semibold text-gray-800">Notification</h1>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
        {sections.map((section) => (
          <div key={section}>
            <h2 className="text-gray-500 font-medium mb-4 capitalize">{section}</h2>

            <div className="flex flex-col gap-4">
              {grouped[section].map((n) => (
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
                        <span className="text-gray-600 font-normal">{n.text}</span>
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
