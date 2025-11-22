import { useState, useRef, useEffect } from "react";
import { Link , useNavigate} from "react-router-dom";
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
import { useTranslation } from "react-i18next";

const API_URL = `${import.meta.env.VITE_API_URL}`;

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
  const { t } = useTranslation(); 
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
          <h3 className="text-lg font-semibold text-gray-800">
            {t("editPost.title")}
          </h3>
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
            {t("common.cancel")}
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"
          >
            {t("common.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Delete Modal ============
function DeleteConfirmModal({ open, onClose, onConfirm }) {
  const { t } = useTranslation();
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
          <h3 className="text-lg font-semibold text-gray-800">{t("delete.title")}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 text-center">
          <p className="text-gray-700 mb-5">
            {t("delete.confirm")} <br />
            <span className="text-gray-500 text-sm">
              {t("delete.warning")}
            </span>
          </p>
        </div>

        <div className="px-5 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-white"
          >
            {t("delete.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            {t("delete.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
// ============ Delete Comment Modal ============
function DeleteCommentModal({ open, onClose, onConfirm }) {
  const { t } = useTranslation(); 
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
        <div className="px-5 py-4 border-b bg-gradient-to-r from-amber-50 to-rose-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">{t("deleteComment.title")}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 text-center">
          <p className="text-gray-700 mb-5">
            {t("deleteComment.confirm")}
            <br />
            <span className="text-gray-500 text-sm">
              {t("deleteComment.warning")}
            </span>
          </p>
        </div>

        <div className="px-5 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-white"
          >
            {t("deleteComment.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            {t("deleteComment.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
// ============ Report Summit/ Modal ============


function ReportModal({ open, onClose, postId, onSubmit }) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [details, setDetails] = useState("");
  const { t } = useTranslation();
  const mountedRef = useRef(false); // ใช้กัน render ซ้ำ

  async function handleReportSubmit({ postId, reason, details }) {
    const currentKey = localStorage.getItem("currentUserKey");
    const authData = currentKey
      ? JSON.parse(localStorage.getItem(currentKey) || "{}")
      : null;

    if (!authData?.token) {
      console.error("No auth token found");
      return;
    }

    try {
      let endpoint;
      let body;
      let headers;

      const idStr = String(postId);

      if (idStr.startsWith("comment-")) {
        // comment report → strip prefix and send to /comments/{id}/report
        const commentId = postId.replace("comment-", "");
        endpoint = `${API_URL}/posts/comments/${commentId}/report`;

        // backend expects JSON (schemas.ReportRequest)
        body = JSON.stringify({ reason, details });
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        };
      } else {
        // post report → /posts/{id}/report
        endpoint = `${API_URL}/posts/${postId}/report`;

        body = JSON.stringify({ reason, details });
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error(`Failed to report: ${response.status}`);
      }

      console.log("Report submitted successfully");
      onClose();
    } catch (err) {
      console.error("Error submitting report:", err);
    }
  }

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
    { key: "harassment", label: t("report.harassment") },
    { key: "sexual", label: t("report.sexual") },
    { key: "illegal", label: t("report.illegal") },
    { key: "spam", label: t("report.spam") },
    { key: "privacy", label: t("report.privacy") },
    { key: "other", label: t("report.other") },
  ];

  const handleSubmit = () => {
    const finalReason =
      reason === "Other" ? customReason.trim() || "Other" : reason;
    handleReportSubmit({
      postId,
      reason: finalReason,
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
            {postId?.toString().startsWith("comment-")
              ? t("report.titleComment")
              : t("report.titlePost")}
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
              {t("report.description")} ({t("report.postId")}:{" "}
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
              {t("report.additional")}{" "}
              <span className="text-gray-400 font-normal">{t("report.optional")}</span>
            </label>
            <textarea
              placeholder={t("report.detailsPlaceholder")}
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
            {t("common.cancel")}
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
            {t("report.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ฟังก์ชันคำนวณเวลาโพสต์
function formatTimeAgo(createdAt) {
  if (!createdAt) return "--";

  const now = new Date();
  const postTime = new Date(createdAt);
  const diffMs = now - postTime; // ส่วนต่างเป็นมิลลิวินาที
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return `${diffSec} sec ago`;
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;

  // ถ้าเกิน 1 วัน → แสดงเป็นวันที่จริง
  return postTime.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


// ============ Main Board ============

export default function Board() {
  const [posts, setPosts] = useState(initialPosts);
  const [newPost, setNewPost] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("university");
  const [commentInputs, setCommentInputs] = useState({});
  const [commentFiles, setCommentFiles] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [pendingFiles, setPendingFiles] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [selectedUni, setSelectedUni] = useState(null);
  const currentKey = localStorage.getItem("currentUserKey");
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  useEffect(() => {
    const fetchPosts = async () => {
      const currentKey = localStorage.getItem("currentUserKey");
      const token = currentKey
        ? JSON.parse(localStorage.getItem(currentKey) || "{}")?.token
        : null;

      if (!token) return;

      const endpoint =
        activeTab === "follow"
          ? `${API_URL}/posts/following`
          : `${API_URL}/posts/all`;

      try {
        const res = await fetch(endpoint, {
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
              cid: c.cid || c.id || c.comment_id,
              username: c.username,
              content: c.content,
              profile_image: c.profile_image,
              minutes: Math.floor(
                (Date.now() - new Date(c.created_at)) / 60000
              ),
              files: c.files || [],
            })) || [],
          images: p.images || [],
          created_at: p.created_at,
          category: activeTab,
        }));

        setPosts(loaded.length > 0 ? loaded : []);

      } catch (err) {
        console.error("Error loading posts:", err);
      }
    };

    fetchPosts();
  }, [activeTab]); // 🔥 สำคัญ ต้องใส่ activeTab
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
        displayName: currentUser.name || "You",
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
    const files = commentFiles[postId] || [];
    if (!content && files.length === 0) return;

    setCommentInputs({ ...commentInputs, [postId]: "" });
    setCommentFiles({ ...commentFiles, [postId]: [] }); // ล้างไฟล์

    try {
      const currentKey = localStorage.getItem("currentUserKey");
      const token = currentKey
        ? JSON.parse(localStorage.getItem(currentKey) || "{}")?.token
        : null;

      if (!token) return;

      const formData = new FormData();
      formData.append("content", content);
      files.forEach((file) => formData.append("files", file)); 

      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
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
                    cid: newComment.cid || newComment.id || newComment.comment_id, 
                    username: newComment.username,
                    content: newComment.content,
                    profile_image: newComment.profile_image,
                    minutes: Math.floor(
                      (Date.now() - new Date(newComment.created_at)) / 60000
                    ),
                    files: newComment.files || [],
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

  // เปิด modal ยืนยันลบคอมเมนต์
  const handleDeleteComment = (postId, commentIndex, commentId) => {
    setDeleteCommentTarget({ postId, commentIndex, commentId });
    setDeleteCommentOpen(true);
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
  // สำหรับ modal ลบคอมเมนต์
  const [deleteCommentOpen, setDeleteCommentOpen] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState(null); // {postId, commentIndex, commentId}
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
  const confirmDeleteComment = async () => {
    if (!deleteCommentTarget) return;
    const { postId, commentIndex, commentId } = deleteCommentTarget;

    try {
      const currentKey = localStorage.getItem("currentUserKey");
      const token = currentKey
        ? JSON.parse(localStorage.getItem(currentKey) || "{}")?.token
        : null;

      if (!token) return;

      const res = await fetch(`${API_URL}/posts/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete comment");

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: p.comments.filter((_, i) => i !== commentIndex) }
            : p
        )
      );

      setDeleteCommentOpen(false);
      setDeleteCommentTarget(null);
    } catch (err) {
      console.error("Error deleting comment:", err);
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

  // เปิดหน้าต่างรีพอร์ตคอมเมนต์
  const openReportComment = (commentId) => {
    setReportPostId(`comment-${commentId}`); // ใช้ prefix แยกจาก post
    setReportOpen(true);
  };

  // ส่งรีพอร์ต 
  const submitReport = async ({ postId, reason, details }) => {
    try {
      const currentKey = localStorage.getItem("currentUserKey");
      const token = currentKey
        ? JSON.parse(localStorage.getItem(currentKey) || "{}")?.token
        : null;

      if (!token) return;

      const form = new FormData();
      form.append("reason", reason);
      form.append("details", details || "");

      // ถ้าเป็น comment (prefix comment-)
      const endpoint = postId.startsWith("comment-")
      ? `${API_URL}/posts/comments/${postId.replace("comment-", "")}/report`
      : `${API_URL}/posts/${postId}/report`;


      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) throw new Error("Failed to submit report");

      setReportOpen(false);
      alert("Report submitted successfully!");
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Failed to submit report.");
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
            placeholder={t("board.search")}
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
            {selectedUni ? `${selectedUni} Talk` : t("board.universityTalk")}
          </button>
          <button
            className={`px-4 py-2 rounded-full transition ${
              activeTab === "follow"
                ? "bg-[#e0ebe2] text-black"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("follow")}
          >
            {t("board.followTalk")}
          </button>
        </div>
      </div>

      {/* new post */}
      <div
        className={`flex flex-col gap-2 mb-6 p-4 rounded-lg shadow bg-[#fdfaf6] transition-all duration-300 ${
          pendingFiles.length > 0 ? "pb-4" : ""
        }`}
      >
        {/* input bar */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder={t("board.newPostPlaceholder")}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="flex-1 bg-transparent outline-none px-2 text-gray-700 placeholder-gray-400"
          />

          {/* ปุ่มแนบไฟล์ */}
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

          {/* ปุ่มโพสต์ */}
          <button
            onClick={handlePost}
            className="bg-green-600 text-white px-4 py-1.5 rounded-full hover:bg-green-700 text-sm font-medium"
          >
            {t("board.postButton")}
          </button>
        </div>


        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 border border-[#32a349] bg-white/60 px-3 py-2 rounded-lg">
            {pendingFiles.map((file, index) => (
              <div
                key={index}
                className="group flex items-center gap-2 px-3 py-1 bg-white border border-[#32a349]/30 rounded-full text-sm text-gray-700 shadow-sm hover:shadow-md transition-all"
              >
                {/* ไอคอนไฟล์ */}
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#32a349]/15 text-[#32a349]">
                  {file.type.startsWith("image/") ? (
                    <Image className="w-3.5 h-3.5" />
                  ) : file.type.startsWith("video/") ? (
                    <Video className="w-3.5 h-3.5" />
                  ) : (
                    <Paperclip className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* ชื่อไฟล์ */}
                <span className="truncate max-w-[140px] font-medium">
                  {file.name.length > 20
                    ? file.name.slice(0, 17) + "..."
                    : file.name}
                </span>

                {/* ปุ่มลบ */}
                <button
                  onClick={() =>
                    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="text-gray-400 hover:text-red-500 transition"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* posts */}
      <div className="space-y-6">
        {filteredPosts.map((p) => (
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
                    {p.username === currentUser?.username ? (
                      <>
                        <button
                          onClick={() => openEditModal(p)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" /> {t("post.edit")}
                        </button>
                        <button
                          onClick={() => {
                            setDeletePostId(p.id);
                            setDeleteOpen(true);
                            setMenuOpen(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash className="w-4 h-4" /> {t("post.delete")}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => openReport(p.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
                      >
                        <Flag className="w-4 h-4" /> {t("post.report")}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        // ไปหน้า tag หรือ filter โพสต์
                        navigate(`/app/tags/${word.slice(1)}`);
                        // ถ้ามีหน้า tag แล้วใช้ navigate(`/tags/${word.slice(1)}`)
                      }}
                      className="text-green-700 hover:text-green-800 font-medium cursor-pointer"
                    >
                      {word}
                    </span>
                  ) : (
                    <span key={i}>{word}</span>
                  )
                )}
              </p>

              {/* รูป/ไฟล์แนบของโพสต์ */}
              {p.images && p.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {p.images.map((img, i) => {
                    const type = img.file_type || "";
                    const isImage =
                      type.startsWith("image/") ||
                      /\.(jpg|jpeg|png|gif|webp)$/i.test(img.path);
                    const isVideo =
                      type.startsWith("video/") ||
                      /\.(mp4|mov|webm|ogg)$/i.test(img.path);
                    const isPdf =
                      type === "application/pdf" || /\.pdf$/i.test(img.path);

                    return (
                      <div key={i}>
                        {isImage && (
                          <img
                            src={`${API_URL}${img.path}`}
                            alt={`attachment-${i}`}
                            className="w-44 h-44 object-cover rounded-lg border border-gray-200 shadow-sm hover:opacity-80 transition"
                            onClick={() => setPreviewImage(`${API_URL}${img.path}`)}
                          />
                        )}
                        {isVideo && (
                          <div className="rounded-lg overflow-hidden border border-gray-200 bg-black shadow-sm">
                            <video
                              src={`${API_URL}${img.path}`}
                              controls
                              className="w-64 h-40 object-contain"
                            />
                          </div>
                        )}
                        {isPdf && (
                          <a
                            href={`${API_URL}${img.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-blue-600 hover:text-blue-700 hover:underline text-sm shadow-sm"
                          >
                            📄 {img.path.split("/").pop()}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/*  Like /  Comment */}
              <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(p.id)}
                    className={`flex items-center gap-1 ${
                      p.liked ? "text-red-600" : "hover:text-red-600"
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
                    <MessageCircle className="w-4 h-4" /> {p.comments.length}
                  </button>
                </div>
                <div className="text-slate-400 text-xs">
                  {formatTimeAgo(p.created_at)}
                </div>
              </div>

              {/* ส่วนคอมเมนต์ */}
              {openComments[p.id] && (
                <div className="mt-3 space-y-2">
                  {p.comments.map((c, i) => (
                    <div key={i} className="flex gap-2 ml-6 items-start">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        <img
                          src={
                            c.profile_image
                              ? c.profile_image.startsWith("http") ||
                                c.profile_image.includes("/uploads/")
                                ? `${API_URL}${c.profile_image.replace(API_URL, "")}`
                                : `${API_URL}/uploads/user/${c.profile_image}`
                              : userProfiles[c.username] || "/images/default.jpg"
                          }
                          alt={c.username}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 p-2 rounded-lg bg-[#fff6ee] relative">
                        {/* ปุ่มลบหรือรีพอร์ตคอมเมนต์ */}
                        {c.username === currentUser?.username ? (
                          <button
                            onClick={() => handleDeleteComment(p.id, i, c.cid)}
                            className="absolute top-1 right-1 text-gray-400 hover:text-red-600"
                            title="Delete comment"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openReportComment(c.cid)}
                            className="absolute top-1 right-1 text-gray-400 hover:text-amber-600"
                            title="Report comment"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <span className="font-medium text-xs block">{c.username}</span>
                        <p className="text-sm text-slate-800">{c.content}</p>

                        {/* รูป / วิดีโอ / PDF */}
                        {c.files && c.files.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {c.files.map((file, j) => {
                              const type = file.file_type || "";
                              const path = `${API_URL}${file.path}`;
                              const isImage =
                                type.startsWith("image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.path);
                              const isVideo =
                                type.startsWith("video") || /\.(mp4|mov|webm|ogg)$/i.test(file.path);
                              const isPdf =
                                type === "pdf" ||
                                type === "application/pdf" ||
                                /\.pdf$/i.test(file.path);

                              return (
                                <div key={j}>
                                  {isImage && (
                                    <img
                                      src={path}
                                      alt={`comment-img-${j}`}
                                      className="w-28 h-28 object-cover rounded-md border border-gray-200 hover:opacity-80 transition"
                                      onClick={() => setPreviewImage(path)}
                                    />
                                  )}
                                  {isVideo && (
                                    <video
                                      src={path}
                                      controls
                                      className="w-40 h-28 rounded-md border border-gray-200"
                                    />
                                  )}
                                  {isPdf && (
                                    <a
                                      href={path}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-blue-600 hover:underline text-xs"
                                    >
                                      📄 {file.path.split("/").pop()}
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <span className="absolute bottom-1 right-2 text-xs text-gray-400">
                          {c.minutes} min ago
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* กล่องเขียนคอมเมนต์ + แนบไฟล์ */}
                  <div className="flex gap-2 ml-6 items-center">
                    {/* ปุ่มแนบไฟล์ */}
                    <div className="flex items-center gap-3">
                      {/* ไฟล์ */}
                      <button
                        onClick={() =>
                          document.getElementById(`comment-file-${p.id}`).click()
                        }
                        className="text-gray-500 hover:text-green-600"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <input
                        id={`comment-file-${p.id}`}
                        type="file"
                        hidden
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          setCommentFiles((prev) => ({
                            ...prev,
                            [p.id]: [...(prev[p.id] || []), ...files],
                          }));
                        }}
                      />

                      {/* รูป */}
                      <button
                        onClick={() =>
                          document.getElementById(`comment-image-${p.id}`).click()
                        }
                        className="text-gray-500 hover:text-green-600"
                      >
                        <Image className="w-4 h-4" />
                      </button>
                      <input
                        id={`comment-image-${p.id}`}
                        type="file"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          setCommentFiles((prev) => ({
                            ...prev,
                            [p.id]: [...(prev[p.id] || []), ...files],
                          }));
                        }}
                      />

                      {/* วิดีโอ */}
                      <button
                        onClick={() =>
                          document.getElementById(`comment-video-${p.id}`).click()
                        }
                        className="text-gray-500 hover:text-green-600"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                      <input
                        id={`comment-video-${p.id}`}
                        type="file"
                        hidden
                        accept="video/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          setCommentFiles((prev) => ({
                            ...prev,
                            [p.id]: [...(prev[p.id] || []), ...files],
                          }));
                        }}
                      />
                    </div>

                    {/* กล่องข้อความ */}
                    <input
                      type="text"
                      placeholder={t("board.writeComment")}
                      value={commentInputs[p.id] || ""}
                      onChange={(e) =>
                        setCommentInputs({
                          ...commentInputs,
                          [p.id]: e.target.value,
                        })
                      }
                      className="flex-1 border rounded-full px-3 py-1 text-sm"
                    />

                    {/* ปุ่มส่ง */}
                    <button
                      onClick={() => handleAddComment(p.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded-full text-sm hover:bg-green-700"
                    >
                      {t("board.send")}
                    </button>
                  </div>

                  {/* แสดงไฟล์แนบก่อนส่ง */}
                  {commentFiles[p.id]?.length > 0 && (
                    <div className="ml-6 mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                      {commentFiles[p.id].map((file, index) => {
                        const isImage = file.type.startsWith("image/");
                        const isVideo = file.type.startsWith("video/");
                        const isPdf = file.type === "application/pdf";

                        return (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-gray-50 border px-2 py-1 rounded-full shadow-sm"
                          >
                            {isImage ? (
                              <Image className="w-3.5 h-3.5 text-green-600" />
                            ) : isVideo ? (
                              <Video className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Paperclip className="w-3.5 h-3.5 text-green-600" />
                            )}
                            <span className="truncate max-w-[120px]">
                              {file.name}
                            </span>
                            <button
                              onClick={() =>
                                setCommentFiles((prev) => ({
                                  ...prev,
                                  [p.id]: prev[p.id].filter((_, i) => i !== index),
                                }))
                              }
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <p className="text-center text-gray-500">{t("board.noPosts")}</p>
        )}
      </div>

      {/* Image Preview Modal */}
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

      <DeleteCommentModal
        open={deleteCommentOpen}
        onClose={() => setDeleteCommentOpen(false)}
        onConfirm={confirmDeleteComment}
      />
    </div>
  );
}