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
import { useTranslation } from "react-i18next";

const API_URL = "http://localhost:8000";

function normalizeFilePath(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/uploads/")) return `${API_URL}${path}`;
  if (path.startsWith("/")) return `${API_URL}${path}`;
  return `${API_URL}/uploads/post/${path}`;
}

function DeleteCommentModal({ open, onClose, onConfirm }) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 border overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-5 py-4 border-b bg-gradient-to-r from-rose-50 to-amber-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("deleteComment.title")}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 text-center">
          <p className="text-gray-700 mb-5">
            {t("deleteComment.confirm")}
            <br />
            <span className="text-gray-500 text-sm">
              {t("deleteComment.warning")}
            </span>
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm"
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


function ReportCommentModal({ open, onClose, onSubmit, commentId }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [details, setDetails] = useState("");

  if (!open) return null;

  // Keep the original key for sending backend, label uses i18n.
  const reasons = [
    { key: "Harassment",       label: t("report.harassment") },
    { key: "Sexual Content",   label: t("report.sexual") },
    { key: "Illegal Activity", label: t("report.illegal") },
    { key: "Spam",             label: t("report.spam") },
    { key: "Privacy Violation",label: t("report.privacy") },
    { key: "Other",            label: t("report.other") },
  ];

  const handleSubmit = () => {
    const finalReason = reason === "Other" ? (customReason.trim() || "Other") : reason;
    onSubmit({
      commentId,
      reason: finalReason,
      details: details.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-50 to-amber-50 border-b">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-emerald-700" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t("report.titleComment")}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <p className="text-sm text-gray-600">
            {t("report.description")}
          </p>

          <div className="grid grid-cols-1 gap-2">
            {reasons.map((r) => (
              <label
                key={r.key}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  reason === r.key ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
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
              placeholder={t("report.otherPlaceholder")}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          )}

          {/* Additional details */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              {t("report.additional")}{" "}
              <span className="text-gray-400 font-normal">({t("report.optional")})</span>
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

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-white"
          >
            {t("common.cancel")}
          </button>
          <button
            disabled={!reason || (reason === "Other" && !customReason.trim())}
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-lg text-white text-sm transition ${
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


// Edit Modal
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
        
        {/* Header */}
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

        {/* Body */}
        <div className="p-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Footer */}
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
            {t("editPost.save")}
          </button>
        </div>
      </div>
    </div>
  );
}


// Delete Modal
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
        
        {/* HEADER */}
        <div className="px-5 py-4 border-b bg-gradient-to-r from-rose-50 to-amber-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("delete.title")}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 text-center">
          <p className="text-gray-700 mb-5">
            {t("delete.confirm")}
            <br />
            <span className="text-gray-500 text-sm">
              {t("delete.warning")}
            </span>
          </p>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-white"
          >
            {t("common.cancel")}
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            {t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}


// Report Modal
function ReportModal({ open, onClose, postId, onSubmit }) {
  const { t } = useTranslation();

  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [details, setDetails] = useState("");
  const mountedRef = useRef(false);

  // Detect mount/unmount
  useEffect(() => {
    if (open && !mountedRef.current) {
      mountedRef.current = true;
    }
    if (!open) {
      mountedRef.current = false;
    }
  }, [open]);

  // Close with ESC
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setReason("");
      setCustomReason("");
      setDetails("");
    }
  }, [open]);

  if (!open || !postId || (mountedRef.current && !open)) return null;

  // Use reason from translation file
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
      reason === "other" ? customReason.trim() || "other" : reason;

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
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50 to-amber-50 border-b">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-emerald-700" />
            <h3 className="text-lg font-semibold text-gray-800">
              {postId.toString().startsWith("comment-")
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

        {/* BODY */}
        <div className="p-5 space-y-5 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-3">
            {t("report.description")}  
            <br />
            <span className="font-medium text-gray-800">
              ({t("report.postId")}: #{postId})
            </span>
          </p>

          {/* REASONS */}
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

          {/* OTHER reason */}
          {reason === "other" && (
            <input
              type="text"
              placeholder={t("report.otherPlaceholder")}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="mt-3 w-full border rounded-lg px-3 py-2 text-sm"
            />
          )}

          {/* Additional details */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              {t("report.additional")}{" "}
              <span className="text-gray-400 font-normal">
                ({t("report.optional")})
              </span>
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

        {/* FOOTER */}
        <div className="px-5 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-white"
          >
            {t("common.cancel")}
          </button>

          <button
            onClick={handleSubmit}
            disabled={!reason || (reason === "other" && !customReason.trim())}
            className={`px-4 py-2 rounded-lg text-white text-sm transition
              ${
                !reason || (reason === "other" && !customReason.trim())
                  ? "bg-emerald-300 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
          >
            {t("common.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function TagDetail() {
  const { tagName } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  const [commentInputs, setCommentInputs] = useState({});
  const [commentFiles, setCommentFiles] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [deleteCommentOpen, setDeleteCommentOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reportCommentOpen, setReportCommentOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const handleToggleComment = (id) => {
    setOpenComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Delete your own comments
  const handleDeleteComment = async (pid, cid) => {
  const token = authData?.token;
      if (!token) return alert("Please log in again.");
      try {
         await fetch(`${API_URL}/comments/${cid}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
         });
          setPosts(prev =>
          prev.map(p =>
              p.id === pid
              ? { ...p, comments: p.comments.filter(c => c.cid !== cid) }
              : p
          )
          );
      } catch (err) {
          console.error("Delete comment failed:", err);
      }
      };

  // Report other people's comments
  const handleReportComment = (cid) => {
  setReportPostId(`comment-${cid}`);
  setReportOpen(true);
    };

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

  // Load posts and tags
  useEffect(() => {
    const token = authData?.token;
    if (!token) return;

    const fetchPosts = async () => {
    try {
        const res = await fetch(`${API_URL}/posts/all`, {
        headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // Count tags from all posts
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

        setSuggestions(
        formattedTags
            .filter((t) => t.name.toLowerCase().includes(tagName.toLowerCase()))
            .slice(0, 6)
        );

        // Load posts for that tag
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
        comments: Array.isArray(p.comments)
          ? p.comments.map(c => ({
              ...c,
              files: Array.isArray(c.files)
                ? c.files.map(f => ({
                    ...f,
                    path: normalizeFilePath(f.path)
                  }))
                : []
            }))
          : [],
        created_at: p.created_at,
        profile_image: p.profile_image,
        images: Array.isArray(p.images)
          ? p.images.map(img => ({ ...img, path: normalizeFilePath(img.path) }))
          : [],
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

      const tags = Array.isArray(data)
        ? data
        : data.trending_tags || data.tags || [];

      // If there is no value, use fallback.
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

  // Recommended tags
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
  
    const handleLike = async (id) => {
    const token = authData?.token;
    if (!token) return alert("Please log in to like posts.");

    // 1. Instant UI update (optimistic update)
    setPosts((prev) =>
        prev.map((p) =>
        p.id === id
            ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
            : p
        )
    );

    try {
        // 2. Send the actual request to the backend.
        const res = await fetch(`${API_URL}/posts/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Like request failed");

        const updated = await res.json();

        // 3. If the backend sends new data (some systems have delays)
        if (updated.like_count !== undefined) {
        setPosts((prev) =>
            prev.map((p) =>
            p.id === id
                ? { ...p, liked: updated.liked, likes: updated.like_count }
                : p
            )
        );
        }
    } catch (err) {
        console.error("Error updating like:", err);
        // 4. If error, revert back.
        setPosts((prev) =>
        prev.map((p) =>
            p.id === id
            ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
            : p
        )
        );
    }
    };
  //  COMMENTS 
  const handleCommentFile = (pid, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCommentFiles((prev) => ({
      ...prev,
      [pid]: [...(prev[pid] || []), file],
    }));
  };

    const handleCommentChange = (pid, text) => {
    setCommentInputs((prev) => ({ ...prev, [pid]: text }));
    };

    const handleCommentSubmit = async (pid) => {
    const token = authData?.token;
    const uid = authData?.uid;
    if (!token) return alert("Please log in to comment.");

    const text = commentInputs[pid]?.trim();
    if (!text && (!commentFiles[pid] || commentFiles[pid].length === 0))
        return;

    const formData = new FormData();
    formData.append("content", text);
    formData.append("user_id", uid);
    commentFiles[pid]?.forEach((file) => formData.append("files", file));

    try {
        const res = await fetch(`${API_URL}/posts/${pid}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        });
        if (!res.ok) throw new Error("Failed to comment");
        const newComment = await res.json();

        setPosts((prev) =>
        prev.map((p) =>
            p.id === pid
            ? { ...p, comments: [...p.comments, newComment] }
            : p
        )
        );
        setCommentInputs((prev) => ({ ...prev, [pid]: "" }));
        setCommentFiles((prev) => ({ ...prev, [pid]: [] }));
    } catch (err) {
        console.error("Comment failed:", err);
    }
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
      setPosts(prev => [
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

          images: Array.isArray(created.images)
            ? created.images.map(img => ({
                ...img,
                path: normalizeFilePath(img.path)
              }))
            : [],
        },
        ...prev,
      ]);
      setNewPost("");
      setPendingFiles([]);
    } catch (err) {
      console.error("Error posting:", err);
    }
  };

  // Edit
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

  // Delete
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

  // Report
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
      {/* left */}
      <div className="flex-1 pr-6 border-r border-gray-300">
        {/* Search */}
        <div className="relative mb-5">
          <div className="flex items-center bg-white border rounded-full px-4 py-2 shadow-sm">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder={t("tagsPage.searchPlaceholder")}
              value={search}
              onFocus={() => setIsTyping(true)}      
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
              {suggestions.map((tag, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectTag(tag.name)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  #{tag.name}{" "}
                  <span className="text-gray-400 text-sm">
                    ({tag.count} {t("tagsPage.postsCount")})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post box */}
        <div className="flex flex-col gap-3 mb-6 p-4 rounded-xl bg-[#fdfaf6] shadow-sm">
          <input
            type="text"
            placeholder={t("tagsPage.postWithTag", { tag: tagName })}
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
              <Send className="w-4 h-4" /> {t("board.postButton")}
            </button>
          </div>
        </div>

        {/* Post */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              {t("tagsPage.noPostsForTag")}
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
                    src={p.profile_image ? normalizeFilePath(p.profile_image) : "/images/default.jpg"}
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
                            <Edit className="w-4 h-4" /> {t("post.edit")}
                            </button>

                            <button
                            onClick={() => handleDeletePost(p.id)}
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

                {/* Post content */}
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

                {/* Photo / Video / PDF */}
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
                                src={img.path}
                                alt=""
                                className="w-44 h-44 object-cover rounded-lg border hover:opacity-80"
                                onClick={() => setPreviewImage(img.path)}
                            />
                            )}
                            {isVid && (
                            <video
                                src={img.path}
                                controls
                                className="w-64 h-40 rounded-lg border bg-black"
                            />
                            )}
                            {isPdf && (
                            <a
                                href={img.path}
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

                {/* Like / Comment button */}
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

                {/* COMMENTS SECTION */}
                {openComments[p.id] && (
                <div className="mt-3 space-y-2">
                    {p.comments.map((c, i) => (
                    <div key={i} className="flex gap-2 ml-6 items-start">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        <img
                          src={
                            c.profile_image
                              ? normalizeFilePath(c.profile_image)
                              : "/images/default.jpg"
                          }
                            alt={c.username}
                            className="w-full h-full object-cover"
                        />
                        </div>

                        <div className="flex-1 p-2 rounded-lg bg-[#fff6ee] relative">
                        {c.username === currentUser?.username ? (
                            <button
                              onClick={() => {
                                setDeleteTarget({ pid: p.id, cid: c.cid });
                                setDeleteCommentOpen(true);
                              }}
                            className="absolute top-1 right-1 text-gray-400 hover:text-red-600"
                            title="Delete comment"
                            >
                            <Trash className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <button
                              onClick={() => {
                                setReportTarget(c.cid);
                                setReportCommentOpen(true);
                              }}
                            className="absolute top-1 right-1 text-gray-400 hover:text-amber-600"
                            title="Report comment"
                            >
                            <Flag className="w-3.5 h-3.5" />
                            </button>
                        )}

                        <span className="font-medium text-xs block">{c.username}</span>
                        <p className="text-sm text-slate-800 leading-relaxed">
                            {c.comment_text || c.comment || c.text || c.content || "(no text)"}
                        </p>

                        {c.files && c.files.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                            {c.files.map((file, j) => {
                                const type = file.file_type || "";
                                const path = file.path;
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
                            {c.minutes ? `${c.minutes} min ago` : formatTimeAgo(c.created_at)}
                        </span>
                        </div>
                    </div>
                    ))}

                    {/* Comment box */}
                    <div className="flex gap-2 ml-6 items-center">
                    {/* Attach File Button */}
                    <div className="flex items-center gap-3">
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

                    {/* Message box */}
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

                    {/* Send button */}
                    <button
                        onClick={() => handleCommentSubmit(p.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded-full text-sm hover:bg-green-700"
                    >
                        {t("board.send")}
                    </button>
                    </div>

                    {/* Show attachments before sending */}
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
            ))
          )}
        </div>
      </div>

      {/* right */}
      <div className="w-72 pl-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">{t("tagsPage.trending")}</h3>
        <ol className="list-decimal pl-5 space-y-1 text-gray-700">
          {trending.map((tag, i) => (
            <li
              key={i}
              className="cursor-pointer hover:text-green-700"
              onClick={() => handleSelectTag(tag.name)}
            >
              #{tag.name}{" "}
              <span className="text-gray-400 text-sm">
                ({tag.count} {t("tagsPage.postsCount")})
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

      <DeleteCommentModal
      open={deleteCommentOpen}
      onClose={() => setDeleteCommentOpen(false)}
      onConfirm={() => {
        handleDeleteComment(deleteTarget.pid, deleteTarget.cid);
        setDeleteCommentOpen(false);
      }}
    />

    <ReportCommentModal
      open={reportCommentOpen}
      onClose={() => setReportCommentOpen(false)}
      commentId={reportTarget}
      onSubmit={({ commentId, reason }) => {
        handleReportComment(commentId, reason);
        setReportCommentOpen(false);
      }}
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
