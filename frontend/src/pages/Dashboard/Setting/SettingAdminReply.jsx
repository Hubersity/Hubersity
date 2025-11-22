import React, { useEffect, useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

const API_URL = "http://localhost:8000";


function timeAgo(iso, t) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return t("time.justNow");
  if (diff < 3600) return t("time.minutesAgo", { count: Math.floor(diff / 60) });
  if (diff < 86400) return t("time.hoursAgo", { count: Math.floor(diff / 3600) });
  if (diff < 172800) return t("time.yesterday");
  return d.toLocaleString();
}


export default function SettingAdminReply() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();  // use i18next
  //  LOAD USER
  const currentKey = localStorage.getItem("currentUserKey");

  const authData = useMemo(() => {
    try {
      return currentKey ? JSON.parse(localStorage.getItem(currentKey)) : null;
    } catch (e) {
      console.error("❌ parse error:", e);
      return null;
    }
  }, [currentKey]);

  const rawUser = authData?.user || authData;
  const uid =
    rawUser?.uid ||
    rawUser?.id ||
    rawUser?.user_id ||
    rawUser?.userId ||
    null;

  const token = authData?.token;

  // FETCH NOTIFICATION
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const fetchNotifs = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_URL}/notification/system/${uid}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          console.error("❌ Error:", await res.text());
          setItems([]);
          return;
        }

        const data = await res.json();
        const sorted = data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

      const filtered = sorted.filter(n => n.title === "HelpReportReply");
      setItems(filtered);
      setSelected(filtered[0] || null);
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifs();
  }, [uid, token]);


  //  UI
  return (
    <div className="w-full flex gap-6 items-stretch">

    {/* LEFT LIST */}
    <aside className="w-1/3 bg-[#fdfaf6] border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[86.5vh]">
        <div className="px-5 py-4 border-b bg-white flex items-center gap-2">
        <Mail className="text-emerald-600" />
        <p className="font-semibold text-gray-800">{t('settingAdminReply.fromApp')}</p>
        </div>

        <div className="overflow-y-auto flex-1">
        {loading && <div className="p-4 text-sm text-gray-500">{t('settingAdminReply.loading')}</div>}
        {!loading && items.length === 0 && (
            <div className="p-4 text-sm text-gray-500">{t('settingAdminReply.noMessage')}</div>
        )}

        {!loading &&
            items.map((n) => (
            <button
                key={n.id}
                onClick={() => setSelected(n)}
                className={`w-full text-left px-4 py-4 border-b flex items-start gap-3 transition ${
                selected?.id === n.id ? "bg-[#e0ebe2]/40" : "hover:bg-gray-100"
                }`}
            >
                <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-800 truncate">
                    {n.title || t('settingAdminReply.noTitle')}
                </p>
                <p className="text-sm text-gray-600 line-clamp-1">
                    {n.message || ""}
                </p>
                </div>

                <span className="ml-auto text-[11px] text-gray-500 whitespace-nowrap pt-1">
                {timeAgo(n.created_at, t)}
                </span>
            </button>
            ))}
        </div>
    </aside>

    {/* RIGHT DETAIL */}
    <section className="w-2/3 bg-[#fdfaf6] border rounded-2xl shadow-sm p-8 flex flex-col h-[86.5vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
        <Mail className="text-emerald-600" /> {t('settingAdminReply.adminReply')}
        </h2>

        {selected ? (
        <div className="bg-white border rounded-xl p-6 shadow-sm w-full max-w-[85%]">
            <p className="text-xl font-semibold text-gray-900">{selected.title}</p>
            <p className="text-sm text-gray-500 mb-4">{timeAgo(selected.created_at, t)}</p>
            <p className="text-gray-700 leading-relaxed">{selected.message}</p>
        </div>
        ) : (
        <div className="text-sm text-gray-500">{t('settingAdminReply.selectMessage')}</div>
        )}
    </section>
    </div>
  );
}
