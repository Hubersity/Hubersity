import React, { useState } from "react";
import { Pencil, Image as ImageIcon } from "lucide-react";

export default function NewsCreateAdmin() {
  const [image, setImage] = useState(null);
  const [hoverText, setHoverText] = useState("");
  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState("");
  const [detail, setDetail] = useState("");
  const [detailHeight, setDetailHeight] = useState(40);

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) setImage(URL.createObjectURL(file));
  }

  function handleDetailGrow(e) {
    setDetail(e.target.value);
    setDetailHeight(e.target.scrollHeight);
  }

  return (
    <div className="flex gap-16 w-full px-10 py-6">

      {/* LEFT - Image Section */}
      <div className="flex flex-col items-start w-[350px]">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">Create News</h1>

        <label className="relative cursor-pointer w-full">
          {image ? (
            <img
              src={image}
              className="w-full h-60 object-cover rounded-2xl border border-gray-200 shadow-sm"
            />
          ) : (
            <div className="w-full h-60 rounded-2xl border border-dashed border-emerald-200 bg-[#fdfaf6] flex flex-col items-center justify-center gap-3 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow">
                <ImageIcon size={26} className="text-emerald-600" />
              </div>
              <p className="text-base text-gray-700 font-medium">Upload cover image</p>
              <p className="text-sm text-gray-400">Click to choose file (JPG/PNG)</p>
            </div>
          )}

          {/* Pencil button */}
          <div className="absolute top-3 right-3 bg-black text-white p-2 rounded-full shadow border border-white hover:scale-105 transition">
            <Pencil size={16} />
          </div>

          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>

        {/* Text shown on hover */}
        <input
          value={hoverText}
          onChange={(e) => setHoverText(e.target.value)}
          placeholder="Text shown on hover"
          className="mt-4 w-full px-4 py-2 bg-[#fdfaf6] border border-gray-200 rounded-xl shadow-sm text-sm outline-none"
        />
      </div>

      {/* RIGHT — Form */}
      <div className="flex-1 bg-[#fdfaf6] p-10 rounded-3xl border border-[#f3e6da] shadow-sm">

        {/* Topic */}
        <div className="mb-8">
          <label className="block text-base font-medium text-gray-800 mb-1">Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter news title"
            className="w-full border-b border-gray-300 bg-transparent outline-none py-2 text-lg"
          />
        </div>

        {/* Summary */}
        <div className="mb-8">
          <label className="block text-base font-medium text-gray-800 mb-1">Summary</label>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short description shown on hover"
            className="w-full border-b border-gray-300 bg-transparent outline-none py-2 text-lg"
          />
        </div>

        {/* Detail — underline only, auto expand */}
        <div className="mb-6">
          <label className="block text-base font-medium text-gray-800 mb-1">Detail</label>
          <textarea
            value={detail}
            onChange={handleDetailGrow}
            placeholder="Full detail of the news"
            style={{ height: `${detailHeight}px` }}
            className="w-full border-b border-gray-300 bg-transparent outline-none resize-none py-2 text-lg"
          />
        </div>

        {/* Post Button */}
        <div className="flex justify-center mt-8">
        <button
            className="
            px-8 py-2 rounded-full
            bg-[#e0ebe2] text-emerald-900 font-medium
            shadow-sm transition transform
            hover:-translate-y-[2px] hover:shadow-md
            active:translate-y-0 active:shadow-sm
            "
        >
            Post
        </button>
        </div>
      </div>
    </div>
  );
}