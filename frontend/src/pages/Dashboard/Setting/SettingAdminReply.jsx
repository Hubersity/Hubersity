import React, { useState } from "react";
import { Mail } from "lucide-react";

export default function SettingAdminReply() {
  const replies = [
    {
      id: 1,
      title: "Your report has been resolved",
      message:
        "We have checked your issue about not being able to post on Board. It is now fixed!",
      time: "2 hours ago",
    },
    {
      id: 2,
      title: "Password issue checked",
      message:
        "We reviewed your problem about changing password. Everything should work properly now.",
      time: "Yesterday",
    },
    {
      id: 3,
      title: "Notification issue status",
      message:
        "Thanks for reporting. We are still working on your notification problem.",
      time: "2 days ago",
    },
  ];

  const [selected, setSelected] = useState(replies[0]);

  return (
    <div className="w-full flex gap-6">

      {/* LEFT SIDE LIST */}
      <aside className="w-1/3 bg-[#fdfaf6] border rounded-2xl shadow-sm overflow-hidden">
        {/* header */}
        <div className="px-5 py-4 border-b bg-white flex items-center gap-2">
          <Mail className="text-emerald-600" />
          <p className="font-semibold text-gray-800">From App</p>
        </div>

        {/* item list */}
        <div className="overflow-y-auto h-[70vh]">
          {replies.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className={`w-full text-left px-4 py-4 border-b flex items-start gap-3 transition ${
                selected?.id === item.id
                  ? "bg-[#e0ebe2]/40"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-800 truncate">
                  {item.title}
                </p>
                <p className="text-sm text-gray-600 line-clamp-1">
                  {item.message}
                </p>
              </div>

              <span className="ml-auto text-[11px] text-gray-500 whitespace-nowrap pt-1">
                {item.time}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* RIGHT SIDE DETAIL */}
      <section className="w-2/3 bg-[#fdfaf6] border rounded-2xl shadow-sm p-8 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Mail className="text-emerald-600" /> Admin Reply
        </h2>

        {/* message card */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <p className="text-xl font-semibold text-gray-900">{selected.title}</p>
          <p className="text-sm text-gray-500 mb-4">{selected.time}</p>

          <p className="text-gray-700 leading-relaxed">{selected.message}</p>
        </div>
      </section>
    </div>
  );
}