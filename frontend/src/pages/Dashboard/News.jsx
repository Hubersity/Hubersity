import React, { useState } from "react";

export default function News() {
  const [newsList] = useState([
    {
      id: 1,
      image: "/images/New1.jpg",
      title: "Google Releases Gemini for KU Students",
      summary: "Google announces free Gemini access for KU students.",
    },
    {
      id: 2,
      image: "/images/New2.jpg",
      title: "New Engineering Upskill Project",
      summary: "Apply to join the new engineering upskill project.",
    },
    {
      id: 3,
      image: "/images/New3.jpg",
      title: "AI Tools for Academic Assistants",
      summary: "Explore new tools for students and researchers.",
    },
    {
      id: 4,
      image: "/images/New4.jpg",
      title: "Adobe Creative Cloud Update",
      summary: "Adobe services updated exclusively for KU students.",
    },
    {
      id: 5,
      image: "/images/New5.jpg",
      title: "Research Square & KULC Studio Program",
      summary: "Join training for research & academic writing.",
    },
  ]);

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">
        News Information
      </h1>

      <div className="grid grid-cols-3 gap-6">
        {newsList.map((n) => (
          <div
            key={n.id}
            className="
              group relative 
              bg-white rounded-2xl shadow-md 
              hover:shadow-xl transition-all duration-500 
              overflow-hidden cursor-pointer
            "
          >
            {/* IMAGE */}
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src={n.image}
                alt=""
                className="
                  h-full w-full object-cover 
                  transition duration-500
                  group-hover:scale-110
                "
              />

              {/* GRADIENT OVERLAY */}
              <div
                className="
                  absolute inset-0  
                  bg-gradient-to-t from-black/60 via-black/20 to-transparent
                  opacity-0 group-hover:opacity-100
                  transition duration-500
                "
              />

              {/* READ MORE BUTTON */}
              <button
                className="
                  absolute left-1/2 top-1/2 
                  -translate-x-1/2 -translate-y-1/2
                  opacity-0 group-hover:opacity-100
                  transition duration-500
                  px-5 py-2 rounded-full
                  text-emerald-900 font-medium text-sm
                  shadow-md border border-emerald-200
                  bg-[#e0ebe2]
                  hover:shadow-lg hover:-translate-y-1
                "
              >
                Read more
              </button>

              {/* Summary (text fade in) */}
              <p
                className="
                  absolute bottom-3 left-4 right-4
                  text-white text-sm leading-tight
                  opacity-0 group-hover:opacity-100
                  transition-all duration-500
                "
              >
                {n.summary}
              </p>
            </div>

            {/* TITLE */}
            <div className="p-4">
              <p
                className="
                  font-semibold text-gray-800 text-[15px]
                  group-hover:text-emerald-700 transition duration-300
                "
              >
                {n.title}
              </p>
            </div>

            {/* Floating soft-border */}
            <div
              className="
                absolute inset-0 rounded-2xl border-2 
                border-transparent group-hover:border-[#e0ebe2]
                opacity-0 group-hover:opacity-100
                transition-all duration-500 pointer-events-none
              "
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
}