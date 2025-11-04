import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Edit,
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


const initialPosts = [
  { id: 1, username: "aong", text: "Has anyone ever taken the ISP course?", minutes: 10, likes: 48, liked: false, comments: [], category: "university" },
  { id: 2, username: "Skibidi", text: "Looking for a single woman.", minutes: 2, likes: 9, liked: false, comments: [], category: "university" },
  { id: 3, username: "Pysart", text: "Share the summary file for English 2, course code 01355102-64", minutes: 32, likes: 102, liked: false, comments: [], category: "university" },
];

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
  const currentKey = localStorage.getItem("currentUserKey");
  const [previewImage, setPreviewImage] = useState(null);
  const authData = currentKey
    ? JSON.parse(localStorage.getItem(currentKey) || "{}")
    : {};
  const [currentUser] = useState({
    username: authData?.username || "You",
    name: authData?.name || authData?.username || "You",
    uid: authData?.uid || null,
  });

    useEffect(() => {
    console.log("currentUser:", currentUser);
  }, [currentUser]);

    useEffect(() => {
    console.log("Board mounted");
    return () => console.log("🧹 Board unmounted");
  }, []);



  // state สำหรับหน้าต่าง Report
  const [reportOpen, setReportOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const menuRef = useRef(null);

  // โหลดโพสต์จริง
  useEffect(() => {
    const fetchPosts = async () => {
      const currentKey = localStorage.getItem("currentUserKey");
      const token = currentKey
        ? JSON.parse(localStorage.getItem(currentKey) || "{}")?.token
        : null;
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/posts/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch posts");
        const data = await res.json();

        const loaded = data.map((p) => ({
          id: p.pid,
          user_id: p.user_id,
          username: p.username,
          displayName: p.name || p.username,
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

        setPosts(loaded.length > 0 ? loaded : initialPosts);
      } catch (err) {
        console.error("Error loading posts:", err);
      }
    };
    fetchPosts();
  }, []);

  const forumIdMap = {
  university: 1, // University Talk → forum id 1
  follow: 2,     // Follow Talk → forum id 2
};
  // โพสต์ใหม่
const handlePost = async () => {
  if (newPost.trim() === "") return;

  try {
    const currentKey = localStorage.getItem("currentUserKey");
    const authData = currentKey
      ? JSON.parse(localStorage.getItem(currentKey) || "{}")
      : {};
    const token = authData?.token;
    const uid = authData?.uid;

    if (!token) {
      alert("Please log in again before posting.");
      return;
    }

    // ใช้ forum_id ตามแท็บที่เลือก
    const forum_id = forumIdMap[activeTab] || 1;

    const formData = new FormData();
    formData.append("post_content", newPost);
    formData.append("forum_id", forum_id);
    formData.append("user_id", uid);

    // เพิ่มส่วนนี้ (แนบไฟล์ทั้งหมดใน pendingFiles)
    pendingFiles.forEach((file) => {
      formData.append("files", file); // "files" ต้องตรงกับ backend
    });

    const res = await fetch(`${API_URL}/posts/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData, // อย่าลืม! ห้ามใส่ Content-Type เอง (browser จัดการ)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Server Response:", errorText);
      throw new Error(`Failed to create post (${res.status})`);
    }

    const created = await res.json();
    console.log("Post created:", created);

    // เคลียร์ state หลังโพสต์เสร็จ
    setPosts((prev) => [
      {
        id: created.pid || Date.now(),
        username: currentUser.username || created.username || "You",
        displayName: currentUser.name || currentUser.username || "You",
        text: created.post_content || newPost,
        profile_image: created.profile_image || "/images/default.jpg",
        minutes: 0,
        likes: 0,
        liked: false,
        comments: [],
        category: activeTab,
        images: created.images || [],
      },
      ...prev,
    ]);

    setNewPost("");
    setPendingFiles([]); // ล้างไฟล์ที่เลือกไว้
  } catch (err) {
    console.error("Error posting:", err);
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
      const currentKey = localStorage.getItem("currentUserKey");
      const token = currentKey
        ? JSON.parse(localStorage.getItem(currentKey) || "{}")?.token
        : null;
        
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
      const currentKey = localStorage.getItem("currentUserKey");
      const token = currentKey
        ? JSON.parse(localStorage.getItem(currentKey) || "{}")?.token
        : null;

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
  // Edit post
  const [editOpen, setEditOpen] = useState(false);
  const [editPostId, setEditPostId] = useState(null);
  const [editText, setEditText] = useState("");

  // เปิด modal แก้ไข
  const openEditModal = (post) => {
    setEditPostId(post.id);
    setEditText(post.text);
    setEditOpen(true);
    setMenuOpen(null);
  };

  // ส่งไป backend
  const handleEditSubmit = async () => {
    if (!editText.trim()) return;
    try {
      const currentKey = localStorage.getItem("currentUserKey");
      const token = currentKey
        ? JSON.parse(localStorage.getItem(currentKey) || "{}")?.token
        : null;

      if (!token) return;
      const res = await fetch(`${API_URL}/posts/${editPostId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ post_content: editText }),
      });

      if (!res.ok) throw new Error("Failed to update post");

      setPosts((prev) =>
        prev.map((p) =>
          p.id === editPostId ? { ...p, text: editText } : p
        )
      );
      setEditOpen(false);
    } catch (err) {
      console.error("Error editing post:", err);
    }
  };
  // Delete post
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);

  const handleDeletePost = (id) => {
    setDeletePostId(id);
    setDeleteOpen(true);
    setMenuOpen(null); // ปิดเมนู dropdown
  };

  // ฟังก์ชันลบจริง (เรียกจากปุ่ม Delete ใน modal)
const confirmDelete = async () => {
  try {
    const currentKey = localStorage.getItem("currentUserKey");
    const token = currentKey
      ? JSON.parse(localStorage.getItem(currentKey) || "{}")?.token
      : null;

    if (!token) return;

    await fetch(`${API_URL}/posts/${deletePostId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setPosts((prev) => prev.filter((p) => p.id !== deletePostId));
    setDeleteOpen(false);
    setDeletePostId(null);
  } catch (err) {
    console.error("Error deleting post:", err);
  }
};



  const openReport = (id) => {
    // ถ้ามี modal เปิดอยู่และเป็นโพสต์เดียวกัน → ไม่ต้องเปิดใหม่
    if (reportOpen && reportPostId === id) {
      console.log("Report already open for post:", id);
      return;
    }

    console.log("Opening report modal for post:", id);

    // ปิดก่อนถ้ามี modal ค้าง
    setReportOpen(false);
    setTimeout(() => {
      setReportPostId(id);
      setReportOpen(true);
    }, 50);

    // ปิดเมนู dropdown
    setMenuOpen(null);
  };

  // ส่งรีพอร์ตไป backend
  const submitReport = async ({ postId, reason, details, evidence }) => {
    try {
      const currentKey = localStorage.getItem("currentUserKey");
      const token = currentKey
        ? JSON.parse(localStorage.getItem(currentKey) || "{}")?.token
        : null;

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
        <h2 className="text-lg font-semibold text-green-800 mb-2">
          🏫 {selectedUni}
        </h2>
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
              activeTab === "university"
                ? "bg-[#e0ebe2] text-black"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("university")}
          >
            {selectedUni ? `${selectedUni} Talk` : "University Talk"}
          </button>
          <button
            className={`px-4 py-2 rounded-full transition ${
              activeTab === "follow"
                ? "bg-[#e0ebe2] text-black"
                : "bg-gray-200 text-gray-700"
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
          <button
            onClick={() => fileInputRef.current.click()}
            className="text-gray-500 hover:text-green-600"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleFileUpload}
          />
          <button
            onClick={() => imageInputRef.current.click()}
            className="text-gray-500 hover:text-green-600"
          >
            <Image className="w-5 h-5" />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileUpload}
          />
          <button
            onClick={() => videoInputRef.current.click()}
            className="text-gray-500 hover:text-green-600"
          >
            <Video className="w-5 h-5" />
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={handleFileUpload}
          />
        </div>
        <button
          onClick={handlePost}
          className="bg-green-600 text-white px-4 py-1.5 rounded-full hover:bg-green-700 text-sm font-medium"
        >
          POST
        </button>
      </div>

      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {pendingFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-2 py-1 bg-emerald-50 rounded-md text-xs text-emerald-700 border border-emerald-200"
            >
              <span className="truncate max-w-[100px]">{file.name}</span>
              <button
                onClick={() =>
                  setPendingFiles((prev) => prev.filter((_, i) => i !== index))
                }
                className="text-red-500 hover:text-red-700"
                title="Remove file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* posts */}
      <div className="space-y-6">
        {filteredPosts.map((p) => (
          <div key={`${p.id}-${p.username}`} className="flex gap-3 items-start">
            {/* profile */}
              <div className="flex flex-col items-center justify-start w-20">
                <Link
                  to={`/app/user/${p.user_id || p.id || p.username}`} // ถ้ามี user_id ใช้อันนั้น
                  className="text-xs font-medium mb-2 text-black hover:text-emerald-600 hover:underline"
                >
                  {p.displayName}
                </Link>

                <Link
                  to={`/app/user/${p.user_id || p.id || p.username}`}
                  className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 hover:opacity-80 transition"
                >
                  <img
                    src={
                      p.profile_image
                        ? p.profile_image.startsWith("http") ||
                          p.profile_image.includes("/uploads/")
                          ? `${API_URL}${p.profile_image.replace(API_URL, "")}`
                          : `${API_URL}/uploads/user/${p.profile_image}`
                        : userProfiles[p.username] || "/images/default.jpg"
                    }
                    alt={p.displayName}
                    className="w-full h-full object-cover"
                  />
                </Link>
              </div>

            {/* card */}
            <div className="flex-1 rounded-lg shadow p-4 bg-[#fdfaf6] relative">
              {/* menu */}
              <div className="absolute top-2 right-2" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // ป้องกันการคลิกทะลุ
                    setMenuOpen(menuOpen === p.id ? null : p.id); // toggle dropdown เฉพาะโพสต์นี้
                    }}
                    className="text-gray-500 hover:text-gray-700"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {menuOpen === p.id && (
                  <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-md border border-gray-200 z-10 overflow-hidden">
                    {p.username === currentUser?.username ? (
                      <>
                        <button
                          onClick={() => openEditModal(p)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" /> Edit Post
                        </button>
                        <button
                          onClick={() => {
                            setDeletePostId(p.id);
                            setDeleteOpen(true);
                            setMenuOpen(null);
                          }}
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

              <p className="text-slate-800">{p.text}</p>
              {/* แสดงรูป/ไฟล์ที่แนบ */}
              {p.images && p.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {p.images.map((img, i) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(img.path);
                    const isPdf = /\.pdf$/i.test(img.path);

                    return (
                      <div key={i} className="border rounded-lg p-2 bg-white shadow-sm">
                        {isImage ? (
                          <img
                            src={`${API_URL}${img.path}`}
                            alt={`attachment-${i}`}
                            className="w-40 h-40 object-cover rounded-md cursor-pointer hover:opacity-80 transition"
                            onClick={() => setPreviewImage(`${API_URL}${img.path}`)}
                          />
                        ) : isPdf ? (
                          <a
                            href={`${API_URL}${img.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                          >
                            📄 {img.path.split("/").pop()}
                          </a>
                        ) : (
                          <a
                            href={`${API_URL}${img.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Download file
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(p.id)}
                    className={`flex items-center gap-1 ${
                      p.liked
                        ? "text-red-600"
                        : "hover:text-red-600"
                    }`}
                  >
                    <Heart
                      className="w-4 h-4"
                      fill={p.liked ? "red" : "none"}
                    />{" "}
                    {p.likes}
                  </button>
                  <button
                    onClick={() => handleToggleComment(p.id)}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    <MessageCircle className="w-4 h-4" />{" "}
                    {p.comments.length}
                  </button>
                </div>
                <div className="text-slate-400 text-xs">
                  post {p.minutes} min ago
                </div>
              </div>

              {openComments[p.id] && (
                <div className="mt-3 space-y-2">
                  {p.comments.map((c, i) => (
                    <div key={i} className="flex gap-2 ml-6 items-center">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        <img
                          src={
                            c.profile_image
                              ? c.profile_image.startsWith("http") ||
                                c.profile_image.includes("/uploads/")
                                ? `${API_URL}${c.profile_image.replace(
                                    API_URL,
                                    ""
                                  )}`
                                : `${API_URL}/uploads/user/${c.profile_image}`
                              : userProfiles[c.username] ||
                                "/images/default.jpg"
                          }
                          alt={c.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-2 rounded-lg bg-[#fff6ee] relative">
                        <span className="font-medium text-xs block">
                          {c.username}
                        </span>
                        <p className="text-sm text-slate-800">
                          {c.content}
                        </p>
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

        {filteredPosts.length === 0 && (
          <p className="text-center text-gray-500">No posts found.</p>
        )}
      </div>

      {/* 🔹 Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="preview"
            className="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl border border-white/30"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Modals */}
      {reportOpen && (
        <ReportModal
          key={reportPostId}
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          postId={reportPostId}
          onSubmit={submitReport}
        />
      )}

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
    </div>
  );
}