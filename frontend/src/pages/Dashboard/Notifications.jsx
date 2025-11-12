import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function Notifications() {
  // mock data สำหรับการแจ้งเตือน
  // const [notifications, setNotifications] = useState([
  //   {
  //     id: 1,
  //     type: "comment",
  //     name: "Skibidi",
  //     avatar: "/images/Patthiaon.jpg",
  //     time: "today",
  //     text: `commented your post “Yes, I’ve taken the ISP course before. If you have any questions, you can DM me.”`,
  //     isFollowing: false,
  //   },
  //   {
  //     id: 2,
  //     type: "like",
  //     name: "Skibidi",
  //     avatar: "/images/Patthiaon.jpg",
  //     time: "today",
  //     text: "and 47 others liked your post.",
  //     isFollowing: false,
  //   },
  //   {
  //     id: 3,
  //     type: "follow",
  //     name: "Rose",
  //     avatar: "/images/Karnpon.jpg",
  //     time: "yesterday",
  //     text: "started following you.",
  //     isFollowing: false,
  //   },
  //   {
  //     id: 4,
  //     type: "like",
  //     name: "Pysart",
  //     avatar: "/images/Watcharapat.jpg",
  //     time: "this week",
  //     text: "and 102 others liked your post.",
  //     isFollowing: true,
  //   },
  //   {
  //     id: 5,
  //     type: "follow",
  //     name: "Pysart",
  //     avatar: "/images/Watcharapat.jpg",
  //     time: "this week",
  //     text: "started following you.",
  //     isFollowing: false,
  //   },
  // ]);
  const [notifications, setNotifications] = useState([]);

  // กด follow / unfollow
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
          type: "system", // or infer from n.title/message if needed
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

    if (created >= today && created < new Date(today.getTime() + 86400000)) return "today";
    if (created >= yesterday && created < today) return "yesterday";
    if (created >= startOfWeek && created <= endOfWeek) return "this week";
    return created.toISOString().split("T")[0];
  }

  // ✅ Group notifications by time
  const grouped = notifications.reduce((acc, cur) => {
    acc[cur.time] = acc[cur.time] ? [...acc[cur.time], cur] : [cur];
    return acc;
  }, {});

  // ✅ Order sections
  const order = ["today", "yesterday", "this week"];
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
        <h1 className="text-2xl font-semibold text-gray-800">Notification</h1>
      </div>

      {/* รายการแจ้งเตือน */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
        {Object.keys(grouped).map((section) => (
          <div key={section}>
            <h2 className="text-gray-500 font-medium mb-4 capitalize">
              {section}
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

                  {/* ปุ่ม Follow back เฉพาะ type follow */}
                  {n.type === "follow" && (
                    <button
                      onClick={() => handleFollowBack(n.id)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                        n.isFollowing
                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : "bg-[#6dbf74] text-white hover:bg-[#5aa862]"
                      }`}
                    >
                      {n.isFollowing ? "Following" : "Follow back"}
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