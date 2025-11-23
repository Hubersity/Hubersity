import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, Image as ImageIcon } from "lucide-react";

const API_URL = `${import.meta.env.VITE_API_URL}`;
const toAbs = (u) => (u?.startsWith?.("http") ? u : `${API_URL}${u || ""}`);

export default function New_Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [detail, setDetail] = useState("");
  const [imageUrl, setImageUrl] = useState("");   // Use this instead of image
  const [hoverText, setHoverText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const currentKey = localStorage.getItem("currentUserKey");
  const authData = currentKey
    ? JSON.parse(localStorage.getItem(currentKey) || "{}")
    : {};
  const token = authData.token || null;


  // Load news from backend
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_URL}/news/${id}`);
        if (!res.ok) throw new Error(`Load failed: ${res.status}`);
        const data = await res.json();

        setTitle(data.title || "");
        setSummary(data.summary || "");
        setDetail(data.detail || "");
        setHoverText(data.hover_text || "");
        setImageUrl(data.image_url || "/images/New1.jpg");
      } catch (err) {
        console.error(err);
        setErrMsg("Cannot load news detail.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [id]);


  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
  
    const form = new FormData();
    form.append("file", file);
  
    try {
      const res = await fetch(`${API_URL}/news/${id}/upload-image`, {
        method: "POST",
        body: form,
      });
  
      if (!res.ok) {
        console.error("Upload image failed", res.status);
        alert("Upload image failed");
        return;
      }
  
      const data = await res.json();
      setImageUrl(data.image_url); // It is now /uploads/news/{id}/xxx.jpg
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload image error");
    }
  }


  const handleDelete = async () => {
    if (!token) {
      alert("No admin token found.");
      return;
    }
    if (!window.confirm("Delete this news?")) return;

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/news/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("Delete failed", res.status);
        alert("Delete failed.");
        return;
      }

      alert("News deleted.");
      navigate("/app_admin/news");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete error.");
    } finally {
      setSaving(false);
    }
  };


  const handleUpdate = async () => {
    if (!token) {
      alert("No admin token found.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/news/admin/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          summary,
          detail,
          hover_text: hoverText,
          image_url: imageUrl,   // Send the current image value to the backend.
        }),
      });

      if (!res.ok) {
        console.error("Update failed", res.status);
        alert("Update failed.");
        return;
      }

      alert("Updated!");
    } catch (err) {
      console.error("Update error:", err);
      alert("Update error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (errMsg)
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-xl mr-4"
        >
          ←
        </button>
        <span className="text-red-500">{errMsg}</span>
      </div>
    );


  return (
    <div className="w-full bg-white min-h-screen rounded-xl shadow-lg overflow-y-auto">
      {/* back button */}
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 text-xl transition-transform duration-200 hover:scale-110 hover:-translate-x-1"
      >
        ←
      </button>

      {/* main content */}
      <div className="max-w-5xl mx-auto px-4 flex flex-col items-center">
        <input
          className="text-2xl font-semibold text-center mb-6 w-full border p-2 rounded-lg"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Topic"
        />

        {/* IMAGE UPLOAD */}
        <div className="w-[50vh] h-[30vh] mb-6">
            {/* dashed green outer frame */}
            <div className="rounded-3xl border-2 border-dashed p-3">
                {/* inner card */}
                <label className="relative block w-full h-60 rounded-2xl shadow-sm cursor-pointer overflow-hidden">
                {imageUrl ? (
                    <img
                    src={imageUrl ? toAbs(imageUrl) : "/images/New1.jpg"}
                    alt="Cover"
                    className="w-full h-full object-cover"
                    />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
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

                {/* edit icon top-right */}
                <div
                    className="
                    absolute top-[0vh] right-3 bg-black text-white
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
            </div>
        </div>

        <textarea
          className="whitespace-pre-line text-center text-lg max-w-2xl mb-4 w-full border p-2 rounded-lg"
          value={hoverText}
          onChange={(e) => setHoverText(e.target.value)}
          rows={2}
          placeholder="Text show on hover"
        />

        <textarea
          className="whitespace-pre-line text-center text-lg max-w-2xl mb-4 w-full border p-2 rounded-lg"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          placeholder="Summary"
        />

        <hr className="w-full max-w-5xl border-t border-gray-300 mb-4" />

        <textarea
          className="whitespace-pre-line max-w-5xl w-full border p-2 rounded-lg"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={10}
          placeholder="Detail"
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-row justify-end items-center mt-12 mr-6 mb-12">
        <motion.button
          type="button"
          onClick={handleDelete}
          className="px-16 py-4 mr-4 rounded-full bg-[#ff6b6b] text-white text-lg font-medium shadow-md hover:bg-[#ff5252] transition"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {saving ? "Saving..." : "Delete"}
        </motion.button>

        <motion.button
          type="button"
          onClick={handleUpdate}
          className="px-16 py-4 rounded-full bg-[#b7ddbf] text-white text-lg font-medium shadow-md hover:bg-[#8cab93] transition"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {saving ? "Saving..." : "Update"}
        </motion.button>
      </div>
    </div>
  );
}
