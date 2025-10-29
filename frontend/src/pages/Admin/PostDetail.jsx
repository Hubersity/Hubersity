import React, { useState, useEffect} from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
// useNavigate go back to before page, useParamsอ่านค่าพารามิเตอร์จาก URL
const API_URL = `http://localhost:8000`; 
const MOCK_POSTS = [
    {
        id: "203",
        author: "zaza123",
        avatar: "/images/default-avatar.png",
        content: "Why do people from religion X have to wear that outfit on campus?",
        createdAt: "2025-10-17T12:30:00Z",
        lastReportDate: "2025-10-13",
        numberOfReports: 12,
        reportCategories: { "Harassment": 11, "Spam": 1 },
        status: "Pending",
    },
    {
        id: "204",
        author: "totototo",
        avatar: "/images/default-avatar.png",
        content: "Selling cheap cigarettes. Interested? DM me.",
        createdAt: "2025-10-15T09:00:00Z",
        lastReportDate: "2025-10-13",
        numberOfReports: 8,
        reportCategories: { "Illegal Activity": 6, "Spam": 2 },
        status: "Resolved",
    },
    {
        id: "205",
        author: "pigiti",
        avatar: "/images/default-avatar.png",
        content: "hiiiiiiiiiiiii",
        createdAt: "2025-10-14T20:00:00Z",
        lastReportDate: "2025-10-11",
        numberOfReports: 11,
        reportCategories: { "Spam": 11 },
        status: "Pending",
    },
    {
        id: "206",
        author: "dogneverdie",
        avatar: "/images/default-avatar.png",
        content: "Phone number of xxxxx is 098-xxx-xxx",
        createdAt: "2025-10-10T20:00:00Z",
        lastReportDate: "2025-10-10",
        numberOfReports: 11,
        reportCategories: { "Privacy Violation": 11 },
        status: "Resolved",
      },
  ];

// แปลง object หมวดเป็นข้อความ
function formatCategories(categorises) {
    // Object.entries()แปลง Object ให้เป็น Array ของคู่ข้อมูล (key, value)
    return Object.entries(categorises)
    .map(([reason, count]) => `${reason}: ${count} report${count > 1 ? "s" : ""}`)
    .join("<br />");   // รวม array เป็น string เดียวโดยคั่นด้วยเครื่องหมาย,และช่องว่าง
}

// คำนวณเวลาที่ผ่านมา
function timeAgo(time_) {
    // new Date(isoString).getTime() เวลาที่เรากำหนดเอง (เช่น เวลาโพสต์), Date.now()เวลาปัจจุบันตอนนี้เลย
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


export default function PostDetail() {
    const { id } = useParams(); // อ่านจาก /app_admin/report/:id
    const navigate = useNavigate();
  
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [action, setAction] = useState(""); // chosen action
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
    async function fetchPostDetail() {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/admin/reports/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const found = await response.json();

        const formatted = {
            id: String(found.id),
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

        setPost(formatted);
        } catch (err) {
        console.error("Error fetching post detail:", err);
        setError("Failed to load post data.");
        } finally {
        setLoading(false);
        }
    }

    fetchPostDetail();
    }, [id]);



    async function handleUpdate() {
        if (!post) return;

        if (!action) {
            alert("Please choose an action first");
            return;
        }

        setSaving(true);

        try {
            await new Promise((r) => setTimeout(r, 500));

            if (action === "Delete") {
            const res = await fetch(`${API_URL}/admin/posts/${post.id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                throw new Error("Failed to delete post");
            }

            alert("Post deleted successfully");
            setPost(null);
            window.location.href = "/app_admin/report"; // 👈 redirect after deletion   
            return;
            }

            // For other actions like "warn user" or "hide post"
            await fetch(`/api/admin/report/${post.id}/action`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ action, message })
            });

            setPost((prev) => ({
                ...prev,
                action: action,
                status: "Resolved"
            }));

            alert("Action sent");
        } catch (e) {
            console.error(e);
            alert("Failed to send action");
        } finally {
            setSaving(false);
        }
        }

    if (loading) {
        return <div className="p-6">Loading post...</div>;
    }
    if (error) return (
        <div className="p-6">
          <div className="text-red-600 mb-4">{error}</div>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded">Back</button>
        </div>
    );  // navigate(-1) ย้อนกลับ 1 หน้า

    // UI
    return (
        <div className="p-6">
            <div className="mb-6 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="px-3 py-1 text-xl">←</button>
                <h2 className="text-2xl font-semibold">Post ID: #{post.id}</h2>
            </div>

            <div className="flex flex-row">
                {/* picture */}
                <div className="flex flex-col items-center justify-start w-20">
                <span className="text-xs font-medium mb-2">{post.author}</span>
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                    <img src={post?.avatar ? `${API_URL}${post.avatar}` : "/images/default-avatar.png"} alt={post.author} className="w-full h-full object-cover" />
                </div>
                </div>

                {/* content */}
                <div className="flex-1 rounded-lg shadow p-4 bg-[#fdfaf6]">
                    <div className="flex flex-row justify-between items-center">
                        <div className="text-slate-800">{post.content}</div>
                        <div className="text-sm text-gray-500">{timeAgo(post.createdAt)}</div>
                    </div>
                </div>
            </div>
            {/* last report */}
            <div className="flex flex-row mt-4 gap-4 items-start">
                {/* คอลัมน์ซ้าย: last date + action box (action อยู่ใต้ last date) */}
                <div className="flex flex-col w-[25vw] gap-4">
                    <div className="w-full h-[14vh] bg-[#fdfaf6] rounded-xl shadow-2xl p-4">
                    <h1 className="mt-1 text-xl">Last date of report posts</h1>
                    <div className="flex justify-center items-center h-full -mt-4">
                        <div className="text-xl font-bold">{post.lastReportDate}</div>
                    </div>
                    </div>

                    {/* Action box อยู่ใต้ last date */}
                    <div className="w-[50vw] h-[30vh] bg-[#fdfaf6] rounded-xl shadow-2xl p-4 mt-12">
                        <h3 className="text-lg font-medium mb-3">Action</h3>

                        <label className="block mb-2 text-sm">Choose action</label>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="w-full border rounded-full pl-5 px-3 py-2 mb-3 focus:ring-2 focus:ring-[#e0ebe2] appearance-none hover:bg-[#f6faf7]"
                        > 
                            <option value="">Choose action</option>
                            {/* <option value="Warn">Warn user</option> */}
                            <option value="Delete">Delete post</option>
                            {/* <option value="Hide">Hide post</option> */}
                        </select>

                        <label className="block mb-2 text-sm">Message to user (optional)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Send the message to warn user"
                            className="w-full border rounded px-3 py-2 min-h-[80px] resize-y"
                        />
                    </div>
                </div>

                {/* คอลัมน์กลาง: status */}
                <div className="w-[25vw] h-[14vh] bg-[#fdfaf6] rounded-xl shadow-2xl p-4 flex flex-col justify-center items-center">
                    <h1 className="text-xl">Status</h1>
                    <div className="text-xl font-bold mt-2">{post.status}</div>
                </div>

                {/* คอลัมน์ขวา: number of reports + Update button ใต้ card */}
                <div className="w-[25vw] h-[50vh] bg-[#fdfaf6] rounded-xl shadow-2xl ml-[2vw]">
                        <div className="flex flex-col h-full ml-4">
                            <h1 className="mt-4 text-xl">Number of reports</h1>
                            <div className="flex justify-center items-center h-full -mt-6">
                                <div className="text-6xl font-bold">
                                    {post.numberOfReports}
                                </div>
                            </div>
                            <h1 className="text-xl">Category of reports</h1>
                            <div dangerouslySetInnerHTML={{ __html: formatCategories(post.reportCategories) }} className="mb-4" />
                        </div>

                    {/* Update button อยู่ด้านล่าง card */}
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