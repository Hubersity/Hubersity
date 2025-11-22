import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const API_URL = "http://localhost:8000";
const toAbs = (u) => (u?.startsWith?.("http") ? u : `${API_URL}${u || ""}`);

export default function News() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_URL}/news`);
        if (!res.ok) throw new Error(`Load failed: ${res.status}`);
        const data = await res.json();
        setNewsList(data || []);
      } catch (err) {
        console.error(err);
        setErrMsg("Cannot load news.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) return <div className="p-6">{t('News.Loading')}</div>;
  if (errMsg) return <div className="p-6 text-red-500">{errMsg}</div>;

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">
        {t('News.NewsInformation')}
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
                src={n.image_url ? toAbs(n.image_url) : "/images/news_fallback.jpg"}
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
              <Link
                to={`/app/news/${n.id}`}
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
                {t('News.ReadMore')}
              </Link>

              {/* Summary (text fade in) */}
              <p
                className="
                  absolute bottom-3 left-4 right-4
                  text-white text-sm leading-tight
                  opacity-0 group-hover:opacity-100
                  transition-all duration-500
                "
              >
                {n.hover_text || n.summary}
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
