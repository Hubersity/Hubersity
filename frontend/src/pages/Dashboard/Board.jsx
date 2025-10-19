import { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  Image,
  Video,
  Search,
  X,
  Heart,
  MessageCircle,
  MoreVertical,
  Trash,
  Flag,
} from "lucide-react";

const API_URL = "http://localhost:8000";

const userProfiles = {
  aong: "/images/Watcharapat.jpg",
  Skibidi: "/images/Patthiaon.jpg",
  Pysart: "/images/Khittitaj.jpg",
  Dog: "/images/Karnpon.jpg",
  Rose: "/images/Karnpon.jpg",
  You: "/images/Karnpon.jpg",
};

// 🧪 mock posts (ตามเวอร์ชันก่อนหน้า)
const initialPosts = [
  { id: 1, user: "aong", text: "Has anyone ever taken the ISP course?", minutes: 10, likes: 48, liked: false, comments: [], category: "university" },
  { id: 2, user: "Skibidi", text: "Looking for a single woman.", minutes: 2, likes: 9, liked: false, comments: [], category: "university" },
  { id: 3, user: "Pysart", text: "Share the summary file for English 2, course code 01355102-64", minutes: 32, likes: 102, liked: false, comments: [], category: "university" },
];

// ============ Report Modal ============
function ReportModal({ open, onClose, postId, onSubmit }) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (open) {
      const onEsc = (e) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", onEsc);
      return () => window.removeEventListener("keydown", onEsc);
    }
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setReason("");
      setCustomReason("");
      setDetails("");
    }
  }, [open]);

  if (!open) return null;

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
      <div className="relative w-full max-w-xl mx-4 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50 to-amber-50 border-b">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-emerald-700" />
            <h3 className="text-lg font-semibold text-gray-800">Report Post</h3>
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

// ============ Main Board ============

export default function Board() {
  const [posts, setPosts] = useState(initialPosts);
  const [newPost, setNewPost] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("university");
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [pendingFiles, setPendingFiles] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [selectedUni, setSelectedUni] = useState(null);
  const [currentUser] = useState({ name: "You" });

  // 🆕 state สำหรับหน้าต่าง Report
  const [reportOpen, setReportOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const menuRef = useRef(null);

  // โหลดโพสต์จริง
  useEffect(() => {
    const fetchPosts = async () => {
      const token = JSON.parse(localStorage.getItem("authData"))?.token;
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/posts/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch posts");
        const data = await res.json();

        const loaded = data.map((p) => ({
          id: p.pid,
          user: p.username,
          text: p.post_content,
          minutes: Math.floor((Date.now() - new Date(p.created_at)) / 60000),
          liked: p.liked,
          likes: p.like_count,
          profile_image: p.profile_image,
          comments:
            p.comments?.map((c) => ({
              username: c.username,
              content: c.content,
              profile_image: c.profile_image,
              minutes: Math.floor((Date.now() - new Date(c.created_at)) / 60000),
            })) || [],
          images: p.images || [],
          category: "university",
        }));

        setPosts([...loaded, ...initialPosts]);
      } catch (err) {
        console.error("Error loading posts:", err);
      }
    };
    fetchPosts();
  }, []);

  // โพสต์ใหม่
const handlePost = async () => {
  if (newPost.trim() === "") return;

  try {
    const authData = JSON.parse(localStorage.getItem("authData"));
    const token = authData?.token;
    const uid = authData?.uid;

    if (!token) {
      alert("Please log in again before posting.");
      return;
    }

    // ✅ สร้าง FormData ตาม schema จาก FastAPI
    const formData = new FormData();
    formData.append("post_content", newPost);
    formData.append("forum_id", 1); // 🟢 ค่า forum_id กำหนด fix ไว้ได้ (หรือดึงจาก state ถ้ามี)
    // formData.append("tags", ""); // optional
    // formData.append("files", ""); // optional
    // ✅ ถ้า backend ต้องรู้ user_id ก็แนบไปด้วย (บาง version จำเป็น)
    formData.append("user_id", uid);

    const res = await fetch(`http://localhost:8000/posts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Server Response:", errorText);
      throw new Error(`Failed to create post (${res.status})`);
    }

    const created = await res.json();
    console.log("✅ Post created:", created);

    // ✅ อัปเดตโพสต์ใหม่ใน state
    setPosts((prev) => [
      {
        id: created.pid || Date.now(),
        user: created.username || "You",
        text: created.post_content || newPost,
        profile_image: created.profile_image || "/images/default.jpg",
        minutes: 0,
        likes: 0,
        liked: false,
        comments: [],
        category: "university",
      },
      ...prev,
    ]);

    setNewPost("");
  } catch (err) {
    console.error("❌ Error posting:", err);
    alert("Post failed — check console for details.");
  }
};

  // อัปโหลดไฟล์
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFiles((prev) => [...prev, file]);
    e.target.value = null;
  };

  // Like
  const handleLike = async (id) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
    try {
      const token = JSON.parse(localStorage.getItem("authData"))?.token;
      if (!token) return;
      await fetch(`${API_URL}/posts/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Error liking:", err);
    }
  };

  // Toggle comment
  const handleToggleComment = (id) => {
    setOpenComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Add comment
  const handleAddComment = async (postId) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    setCommentInputs({ ...commentInputs, [postId]: "" });

    try {
      const token = JSON.parse(localStorage.getItem("authData"))?.token;
      if (!token) return;

      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to comment");
      const newComment = await res.json();

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: [
                  ...p.comments,
                  {
                    username: newComment.username,
                    content: newComment.content,
                    profile_image: newComment.profile_image,
                    minutes: Math.floor((Date.now() - new Date(newComment.created_at)) / 60000),
                  },
                ],
              }
            : p
        )
      );
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // Delete post
  const handleDeletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const token = JSON.parse(localStorage.getItem("authData"))?.token;
      if (!token) return;
      await fetch(`${API_URL}/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  // เปิด Report Modal (แทน alert เดิม)
  const openReport = (id) => {
    setReportPostId(id);
    setReportOpen(true);
    setMenuOpen(null);
  };

  // ส่งรีพอร์ตไป backend
  const submitReport = async ({ postId, reason, details, evidence }) => {
    try {
      const token = JSON.parse(localStorage.getItem("authData"))?.token;
      if (!token) return;

      // รองรับไฟล์แนบด้วย FormData
      const form = new FormData();
      form.append("reason", reason);
      form.append("details", details || "");
      if (evidence) form.append("evidence", evidence);

      const res = await fetch(`${API_URL}/posts/${postId}/report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) throw new Error("Failed to submit report");
      // ปิดโมดอล + แสดงผลลัพธ์เบาๆ
      setReportOpen(false);
      alert("Thanks! Your report has been submitted.");
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Could not submit the report. Please try again.");
    }
  };

  // filter
  const filteredPosts = posts.filter(
    (p) => p.category === activeTab && p.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4">
      {/* header */}
      {activeTab === "university" && selectedUni && (
        <h2 className="text-lg font-semibold text-green-800 mb-2">🏫 {selectedUni}</h2>
      )}

      {/* search & tabs */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-full pl-10 pr-10 py-2"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-full transition ${
              activeTab === "university" ? "bg-[#e0ebe2] text-black" : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("university")}
          >
            {selectedUni ? `${selectedUni} Talk` : "University Talk"}
          </button>
          <button
            className={`px-4 py-2 rounded-full transition ${
              activeTab === "follow" ? "bg-[#e0ebe2] text-black" : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("follow")}
          >
            Follow Talk
          </button>
        </div>
      </div>

      {/* new post */}
      <div className="flex items-center gap-3 mb-6 p-3 rounded-lg shadow bg-[#fdfaf6]">
        <input
          type="text"
          placeholder="Type here what do you think..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          className="flex-1 bg-transparent outline-none px-2"
        />
        <div className="flex items-center gap-5 pr-2">
          <button onClick={() => fileInputRef.current.click()} className="text-gray-500 hover:text-green-600">
            <Paperclip className="w-5 h-5" />
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={handleFileUpload} />
          <button onClick={() => imageInputRef.current.click()} className="text-gray-500 hover:text-green-600">
            <Image className="w-5 h-5" />
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleFileUpload} />
          <button onClick={() => videoInputRef.current.click()} className="text-gray-500 hover:text-green-600">
            <Video className="w-5 h-5" />
          </button>
          <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleFileUpload} />
        </div>
        <button
          onClick={handlePost}
          className="bg-green-600 text-white px-4 py-1.5 rounded-full hover:bg-green-700 text-sm font-medium"
        >
          POST
        </button>
      </div>

      {/* posts */}
      <div className="space-y-6">
        {filteredPosts.map((p) => (
          <div key={p.id} className="flex gap-3 items-start">
            {/* profile */}
            <div className="flex flex-col items-center justify-start w-20">
              <span className="text-xs font-medium mb-2">{p.user}</span>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                <img
                  src={p.profile_image || userProfiles[p.user] || "/images/default.jpg"}
                  alt={p.user}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* card */}
            <div className="flex-1 rounded-lg shadow p-4 bg-[#fdfaf6] relative">
              {/* menu */}
              <div className="absolute top-2 right-2" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {menuOpen === p.id && (
                  <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-md border border-gray-200 z-10 overflow-hidden">
                    {p.user === "You" ? (
                      <button
                        onClick={() => handleDeletePost(p.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        <Trash className="w-4 h-4" /> Delete
                      </button>
                    ) : (
                      <button
                        onClick={() => openReport(p.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-700 hover:bg-gray-50"
                      >
                        <Flag className="w-4 h-4" /> Report
                      </button>
                    )}
                  </div>
                )}
              </div>

              <p className="text-slate-800">{p.text}</p>

              <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(p.id)}
                    className={`flex items-center gap-1 ${p.liked ? "text-red-600" : "hover:text-red-600"}`}
                  >
                    <Heart className="w-4 h-4" fill={p.liked ? "red" : "none"} /> {p.likes}
                  </button>
                  <button
                    onClick={() => handleToggleComment(p.id)}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    <MessageCircle className="w-4 h-4" /> {p.comments.length}
                  </button>
                </div>
                <div className="text-slate-400 text-xs">post {p.minutes} min ago</div>
              </div>

              {openComments[p.id] && (
                <div className="mt-3 space-y-2">
                  {p.comments.map((c, i) => (
                    <div key={i} className="flex gap-2 ml-6 items-center">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        <img
                          src={c.profile_image || userProfiles[c.username] || "/images/default.jpg"}
                          alt={c.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-2 rounded-lg bg-[#fff6ee] relative">
                        <span className="font-medium text-xs block">{c.username}</span>
                        <p className="text-sm text-slate-800">{c.content}</p>
                        <span className="absolute bottom-1 right-2 text-xs text-gray-400">
                          {c.minutes} min ago
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 ml-6">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[p.id] || ""}
                      onChange={(e) =>
                        setCommentInputs({
                          ...commentInputs,
                          [p.id]: e.target.value,
                        })
                      }
                      className="flex-1 border rounded-full px-3 py-1 text-sm"
                    />
                    <button
                      onClick={() => handleAddComment(p.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded-full text-sm hover:bg-green-700"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && <p className="text-center text-gray-500">No posts found.</p>}
      </div>

      {/* Report Modal */}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        postId={reportPostId}
        onSubmit={submitReport}
      />
    </div>
  );
}