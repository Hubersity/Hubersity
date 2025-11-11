import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Paperclip,
  Image,
  Video,
  Heart,
  MessageCircle,
  Send,
  Search,
  X,
  MoreVertical,
  Edit,
  Trash,
  Flag,
} from "lucide-react";

const API_URL = "http://localhost:8000";

// ============ Edit Modal ============
function EditPostModal({ open, onClose, text, setText, onSubmit }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-100 overflow-hidden animate-fadeIn">
        <div className="px-5 py-4 border-b bg-gradient-to-r from-green-50 to-amber-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Edit Post</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Delete Modal ============
function DeleteConfirmModal({ open, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 border border-gray-100 overflow-hidden animate-fadeIn">
        <div className="px-5 py-4 border-b bg-gradient-to-r from-rose-50 to-amber-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Delete Post</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 text-center">
          <p className="text-gray-700 mb-5">
            Are you sure you want to delete this post? <br />
            <span className="text-gray-500 text-sm">
              This action cannot be undone.
            </span>
          </p>
        </div>

        <div className="px-5 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Report Modal ============

function ReportModal({ open, onClose, postId, onSubmit }) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [details, setDetails] = useState("");
  const mountedRef = useRef(false); // ใช้กัน render ซ้ำ

  // ตรวจจับ mount / unmount
  useEffect(() => {
    if (open && !mountedRef.current) {
      mountedRef.current = true;
      console.log("ReportModal mounted for post:", postId);
    }
    if (!open) {
      mountedRef.current = false;
      console.log("ReportModal closed for post:", postId);
    }
  }, [open, postId]);

  // ปิดด้วยปุ่ม Esc
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // Reset เมื่อ modal ปิด
  useEffect(() => {
    if (!open) {
      setReason("");
      setCustomReason("");
      setDetails("");
    }
  }, [open]);

  // ป้องกัน render ซ้ำตอน dev mode
  if (!open || !postId || (mountedRef.current && !open)) return null;

  const reasons = [
    {
      key: "Harassment",
      label:
        "Harassment (Bullying, discrimination, or targeting a religion, gender, or group.)",
    },
    {
      key: "Sexual Content",
      label:
        "Sexual Content (Sexual, pornographic, or inappropriate material.)",
    },
    {
      key: "Illegal Activity",
      label: "Illegal Activity (Promoting illegal actions or services.)",
    },
    {
      key: "Spam",
      label: "Spam (Reposting the same content multiple times.)",
    },
    {
      key: "Privacy Violation",
      label:
        "Privacy Violation (Sharing personal information or photos of others without consent.)",
    },
    { key: "Other", label: "Other (Please specify)" },
  ];

  const handleSubmit = () => {
    const finalReason =
      reason === "Other" ? customReason.trim() || "Other" : reason;
    onSubmit({
      postId,
      reason: finalReason,
      details: details.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative w-full max-w-xl mx-4 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50 to-amber-50 border-b">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-emerald-700" />
            <h3 className="text-lg font-semibold text-gray-800">
              {postId?.toString().startsWith("comment-") ? "Report Comment" : "Report Post"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* scrollable body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Please select a reason for reporting this post (Post ID:{" "}
              <span className="font-medium text-gray-800">#{postId}</span>).
            </p>

            <div className="grid grid-cols-1 gap-2">
              {reasons.map((r) => (
                <label
                  key={r.key}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition
                    ${
                      reason === r.key
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    className="mt-1"
                    checked={reason === r.key}
                    onChange={() => setReason(r.key)}
                  />
                  <span className="text-sm text-gray-800">{r.label}</span>
                </label>
              ))}
            </div>

            {reason === "Other" && (
              <input
                type="text"
                placeholder="Please specify your reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="mt-3 w-full border rounded-lg px-3 py-2 text-sm"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Additional details{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="Describe what happened or any context that helps us review this report."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-y"
            />
          </div>
        </div>

        {/* footer */}
        <div className="px-5 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || (reason === "Other" && !customReason.trim())}
            className={`px-4 py-2 rounded-lg text-white text-sm transition
                ${
                  !reason || (reason === "Other" && !customReason.trim())
                    ? "bg-emerald-300 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}


export default function TagDetail() {
  const { tagName } = useParams();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [trending, setTrending] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editPostId, setEditPostId] = useState(null);
  const [editText, setEditText] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const menuRef = useRef(null);

  const currentKey = localStorage.getItem("currentUserKey");
  const authData = currentKey
    ? JSON.parse(localStorage.getItem(currentKey) || "{}")
    : {};
  const currentUser = {
    username: authData?.username || "You",
    name: authData?.name || authData?.username || "You",
    uid: authData?.uid || null,
  };

  useEffect(() => setSearch(`#${tagName}`), [tagName]);

  // โหลดโพสต์และแท็ก
  useEffect(() => {
    const token = authData?.token;
    if (!token) return;

    const fetchPosts = async () => {
    try {
        const res = await fetch(`${API_URL}/posts/all`, {
        headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // นับแท็กจากโพสต์ทั้งหมด
        const tagCount = {};
        data.forEach((p) => {
        const tags = p.post_content?.match(/#[A-Za-z0-9_ก-๙]+/g) || [];
        tags.forEach((t) => {
            const clean = t.replace("#", "");
            tagCount[clean] = (tagCount[clean] || 0) + 1;
        });
        });

        const formattedTags = Object.entries(tagCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

        setAllTags(formattedTags);
        setTrending(formattedTags.slice(0, 20));

        // เพิ่มตรงนี้เลย
        setSuggestions(
        formattedTags
            .filter((t) => t.name.toLowerCase().includes(tagName.toLowerCase()))
            .slice(0, 6)
        );

        // โหลดโพสต์ของแท็กนั้น
        const regex = new RegExp(`(^|\\s)#${tagName}(\\s|$)`, "i");
        const filtered = data.filter((p) => regex.test(p.post_content));
        const mapped = filtered.map((p) => ({
        id: p.pid,
        user_id: p.user_id,
        username: p.username,
        displayName: p.name || p.username,
        text: p.post_content,
        likes: p.like_count || 0,
        liked: p.liked || false,
        comments: p.comments || [],
        created_at: p.created_at,
        profile_image: p.profile_image,
        images: Array.isArray(p.images) ? p.images : [],
        }));
        setPosts(mapped);
    } catch (err) {
        console.error("Error fetching posts:", err);
    }
    };

  const fetchTrending = async () => {
    try {
      const res = await fetch(`${API_URL}/tags/trending?limit=10`);
      const data = await res.json();

      // รองรับทั้งกรณี backend ส่ง array ตรงๆ หรือส่งแบบมี key
      const tags = Array.isArray(data)
        ? data
        : data.trending_tags || data.tags || [];

      // ถ้าไม่มีค่าเลย ให้ fallback
      if (tags.length === 0) {
        setTrending([
          { name: "foodaroundTU", count: 30 },
          { name: "KU85", count: 20 },
          { name: "Isp", count: 18 },
        ]);
      } else {
        setTrending(tags);
      }
    } catch (err) {
      console.error("Error fetching trending:", err);
      setTrending([
        { name: "foodaroundTU", count: 30 },
        { name: "KU85", count: 20 },
        { name: "Isp", count: 18 },
      ]);
    }
  };

      fetchPosts();
      fetchTrending();
    }, [tagName]);

  // แนะนำแท็ก
  useEffect(() => {
    const input = search.replace("#", "").trim().toLowerCase();
    if (!input) return setSuggestions([]);
    const filtered = allTags
      .filter((t) => t.name.toLowerCase().includes(input))
      .slice(0, 6);
    setSuggestions(filtered);
  }, [search, allTags]);

  const handleSelectTag = (tag) => {
    setIsTyping(false); 
    setSearch(`#${tag}`);
    setSuggestions([]);
    navigate(`/app/tags/${encodeURIComponent(tag)}`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFiles((prev) => [...prev, file]);
  };

  const handleLike = (id) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const formatTimeAgo = (createdAt) => {
    if (!createdAt) return "just now";
    const diffMs = Date.now() - new Date(createdAt);
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    return hrs < 24 ? `${hrs} hr ago` : new Date(createdAt).toLocaleDateString();
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    const token = authData?.token;
    const uid = authData?.uid;
    if (!token) return alert("Please log in before posting.");

    const formData = new FormData();
    formData.append("post_content", `${newPost} #${tagName}`);
    formData.append("forum_id", 1);
    formData.append("user_id", uid);
    pendingFiles.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch(`${API_URL}/posts/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const created = await res.json();
      setPosts((prev) => [
        {
          id: created.pid || Date.now(),
          username: authData.username || "You",
          displayName: authData.name || authData.username || "You",
          text: created.post_content || `${newPost} #${tagName}`,
          likes: 0,
          liked: false,
          comments: [],
          created_at: new Date().toISOString(),
          profile_image: created.profile_image,
          images: created.images || [],
        },
        ...prev,
      ]);
      setNewPost("");
      setPendingFiles([]);
    } catch (err) {
      console.error("Error posting:", err);
    }
  };

  // ===== Edit =====
  const openEditModal = (post) => {
    setEditPostId(post.id);
    setEditText(post.text);
    setEditOpen(true);
    setMenuOpen(null);
  };

  const handleEditSubmit = async () => {
    if (!editText.trim()) return;
    const token = authData?.token;
    if (!token) return alert("Please log in again.");

    try {
      const res = await fetch(`${API_URL}/posts/${editPostId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ post_content: editText }),
      });
      if (!res.ok) throw new Error("Failed to edit");

      setPosts((prev) =>
        prev.map((p) => (p.id === editPostId ? { ...p, text: editText } : p))
      );
      setEditOpen(false);
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  // ===== Delete =====
  const handleDeletePost = (id) => {
    setDeletePostId(id);
    setDeleteOpen(true);
    setMenuOpen(null);
  };

  const confirmDelete = async () => {
    const token = authData?.token;
    if (!token) return;

    try {
      await fetch(`${API_URL}/posts/${deletePostId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.filter((p) => p.id !== deletePostId));
      setDeleteOpen(false);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // ===== Report =====
  const openReport = (id) => {
    setReportPostId(id);
    setReportOpen(true);
    setMenuOpen(null);
  };

  const submitReport = async ({ postId, reason, details }) => {
    const token = authData?.token;
    if (!token) return;

    const form = new FormData();
    form.append("reason", reason);
    form.append("details", details || "");

    try {
      const res = await fetch(`${API_URL}/posts/${postId}/report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error("Failed report");
      alert("Report submitted!");
      setReportOpen(false);
    } catch (err) {
      console.error("Report failed:", err);
    }
  };

  return (
    <div className="flex w-full bg-[#f7f7f5] min-h-screen p-6">
      {/* ซ้าย */}
      <div className="flex-1 pr-6 border-r border-gray-300">
        {/* Search */}
        <div className="relative mb-5">
          <div className="flex items-center bg-white border rounded-full px-4 py-2 shadow-sm">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search tags..."
              value={search}
              onFocus={() => setIsTyping(true)}          // เริ่มพิมพ์
              onChange={(e) => {
                  setIsTyping(true);
                  setSearch(e.target.value);
              }}
              className="ml-2 flex-1 outline-none text-gray-700"
            />
            {search && (
              <X
                className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600"
                onClick={() => setSearch("")}
              />
            )}
          </div>

          {isTyping && suggestions.length > 0 && (
            <div className="absolute w-full bg-white border rounded-lg shadow-lg mt-1 z-50">
              {suggestions.map((t, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectTag(t.name)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  #{t.name}{" "}
                  <span className="text-gray-400 text-sm">
                    ({t.count} posts)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* กล่องโพสต์ */}
        <div className="flex flex-col gap-3 mb-6 p-4 rounded-xl bg-[#fdfaf6] shadow-sm">
          <input
            type="text"
            placeholder={`Post with #${tagName}...`}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => fileInputRef.current.click()}
                className="text-gray-500 hover:text-green-700"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input ref={fileInputRef} type="file" hidden onChange={handleFileUpload} />
              <button
                onClick={() => imageInputRef.current.click()}
                className="text-gray-500 hover:text-green-700"
              >
                <Image className="w-5 h-5" />
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleFileUpload} />
              <button
                onClick={() => videoInputRef.current.click()}
                className="text-gray-500 hover:text-green-700"
              >
                <Video className="w-5 h-5" />
              </button>
              <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleFileUpload} />
            </div>
            <button
              onClick={handlePost}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition"
            >
              <Send className="w-4 h-4" /> Post
            </button>
          </div>
        </div>

        {/* โพสต์ */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              No posts for this tag yet 🌱
            </p>
          ) : (
            posts.map((p) => (
              <div key={`${p.id}-${p.username}`} className="flex gap-3 items-start">
                {/* Profile */}
                <div className="flex flex-col items-center justify-start w-20">
                  <Link
                    to={
                      !p?.user_id
                        ? "/app/account"
                        : currentUser?.uid === p.user_id
                        ? "/app/account"
                        : `/app/user/${p.user_id}`
                    }
                    className="text-xs font-medium mb-2 text-black hover:text-emerald-600 hover:underline"
                  >
                    {p.displayName}
                  </Link>

                  <Link
                    to={
                      !p?.user_id
                        ? "/app/account"
                        : currentUser?.uid === p.user_id
                        ? "/app/account"
                        : `/app/user/${p.user_id}`
                    }
                    className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 hover:opacity-80 transition"
                  >
                    <img
                    src={
                        p.profile_image
                        ? p.profile_image.startsWith("http") // กรณี full URL
                            ? p.profile_image
                            : p.profile_image.includes("/uploads/")
                            ? `${API_URL}${p.profile_image}` // ถ้ามี /uploads/ แล้ว
                            : `${API_URL}/uploads/user/${p.profile_image}` // ถ้าเป็นชื่อไฟล์อย่างเดียว
                        : "/images/default.jpg" // default
                    }
                    alt={p.username}
                    className="w-full h-full object-cover"
                    />
                  </Link>
                </div>

                {/* Card */}
                <div className="flex-1 rounded-lg shadow p-4 bg-[#fdfaf6] relative">
                {/* ⋮ Menu */}
                <div className="absolute top-2 right-2" ref={menuRef}>
                    <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === p.id ? null : p.id);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                    >
                    <MoreVertical className="w-5 h-5" />
                    </button>

                    {menuOpen === p.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-md border border-gray-200 z-10 overflow-hidden">
                        {p.username === currentUser.username ? (
                        <>
                            <button
                            onClick={() => openEditModal(p)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                            >
                            <Edit className="w-4 h-4" /> Edit
                            </button>

                            <button
                            onClick={() => handleDeletePost(p.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                            <Trash className="w-4 h-4" /> Delete
                            </button>
                        </>
                        ) : (
                        <button
                            onClick={() => openReport(p.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
                        >
                            <Flag className="w-4 h-4" /> Report
                        </button>
                        )}
                    </div>
                    )}
                </div>

                {/* เนื้อหาโพสต์ */}
                <p className="text-slate-800 flex flex-wrap gap-1">
                    {p.text.split(/(\s+)/).map((word, i) =>
                    word.startsWith("#") ? (
                        <span
                        key={i}
                        onClick={() => navigate(`/app/tags/${word.slice(1)}`)}
                        className="text-green-700 hover:text-green-800 font-medium cursor-pointer"
                        >
                        {word}
                        </span>
                    ) : (
                        <span key={i}>{word}</span>
                    )
                    )}
                </p>

                {/* รูป / วิดีโอ / PDF */}
                {p.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                    {p.images.map((img, i) => {
                        const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(img.path);
                        const isVid = /\.(mp4|mov|webm|ogg)$/i.test(img.path);
                        const isPdf = /\.pdf$/i.test(img.path);

                        return (
                        <div key={i}>
                            {isImg && (
                            <img
                                src={`${API_URL}${img.path}`}
                                alt=""
                                className="w-44 h-44 object-cover rounded-lg border hover:opacity-80"
                                onClick={() => setPreviewImage(`${API_URL}${img.path}`)}
                            />
                            )}
                            {isVid && (
                            <video
                                src={`${API_URL}${img.path}`}
                                controls
                                className="w-64 h-40 rounded-lg border bg-black"
                            />
                            )}
                            {isPdf && (
                            <a
                                href={`${API_URL}${img.path}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline text-sm"
                            >
                                📄 {img.path.split("/").pop()}
                            </a>
                            )}
                        </div>
                        );
                    })}
                    </div>
                )}

                {/* ปุ่ม Like / Comment */}
                <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                    <div className="flex items-center gap-4">
                    <button
                        onClick={() => handleLike(p.id)}
                        className={`flex items-center gap-1 ${
                        p.liked ? "text-red-600" : "hover:text-red-600"
                        }`}
                    >
                        <Heart className="w-4 h-4" fill={p.liked ? "red" : "none"} /> {p.likes}
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-600">
                        <MessageCircle className="w-4 h-4" /> {p.comments.length}
                    </button>
                    </div>
                    <div className="text-slate-400 text-xs">{formatTimeAgo(p.created_at)}</div>
                </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ขวา */}
      <div className="w-72 pl-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Trending</h3>
        <ol className="list-decimal pl-5 space-y-1 text-gray-700">
          {trending.map((tag, i) => (
            <li
              key={i}
              className="cursor-pointer hover:text-green-700"
              onClick={() => handleSelectTag(tag.name)}
            >
              #{tag.name}{" "}
              <span className="text-gray-400 text-sm">
                ({tag.count} posts)
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="preview"
            className="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl"
          />
        </div>
      )}
      {/* Modals */}
      <EditPostModal
      open={editOpen}
      onClose={() => setEditOpen(false)}
      text={editText}
      setText={setEditText}
      onSubmit={handleEditSubmit}
      />

      <DeleteConfirmModal
      open={deleteOpen}
      onClose={() => setDeleteOpen(false)}
      onConfirm={confirmDelete}
      />

      {reportOpen && (
      <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          postId={reportPostId}
          onSubmit={submitReport}
      />
      )}
    </div>
  );
}