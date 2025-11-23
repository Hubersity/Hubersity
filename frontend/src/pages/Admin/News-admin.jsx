import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_URL = `${import.meta.env.VITE_API_URL}`;
// If image_url is not http, add base url.
const toAbs = (u) => (u?.startsWith("http") ? u : `${API_URL}${u || ""}`);


export default function NewsAdminPage() {
  const [newsList, setNewsList] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_URL}/news`);
        const data = await res.json();
        setNewsList(data);
      } catch (err) {
        console.error("Error loading news:", err);
      }
    };
  
    fetchNews();
  }, []);


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

      {/* News Grid */}
      <div className="grid grid-cols-3 gap-6">
        {newsList.map((n) => (
          <div
            key={n.id}
            className="
              relative group
              bg-white rounded-xl shadow hover:shadow-xl 
              transition overflow-hidden cursor-pointer
            "
          >
            {/* IMAGE */}
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src={toAbs(n.image_url)}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />

              {/* overlay */}
              <div
                className="
                  absolute inset-0 
                  bg-black/0 group-hover:bg-black/40
                  transition duration-300 z-10
                "
              />

              {/* SUMMARY */}
              <p
                className="
                  absolute bottom-3 left-4 right-4
                  text-white text-sm leading-tight
                  opacity-0 group-hover:opacity-100
                  transition duration-300
                  z-20
                "
              >
                {n.hover_text || n.summary}
              </p>

              {/* EDIT BUTTON */}
              <Link
                to={`/app_admin/news/edit/${n.id}`}
                className="
                  absolute left-1/2 top-1/2
                  -translate-x-1/2 -translate-y-1/2
                  opacity-0 group-hover:opacity-100
                  transition duration-300 z-30
                "
              >
                <button
                  className="
                    px-4 py-1.5 rounded-full
                    bg-[#ff6b6b] text-white 
                    text-sm font-medium shadow-md
                    hover:bg-[#ff5252] transition
                  "
                >
                  Edit
                </button>
              </Link>
            </div>

            {/* Title */}
            <div className="p-4">
              <p className="font-medium text-gray-800 text-sm">{n.title}</p>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
