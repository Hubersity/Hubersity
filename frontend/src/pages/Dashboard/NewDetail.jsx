import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const API_URL = "http://localhost:8000";
const toAbs = (u) => (u?.startsWith?.("http") ? u : `${API_URL}${u || ""}`);

export default function NewDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");
    const [news, setNews] = useState(null);
    const { t } = useTranslation();
  
    useEffect(() => {
        const fetchNews = async () => {
        try {
            const res = await fetch(`${API_URL}/news/${id}`);
            if (!res.ok) throw new Error(`Load failed: ${res.status}`);
            const data = await res.json();
            setNews(data);
        } catch (err) {
            console.error(err);
            setErrMsg("Cannot load news.");
        } finally {
            setLoading(false);
        }
        };

        fetchNews();
    }, [id]);

    if (loading) return <div className="p-6">{t('NewsDetail.Loading')}</div>;
    if (errMsg) return <div className="p-6 text-red-500">{errMsg}</div>;
    if (!news) return <div className="p-6">{t('NewsDetail.NoNewsFound')}</div>;

    function renderWithLinks(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return (text || "").split(urlRegex).map((part, i) =>
        urlRegex.test(part) ? (
            <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 underline"
            >
            {part}
            </a>
        ) : (
            part
        )
        );
    }
  
    return (
        <div className="w-full bg-white min-h-screen rounded-xl shadow-lg overflow-y-auto">
            {/* back button */}
            <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-xl
                transition-transform duration-200
                hover:scale-110 hover:-translate-x-1"
                >
                ←
            </button>
            {/* main content */}
            <div className="max-w-5xl mx-auto px-4 flex flex-col">
                <div className="flex flex-col items-center">
                    <p className="text-2xl font-semibold text-center mb-6">{news.title}</p>
                    <img src={toAbs(news.image_url)}
                    className="w-full max-w-md rounded-xl mb-6"/>
                    <p className="whitespace-pre-line text-center text-lg max-w-2xl mb-4">
                        {news.summary}
                    </p>
                    <hr className="w-full max-w-5xl border-t border-gray-300 mb-4" />
                </div>
                <p className="whitespace-pre-line max-w-5xl">
                    {renderWithLinks(news.detail)}
                </p>
            </div>
        </div>
    );
};
