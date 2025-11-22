import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = `http://localhost:8000`; 


// Convert category object to text
function formatCategories(categories) {
  return Object.entries(categories)
    .map(
      ([reason, count]) =>
        `${reason}: ${count} report${count > 1 ? "s" : ""}`
    )
    .join("<br />");
}


// Calculate the elapsed time
function timeAgo(time_) {
  const then = new Date(time_).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return `${diffSec} sec ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hours ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}


export default function CommentDetail() {
  // The route must be /app_admin/report/comment/:commentId
  const { commentId } = useParams();
  const navigate = useNavigate();

  const [comment, setComment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    async function fetchCommentDetail() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/admin/reports/comment/${commentId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const found = await response.json();

        const formatted = {
          id: String(found.id),
          user_id: found.user_id || found.uid || null,
          author: found.username || "-",
          avatar: found.avatar || "/images/default-avatar.png",
          content: found.content || "-",
          createdAt: found.createdAt || new Date().toISOString(),
          lastReportDate: found.lastReportDate || "-",
          numberOfReports: found.numberOfReports || 0,
          reportCategories: found.reportCategories || {},
          status: found.status
            ? found.status.charAt(0).toUpperCase() + found.status.slice(1).toLowerCase()
            : "Pending",
          action: found.action || ""
        };

        setComment(formatted);
      } catch (err) {
        console.error("Error fetching comment detail:", err);
        setError("Failed to load comment data.");
      } finally {
        setLoading(false);
      }
    }

    fetchCommentDetail();
  }, [commentId]);


  // Mock handleUpdate does not call the actual API.
  async function handleUpdate() {
    if (!comment) return;
    if (!action) {
      alert("Please choose an action first");
      return;
    }

    setSaving(true);

    try {
      await new Promise((r) => setTimeout(r, 500));

      if (action === "Delete") {
        const res = await fetch(`${API_URL}/admin/comments/${comment.id}`, {
          method: "DELETE"
        });
        if (!res.ok) throw new Error("Failed to delete comment");

        alert("Comment deleted successfully");
        setComment(null);
        window.location.href = "/app_admin/report";
        return;
      }

      if (action === "Ban") {
        const res = await fetch(`${API_URL}/admin/users/${comment.user_id}/ban`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: message, duration: "1w" })
        });
        if (!res.ok) throw new Error("Failed to ban user");

        alert("User banned successfully");
        setComment((prev) =>
          prev ? { ...prev, action: "Ban", status: "Banned" } : prev
        );
        return;
      }

      // default case (e.g. Warn or other actions)
      setComment((prev) =>
        prev ? { ...prev, action, status: "Resolved" } : prev
      );
      alert("Action sent");
    } catch (e) {
      console.error(e);
      alert("Failed to send action");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading comment...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Back
        </button>
      </div>
    );
  }


  // UI
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1 text-xl"
        >
          ←
        </button>
        <h2 className="text-2xl font-semibold">
          Comment ID: #{comment.id}
        </h2>
      </div>

      <div className="flex flex-row">
        {/* picture */}
        <div className="flex flex-col items-center justify-start w-20">
          <span className="text-xs font-medium mb-2">{comment.author}</span>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
            <img
              src={comment?.avatar ? `${API_URL}${comment.avatar}` : "/images/default-avatar.png"}
              alt={comment.author}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* content */}
        <div className="flex-1 rounded-lg shadow p-4 bg-[#fdfaf6]">
          <div className="flex flex-row justify-between items-center">
            <div className="text-slate-800">{comment.content}</div>
            <div className="text-sm text-gray-500">
              {timeAgo(comment.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* last report + action + status + number of reports */}
      <div className="flex flex-row mt-4 gap-4 items-start">
        {/* Left: last date + action box */}
        <div className="flex flex-col w-[25vw] gap-4">
          <div className="w-full h-[14vh] bg-[#fdfaf6] rounded-xl shadow-2xl p-4">
            <h1 className="mt-1 text-xl">Last date of report comment</h1>
            <div className="flex justify-center items-center h-full -mt-4">
              <div className="text-xl font-bold">{comment.lastReportDate}</div>
            </div>
          </div>

          {/* Action box */}
          <div className="w-[50vw] h-[30vh] bg-[#fdfaf6] rounded-xl shadow-2xl p-4 mt-12">
            <h3 className="text-lg font-medium mb-3">Action</h3>

            <label className="block mb-2 text-sm">Choose action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full border rounded-full pl-5 px-3 py-2 mb-3 focus:ring-2 focus:ring-[#e0ebe2] appearance-none hover:bg-[#f6faf7]"
            >
              <option value="">Choose action</option>
              <option value="Delete">Delete comment</option>
              <option value="Ban">Ban User</option>
            </select>

            <label className="block mb-2 text-sm">
              Message to user (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send the message to warn user"
              className="w-full border rounded px-3 py-2 min-h-[80px] resize-y"
            />
          </div>
        </div>

        {/* Middle: status */}
        <div className="w-[25vw] h-[14vh] bg-[#fdfaf6] rounded-xl shadow-2xl p-4 flex flex-col justify-center items-center">
          <h1 className="text-xl">Status</h1>
          <div className="text-xl font-bold mt-2">{comment.status}</div>
        </div>

        {/* Right: number of reports + Update button */}
        <div className="w-[25vw] h-[50vh] bg-[#fdfaf6] rounded-xl shadow-2xl ml-[2vw]">
          <div className="flex flex-col h-full ml-4">
            <h1 className="mt-4 text-xl">Number of reports</h1>
            <div className="flex justify-center items-center h-full -mt-6">
              <div className="text-6xl font-bold">
                {comment.numberOfReports}
              </div>
            </div>
            <h1 className="text-xl">Category of reports</h1>
            <div
              dangerouslySetInnerHTML={{
                __html: formatCategories(comment.reportCategories),
              }}
              className="mb-4"
            />
          </div>

          <div className="flex justify-center">
            <motion.button
              type="button"
              onClick={handleUpdate}
              disabled={saving || !action}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 w-[40vw] bg-[#e0ebe2] text-xl rounded-full mt-12"
            >
              {saving ? "Saving..." : "Update"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
