import React, { useState } from "react";
import { AlertCircle, FileUp } from "lucide-react";

const API_URL = "http://localhost:8000";

export default function ForHelp() {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // ดึง token ปัจจุบัน
  const currentKey = localStorage.getItem("currentUserKey");
  const authData = currentKey
    ? JSON.parse(localStorage.getItem(currentKey) || "{}")
    : null;

  const handleSubmit = async () => {
    if (!message.trim()) return;

    // ต้องเป็น FormData (อย่าตั้ง Content-Type เอง)
    const formData = new FormData();
    formData.append("message", message);
    if (file) formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/help_reports/create`, {
        method: "POST",
        headers: {
          // backend จะดึง user จาก token เอง
          Authorization: `Bearer ${authData?.token}`,
        },
        body: formData,
      });

      // พยายามอ่านข้อความผิดพลาดให้ได้ก่อน
      if (!res.ok) {
        const text = await res.text();
        alert("Error submitting report: " + (text || res.statusText));
        return;
      }

      // success
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
      setMessage("");
      setFile(null);
    } catch (err) {
      alert("Network error, please try again.");
    }
  };

  return (
    <div className="p-6 max-w-3xl w-full">
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="text-[#8cab93]" size={26} />
        <h2 className="text-2xl font-bold text-gray-800">For Help</h2>
      </div>

      <p className="text-gray-800 font-medium text-base mb-2">Report a Problem</p>
      <p className="text-sm text-gray-500 mb-4">
        Please provide details so we can resolve your issue quickly.
      </p>

      <textarea
        placeholder="Describe your issue here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full h-36 border border-gray-200 bg-[#f8f8f8] rounded-2xl p-4 text-gray-700 text-sm resize-none shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8cab93]"
      />

      <div className="flex justify-between items-center mt-6">
        <label
          htmlFor="file-upload"
          className="flex items-center gap-2 bg-[#f2f2f2] hover:bg-[#e6e6e6] text-gray-700 font-medium px-5 py-2 rounded-full shadow-sm cursor-pointer transition"
        >
          <FileUp size={18} />
          Add File
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        <button
          onClick={handleSubmit}
          className="bg-[#8cab93] hover:bg-[#7da186] text-white font-medium px-8 py-2.5 rounded-full shadow-md hover:shadow-lg transition"
        >
          Confirm
        </button>
      </div>

      {file && (
        <p className="mt-3 text-sm text-gray-600">
          📎 Attached: <span className="font-medium">{file.name}</span>
        </p>
      )}

      {submitted && (
        <p className="mt-4 text-[#8cab93] text-sm font-medium animate-fade-in">
          Report submitted successfully. Thank you!
        </p>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}