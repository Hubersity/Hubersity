import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function NewsAdminPage() {
  const [newsList, setNewsList] = useState([
    { id: 1, image: "/images/New1.jpg", title: "Google Releases Gemini for KU Students" },
    { id: 2, image: "/images/New2.jpg", title: "New Engineering Upskill Project" },
    { id: 3, image: "/images/New3.jpg", title: "AI Tools for Academic Assistants" },
    { id: 4, image: "/images/New4.jpg", title: "Adobe Creative Cloud Update" },
    { id: 5, image: "/images/New5.jpg", title: "Research Square & KULC Studio Program" },
  ]);

  return (
    <div className="w-full">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">News</h1>

        <Link to="/app_admin/news/create">
          <button
            className="
              px-8 py-2 rounded-full
              bg-[#e0ebe2] text-emerald-900 font-medium
              shadow-sm transition transform
              hover:-translate-y-[2px] hover:shadow-md
              active:translate-y-0 active:shadow-sm
            "
          >
            Create News
          </button>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-6">
        {newsList.map((n) => (
          <div
            key={n.id}
            className="relative group bg-white shadow rounded-xl border hover:shadow-md transition overflow-hidden"
          >
            <img src={n.image} className="w-full h-40 object-cover" />

            {/* Hover summary */}
            <div className="
              absolute inset-0 bg-black/60 text-white
              opacity-0 group-hover:opacity-100
              flex items-center justify-center
              text-center p-3 transition
            ">
              {n.title}
            </div>

            <div className="p-4">
              <p className="font-medium text-gray-700">{n.title}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}