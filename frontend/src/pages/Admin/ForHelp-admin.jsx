// ForHelp-admin.jsx
import React, { useState, useEffect } from "react";
import { AlertTriangle, Mail, Paperclip } from "lucide-react";

const API_URL = "http://localhost:8000";  // เปลี่ยนตาม backend ของคุณ

export default function ForHelpAdmin() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [adminReply, setAdminReply] = useState("");

  // โหลดข้อมูลจาก backend
  useEffect(() => {
    fetch(`${API_URL}/help_reports/`)
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
        setSelected(data[0] || null);
      });
  }, []);

  // ปุ่ม style
  const buttonClass = `
    px-7 py-2 rounded-full
    bg-gradient-to-r from-[#d9f2dd] to-[#e0ebe2]
    text-emerald-900 font-medium text-sm
    shadow-md transition
    hover:shadow-xl hover:-translate-y-[2px]
    active:translate-y-0 active:shadow-sm
  `;

  const whiteButton = `
    px-7 py-2 rounded-full
    bg-white text-gray-700 font-medium text-sm border border-gray-300
    shadow-sm transition hover:bg-gray-100
  `;

  // ส่งข้อความตอบกลับ Admin → User
  const sendReply = async () => {
    if (!adminReply.trim()) return;

    const formData = new FormData();
    formData.append("reply", adminReply);

    const res = await fetch(`${API_URL}/help_reports/${selected.id}/reply`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("Reply sent to user!");
      setAdminReply("");
    }
  };

  // Mark as resolved
  const markResolved = async () => {
    const res = await fetch(`${API_URL}/help_reports/${selected.id}/resolve`, {
      method: "PUT",
    });

    if (res.ok) {
      const updated = reports.map((r) =>
        r.id === selected.id ? { ...r, resolved: true } : r
      );
      setReports(updated);
      setSelected({ ...selected, resolved: true });
    }
  };

  return (
    <div className="w-full">
      {/* Title */}
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="text-red-500" />
        <h1 className="text-xl font-semibold text-gray-800">For Help — Admin</h1>
      </div>

      <div className="flex w-full h-[80vh] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">

        {/* LEFT PANEL */}
        <aside className="w-1/3 border-r bg-[#fdfaf6]">
          <div className="px-5 py-4 border-b bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="text-emerald-600" />
              <p className="font-semibold text-gray-800">User Reports</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
              {reports.length}
            </span>
          </div>

          <div className="overflow-y-auto h-full">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left px-4 py-3 border-b flex items-center gap-3 relative transition ${
                  selected?.id === r.id ? "bg-[#e0ebe2]/40" : "hover:bg-gray-100"
                }`}
              >
                {/* Green tick */}
                {r.resolved && (
                  <span className="absolute left-2 top-2 w-4 h-4 bg-white border-2 border-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}

                <img
                  src={r.avatar || "/images/default.png"}
                  alt={r.username}
                  className="w-12 h-12 rounded-full object-cover border"
                />

                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{r.username}</p>
                  <p className="text-sm text-gray-600 line-clamp-1">{r.message}</p>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  {r.file_path && <Paperclip className="text-gray-500 w-5 h-5" />}
                  <span className="text-[11px] text-gray-500 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <section className="w-2/3 flex flex-col bg-[#fdfaf6] overflow-hidden">
          <div className="border-b px-6 py-4 flex items-center gap-3 bg-[#fdfaf6]">
            <Mail className="text-emerald-600" />
            <p className="text-lg font-semibold text-gray-800">Report Details</p>
          </div>

          {selected && (
            <div className="p-8 pb-24 space-y-6 overflow-y-auto h-[calc(80vh-40px)]">

              {/* User info */}
              <div className="flex items-center gap-4">
                <img
                  src={selected.avatar || "/images/default.png"}
                  className="w-16 h-16 rounded-full border shadow"
                  alt={selected.username}
                />
                <div>
                  <p className="text-xl font-semibold text-gray-900">{selected.username}</p>
                  <p className="text-gray-500 text-sm">
                    {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="bg-white border rounded-xl p-5 text-gray-700 shadow-sm">
                {selected.message}
              </div>

              {/* Attachment */}
              {selected.file_path && (
                <a
                  href={`${API_URL}/${selected.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer bg-white p-4 rounded-xl border shadow-sm flex items-center gap-3 hover:bg-[#e0ebe2]/30 transition"
                >
                  <Paperclip className="text-gray-600" />
                  <p className="text-sm text-gray-700 truncate">{selected.file_path}</p>
                  <span className="ml-auto text-emerald-600 font-medium text-sm">View</span>
                </a>
              )}

              {/* Admin Response */}
              <div>
                <p className="text-gray-700 font-medium mb-2">Admin Response</p>
                <textarea
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  placeholder="Write a helpful reply…"
                  className="w-full p-4 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-emerald-300"
                  rows={4}
                />

                {/* Buttons */}
                <div className="mt-4 flex gap-4">
                  <button className={buttonClass} onClick={sendReply}>
                    Send Response
                  </button>

                  <button className={whiteButton} onClick={markResolved}>
                    Mark as Resolved
                  </button>
                </div>
              </div>

            </div>
          )}
        </section>
      </div>
    </div>
  );
}