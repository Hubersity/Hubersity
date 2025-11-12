import React, { useState } from "react";
import { AlertCircle, FileUp } from "lucide-react";

export default function ForHelp() {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (message.trim() === "") return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
    setMessage("");
    setFile(null);
  };

  return (
    <div className="p-6 max-w-3xl w-full">
      {/* หัวข้อใหญ่ */}
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="text-[#8cab93]" size={26} />
        <h2 className="text-2xl font-bold text-gray-800">For Help</h2>
      </div>

      {/* หัวข้อย่อย */}
      <p className="text-gray-800 font-medium text-base mb-2">
        Report a Problem
      </p>
      <p className="text-sm text-gray-500 mb-4">
        Please provide the most detailed information possible to help us resolve your issue quickly.
      </p>

      {/* กล่องข้อความ */}
      <textarea
        placeholder="Describe your issue here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full h-36 border border-gray-200 bg-[#f8f8f8] rounded-2xl p-4 text-gray-700 text-sm resize-none shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8cab93] transition-all duration-300"
      ></textarea>

      {/* ส่วนปุ่ม */}
      <div className="flex justify-between items-center mt-6">
        {/* ปุ่ม Upload */}
        <label
          htmlFor="file-upload"
          className="flex items-center gap-2 bg-[#f2f2f2] hover:bg-[#e6e6e6] text-gray-700 font-medium px-5 py-2 rounded-full shadow-sm cursor-pointer transition-all duration-200"
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

        {/* ปุ่ม Confirm */}
        <button
          onClick={handleSubmit}
          className="bg-[#8cab93] hover:bg-[#7da186] text-white font-medium px-8 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
        >
          Confirm
        </button>
      </div>

      {/* แสดงไฟล์ที่อัปโหลด */}
      {file && (
        <p className="mt-3 text-sm text-gray-600">
          📎 Attached: <span className="font-medium">{file.name}</span>
        </p>
      )}

      {/* แสดงข้อความหลังส่ง */}
      {submitted && (
        <p className="mt-4 text-[#8cab93] text-sm font-medium animate-fade-in">
          Report submitted successfully. Thank you!
        </p>
      )}

      {/* ข้อความท้ายหน้า */}
      <div className="mt-10 border-t border-gray-200 pt-4 text-xs text-gray-500 leading-relaxed">
        <p>
          Your account details and browser information may be included automatically to help us identify the issue.
        </p>
        <p className="mt-1">
          Need urgent help? Contact <span className="text-[#8cab93] font-medium">hubersityske@gmail.com</span>
        </p>
      </div>

      {/* เอฟเฟกต์แอนิเมชัน */}
      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.4s ease-in-out;
          }
        `}
      </style>
    </div>
  );
}