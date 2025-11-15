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
    <div
      className="
        flex gap-16 w-full px-12 py-10
        bg-gradient-to-br from-[#f7fdf9] to-[#faf6f2]
        animate-fadeIn
      "
    >
      {/* LEFT PANEL */}
      <div className="flex flex-col items-start w-[350px] animate-slideUpSlow">

        <h1 className="text-3xl font-semibold mb-6 text-gray-800 tracking-wide">
          Create News
        </h1>

        {/* Upload box with animation */}
        <label className="relative cursor-pointer w-full transition hover:scale-[1.02]">
          {image ? (
            <img
              src={image}
              className="w-full h-60 object-cover rounded-2xl border border-gray-200 shadow-md"
            />
          ) : (
            <div
              className="
                w-full h-60 rounded-2xl border-2 border-dashed
                border-emerald-300 bg-[#fdfaf6]
                flex flex-col items-center justify-center gap-3
                shadow-sm transition-all hover:bg-emerald-50/30 hover:border-emerald-400
              "
            >
              <div className="w-14 h-14 rounded-xl bg-white/80 backdrop-blur-md flex items-center justify-center shadow-md">
                <ImageIcon size={28} className="text-emerald-600" />
              </div>
              <p className="text-base text-gray-800 font-medium">
                Upload cover image
              </p>
              <p className="text-sm text-gray-400">
                Click to choose file (JPG/PNG)
              </p>
            </div>
          )}

          {/* Edit icon */}
          <div
            className="
              absolute top-3 right-3 bg-black text-white
              p-2 rounded-full shadow border border-white
              hover:bg-gray-800 hover:scale-110 transition
            "
          >
            <Pencil size={16} />
          </div>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>

        {/* Hover Text */}
        <input
          value={hoverText}
          onChange={(e) => setHoverText(e.target.value)}
          placeholder="Text shown on hover"
          className="
            mt-4 w-full px-4 py-2 bg-[#fdfaf6]
            border border-gray-200 rounded-xl shadow-sm
            text-sm outline-none transition
            focus:ring-2 focus:ring-emerald-300
          "
        />
      </div>

      {/* RIGHT PANEL */}
      <div
        className="
          flex-1 bg-[#fefaf7] p-10 rounded-3xl border border-[#f3e6da]
          shadow-[0_8px_20px_rgba(0,0,0,0.06)]
          animate-slideUpSlow
        "
      >
        {/* TOPIC */}
        <div className="mb-8">
          <label className="block text-base font-semibold text-gray-800 mb-1">
            Topic
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter news title"
            className="
              w-full border-b border-gray-300 bg-transparent 
              outline-none py-2 text-lg
              transition focus:border-emerald-400
            "
          />
        </div>

        {/* SUMMARY */}
        <div className="mb-8">
          <label className="block text-base font-semibold text-gray-800 mb-1">
            Summary
          </label>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short description shown on hover"
            className="
              w-full border-b border-gray-300 bg-transparent 
              outline-none py-2 text-lg
              transition focus:border-emerald-400
            "
          />
        </div>

        {/* DETAIL */}
        <div className="mb-6">
          <label className="block text-base font-semibold text-gray-800 mb-1">
            Detail
          </label>
          <textarea
            value={detail}
            onChange={handleDetailGrow}
            placeholder="Full detail of the news"
            style={{ height: `${detailHeight}px` }}
            className="
              w-full border-b border-gray-300 bg-transparent 
              outline-none resize-none py-2 text-lg
              transition focus:border-emerald-400
            "
          />
        </div>

        {/* POST BUTTON WITH ANIMATION */}
        <div className="flex justify-center mt-10">
          <button
            className="
              px-10 py-2.5 rounded-full
              bg-gradient-to-r from-[#d9f2dd] to-[#e0ebe2]
              text-emerald-900 font-medium
              shadow-md transition
              hover:shadow-xl hover:-translate-y-[3px]
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

