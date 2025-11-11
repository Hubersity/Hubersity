import React, { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function NotificationsAdmin() {
  // mock data สำหรับการแจ้งเตือน (แก้ smart-quote/ให้เป็น string ปกติ)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      name: "Skibidi",
      avatar: "/images/Skibidi.png",
      created_at: "2020-11-11T08:30:00Z",
      text: "Skibidi report post user zaza123.",
    },
    {
      id: 2,
      name: "Skibidi",
      avatar: "/images/Skibidi.png",
      created_at: "2025-11-09T09:00:00Z",
      text: "Skibidi and 47 others report post ID 203.",
    },
    {
      id: 3,
      name: "DogDogbodbod34",
      avatar: "/images/dogneverdie.png",
      created_at: "2025-11-10T15:00:00Z",
      text: "DogDogbodbod34 report post ID 205.",
    },
    {
      id: 4,
      name: "Aong12345",
      avatar: "/images/Aong12345.png",
      created_at: "2025-11-08T12:00:00Z",
      text: "Aong12345 and 102 others report user eiei56.",
    },
    {
      id: 5,
      name: "Pysart",
      avatar: "/images/Pysart.png",
      created_at: "2025-11-07T18:00:00Z",
      text: "Pysart and 23 others report post ID 202.",
    },
    {
      id: 6,
      name: "Gege",
      avatar: "/images/Pysart.png",
      created_at: "2025-11-10T18:00:00Z",
      text: "Pysart and 23 others report post ID 202.",
    },
  ]);

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

  // แยกกลุ่มตามเวลา
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

      {/* รายการแจ้งเตือน */}
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

                  {/* ถ้าต้องการปุ่ม action (ตัวอย่าง) */}
                  {/* <div>
                    <button className="text-sm px-3 py-1 border rounded">Mark read</button>
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
