import React, { useState } from "react";

export default function NotificationsAdmin() {
  // mock data สำหรับการแจ้งเตือน (แก้ smart-quote/ให้เป็น string ปกติ)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      name: "Skibidi",
      avatar: "/images/Skibidi.png",
      time: "today",
      text: "Skibidi report post user zaza123.",
    },
    {
      id: 2,
      name: "Skibidi",
      avatar: "/images/Skibidi.png",
      time: "today",
      text: "Skibidi and 47 others report post ID 203.",
    },
    {
      id: 3,
      name: "DogDogbodbod34",
      avatar: "/images/dogneverdie.png",
      time: "yesterday",
      text: "DogDogbodbod34 report post ID 205.",
    },
    {
      id: 4,
      name: "Aong12345",
      avatar: "/images/Aong12345.png",
      time: "this week",
      text: "Aong12345 and 102 others report user eiei56.",
    },
    {
      id: 5,
      name: "Pysart",
      avatar: "/images/Pysart.png",
      time: "this week",
      text: "Pysart and 23 others report post ID 202.",
    },
  ]);

  // แยกกลุ่มตามเวลา
  const grouped = notifications.reduce((acc, cur) => {
    acc[cur.time] = acc[cur.time] ? [...acc[cur.time], cur] : [cur];
    return acc;
  }, {});

  // กำหนดลำดับที่ต้องการแสดง (optional)
  const order = ["today", "yesterday", "this week"];
  const sections = order.filter((k) => grouped[k]).concat(
    Object.keys(grouped).filter((k) => !order.includes(k))
  );

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
