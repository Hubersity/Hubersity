import React, { useState, useEffect} from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {Heart, MessageCircle } from "lucide-react";

const MOCK_USER = {
    username: "zaza123",   // as same as user id
    fullName: "Zaza",
    avatar: "/images/default-avatarzaza.png",
    bio: "Student, likes memes",
    numberOfReports: 12,
    reportCategories: { "Harassment": 11, "Spam": 1 },
    action: "Ban",
    status: "Pending",
};
  
const MOCK_USER_POSTS = Array.from({ length: 27 }).map((_, i) => ({
    id: String(203 + i),
    content: `Example post content #${203 + i}`,
    createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 6).toISOString(),
    likes: Math.floor(Math.random() * 100),
    comments: Math.floor(Math.random() * 10),
    status: i % 4 === 0 ? "Removed" : "Active",
    createdAt: "2025-10-10T20:00:00Z",
}));

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


export default function UserDetail() {
    const navigate = useNavigate();

    const { username } = useParams(); // /app_admin/user/:username
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [action, setAction] = useState(""); // chosen action
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    const PAGE_SIZE = 3;
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function loadInitial() {
          setLoading(true);
          setError(null);
          setOffset(0);   // setOffset(0) → รีเซ็ตการนับโพสต์ (เริ่มหน้าแรก)
          try {
            await new Promise(r => setTimeout(r, 200)); // simulate latency
            const profile = MOCK_USER;
            const page = MOCK_USER_POSTS.slice(0, PAGE_SIZE);   //ดึงโพสต์หน้าแรกจำนวน PAGE_SIZE
            if (cancelled) return;  //ถ้าผู้ใช้ “เปลี่ยนหน้าไปก่อนโหลดเสร็จ” → หยุดเลย ไม่ต้อง setState
            setUser(profile);
            setPosts(page);
            setHasMore(MOCK_USER_POSTS.length > PAGE_SIZE);   //ตรวจว่ามีโพสต์มากกว่าที่โหลดมาไหม
          } 
          catch (e) {
            console.error(e);
            if (!cancelled) setError("Failed to load user posts");
          } 
          finally {
            if (!cancelled) setLoading(false);
          }
        }
        loadInitial();
        return () => { cancelled = true; };
    }, [username]);

    // โหลดโพสต์เพิ่ม
    async function handleLoadMore() {
        if (loadingMore) return;
        setLoadingMore(true);
        setError(null);
        try {
          const nextOffset = offset + PAGE_SIZE;   // offset คือ ตำแหน่งโพสต์ล่าสุดที่โหลดถึง (0+8) next time start with post 8
          await new Promise(r => setTimeout(r, 200));
          const page = MOCK_USER_POSTS.slice(nextOffset, nextOffset + PAGE_SIZE);
          setPosts(prev => [...prev, ...page]);  // เพิ่มโพสต์ใหม่เข้าไปต่อท้ายโพสต์เก่าที่มีอยู่แล้วใน state
          setOffset(nextOffset);
          setHasMore(MOCK_USER_POSTS.length > nextOffset + PAGE_SIZE);   // เช็กว่ามีโพสต์เหลืออีกไหม ไว้ใช้ตัดสินใจว่า จะแสดงปุ่ม “Load more” ต่อไหม
        } 
        catch (e) {
          console.error(e);
          setError("Failed to load more posts");
        } 
        finally {
          setLoadingMore(false);
        }
    }

    async function handleUpdate() {
        // when update it will send the action and the message to backend
        if (!action) {
            alert("Please choose an action first");
            return;
            // alert() ใช้แสดง “popup message
        }
        setSaving(true);
        try {
            // จำลองการหน่วงเวลา
            await new Promise((r) => setTimeout(r, 500));
            // await fetch(`/api/admin/report/${post.id}/action`, {
            //     method: 'POST',
            //     body: JSON.stringify({ action, message }),
            //   });

            // Update the post data in UI
            setPost((prev) => ({
                ...prev,
                action: action,      // keep the chosen category
                status: "Resolved",  // mark as Resolved after update
            }));

            // setPost คือการเปลี่ยนค่า post ใน state->prev
            // (prev) => ({  ...prev,  ช้ค่าปัจจุบันของ post (ที่ React ส่งให้ในชื่อ prev) แล้วคืนค่าใหม่กลับไปให้ React เก็บ.
            alert("Action sent");  // tell admin that ส่งคำสั่งเรียบร้อยแล้ว
        }
        catch (e) {
            console.error(e);
            alert("Failed to send action");
        }
        finally {
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

    if (loading) return <div className="p-6">Loading user posts…</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;
// className="w-full border rounded-full pl-10 pr-4 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-[#e0ebe2] appearance-none hover:bg-[#f6faf7]"
    return(
        <div className="p-6">
            <div className="flex flex-row">
                <div className="mb-6 gap-4">
                    <button onClick={() => navigate(-1)} className="px-3 py-1 text-xl mr-4">←</button>
                </div>
                {/* choose action */}
                <div className="flex items-center w-[50vw] h-[10vh] bg-[#fdfaf6] rounded-xl shadow-2xl p-4">
                    <div className="flex flex-row">
                        <h3 className="text-xl mb-4">Action</h3>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="w-[20vw] h-[4vh] border rounded-full pl-5 ml-4 focus:ring-2 focus:ring-[#e0ebe2] appearance-none hover:bg-[#f6faf7]"
                        >
                            <option value="">Choose action</option>
                            <option value="Warn">Ban</option>
                            <option value="Delete">Report 1 month</option>
                            <option value="Hide">Report 1 week</option>
                            <option value="Hide">Report 1 year</option>
                            <option value="Hide">Delete this account</option>
                        </select>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Send the message to warn user"
                            className="w-[20vw] h-[8vh]border rounded ml-4"
                        />
                    </div>
                </div>
                {/* update */}
                <div className="flex justify-center">
                    <motion.button
                        type="button"
                        onClick={handleUpdate}
                        disabled={saving || !action}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 w-[20vw] h-[5vh] bg-[#e0ebe2] text-xl rounded-full mt-4 ml-12"
                    >
                        {saving ? "Saving..." : "Update"}
                    </motion.button>
                </div>
            </div>
            {/* profile */}
            <div className="flex flex-col items-center gap-4 mb-6 mt-12">
                <img src={user.avatar} alt={user.username} className="w-14 h-14 rounded-full object-cover" />
                    <div>
                        <div className="text-lg font-semibold ml-12">{user.fullName || user.username}</div>
                        <div className="text-sm text-gray-500 ml-9">@{user.username}</div>
                        {user.bio && <div className="text-sm mt-1 text-gray-700">{user.bio}</div>}
                    </div>
            </div>
            {/* post and detail report*/}
            <div className="flex flex-row">
                <div className="w-3/4 bg-[#fdfaf6] rounded shadow divide-y">
                    {posts.length === 0 && <div className="p-6 text-gray-500">No posts found</div>}
                    {posts.map(post => (
                    <div key={post.id} className="p-4 hover:bg-[#fff8f0] flex">
                        <div className="flex-1">
                        <div className="text-sm text-gray-500">{timeAgo(post.createdAt)}</div>
                        <div className="mt-1 text-gray-800">{post.content}</div>
                        <div className="mt-3 text-sm text-gray-600 flex gap-4">
                            <Heart /> {post.likes}
                            <MessageCircle /> {post.comments}
                        </div>
                        </div>
                    </div>
                    ))}
                </div>

                <div className="w-[25vw] h-[40vh] bg-[#fdfaf6] rounded-xl shadow-2xl ml-[2vw]">
                    <div className="flex flex-col h-full ml-4">
                        <h1 className="mt-4 text-xl">Number of reports</h1>
                        <div className="flex justify-center items-center h-full -mt-6">
                            <div className="text-6xl font-bold">
                                {user.numberOfReports}
                            </div>
                        </div>
                        <h1 className="text-xl">Category of reports</h1>
                        <div dangerouslySetInnerHTML={{ __html: formatCategories(user.reportCategories) }} className="mb-4" />
                    </div>
                </div>
            </div>

            <div className="mt-4 flex justify-center">
                {hasMore ? (
                <button onClick={handleLoadMore} disabled={loadingMore} className="px-4 py-2 border rounded">
                    {loadingMore ? "Loading…" : "Load more"}
                </button>
                ) : (
                <div className="text-sm text-gray-500">No more posts</div>
                )}
            </div>
        </div>
    );
};
  