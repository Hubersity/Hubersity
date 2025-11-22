import React, { useState, useEffect} from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {Heart, MessageCircle } from "lucide-react";

const API_URL = `http://localhost:8000`; 

// Convert category object to text
function formatCategories(categorises) {
    // Object.entries() converts an Object into an array of key, value pairs.
    return Object.entries(categorises)
    .map(([reason, count]) => `${reason}: ${count} report${count > 1 ? "s" : ""}`)
    .join("<br />");   // Combine arrays into a single string separated by commas and spaces.
}

// Calculate the elapsed time
function timeAgo(time_) {
    // new Date(isoString).getTime() our custom time (such as posting time), Date.now() the current time now.
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
    const [allPosts, setAllPosts] = useState([]);
    const PAGE_SIZE = 3;
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);


    useEffect(() => {
        let cancelled = false;
        async function loadInitial() {
            setLoading(true);
            setError(null);
            setOffset(0);
            try {
                const res = await fetch(`${API_URL}/admin/reports/users/${username}`);
                if (!res.ok) throw new Error("Failed to fetch user data");
                const data = await res.json();

                if (cancelled) return;

                setUser({
                    uid: data.uid,
                    username: data.username,
                    fullName: data.fullName,
                    avatar: data.avatar,
                    bio: data.bio,
                    numberOfReports: data.numberOfReports,
                    reportCategories: data.reportCategories,
                    action: data.action,
                    status: data.status,
                });
                setAllPosts(data.posts);
                setPosts(data.posts.slice(0, PAGE_SIZE));

                setPosts(data.posts.slice(0, PAGE_SIZE));
                setOffset(PAGE_SIZE);
                setHasMore(data.posts.length > PAGE_SIZE);
            } catch (e) {
                console.error(e);
                if (!cancelled) setError("Failed to load user posts");
            } finally {
                if (!cancelled) setLoading(false);
            }
            }

        loadInitial();
        return () => { cancelled = true; };
    }, [username]);


    // Load more posts
    async function handleLoadMore() {
        if (loadingMore) return;
        setLoadingMore(true);
        setError(null);
        try {
          const nextOffset = offset + PAGE_SIZE;   // Offset is the last post position loaded to (0+8), next time start with post 8.
          await new Promise(r => setTimeout(r, 200));
          const page = allPosts.slice(nextOffset, nextOffset + PAGE_SIZE);
          setPosts(prev => [...prev, ...page]);  // Add a new post to the end of an existing post in the state.
          setOffset(nextOffset);
          setHasMore(allPosts.length > nextOffset + PAGE_SIZE);   // Check if there are any more posts left to decide whether to continue showing the “Load more” button.
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
        if (!user) return;

        if (!action) {
            alert("Please choose an action first");
            return;
        }

        setSaving(true);

        try {
            await new Promise((r) => setTimeout(r, 500));

            if (action === "Ban1w") {
            const res = await fetch(`${API_URL}/admin/users/${user.uid}/ban`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify({ reason: message, duration: "1w" })
            });

            if (!res.ok) {
                throw new Error("Failed to ban user");
            }

            alert("User banned successfully");
            setUser((prev) => ({
                ...prev,
                action: "Ban",
                status: "Banned"
            }));
            return;
            }

            if (action === "Ban1m") {
            const res = await fetch(`${API_URL}/admin/users/${user.uid}/ban`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify({ reason: message, duration: "1m" })
            });

            if (!res.ok) {
                throw new Error("Failed to ban user");
            }

            alert("User banned successfully");
            setUser((prev) => ({
                ...prev,
                action: "Ban",
                status: "Banned"
            }));
            return;
            }

            if (action === "Ban1y") {
            const res = await fetch(`${API_URL}/admin/users/${user.uid}/ban`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify({ reason: message, duration: "1y" })
            });

            if (!res.ok) {
                throw new Error("Failed to ban user");
            }

            alert("User banned successfully");
            setUser((prev) => ({
                ...prev,
                action: "Ban",
                status: "Banned"
            }));
            return;
            }

            if (action === "Unban") {
            const res = await fetch(`${API_URL}/admin/users/${user.uid}/unban`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                throw new Error("Failed to unban user");
            }

            alert("User unbanned successfully");
            setUser((prev) => ({
                ...prev,
                action: "Unban",
                status: "Active"
            }));
            return;
            }

            // Other actions like "Warn", "Report", etc.
            await fetch(`${API_URL}/admin/users/${user.uid}/action`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ action, message })
            });

            setUser((prev) => ({
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
    );  // navigate(-1) go back 1 page

    if (loading) return <div className="p-6">Loading user posts…</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;

    
    return (
    <div className="p-6">
        {/* top row: back button + action + update */}
        <div className="flex flex-row items-start gap-x-6 mb-6">
        {/* back button */}
        <div className="mb-6">
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
                    <option value="Ban1w">Ban account for 1 week</option>
                    <option value="Ban1m">Ban account for 1 month</option>
                    <option value="Ban1y">Ban account for 1 year</option>
                    <option value="Hide">Delete this account</option>
                    <option value="Unban">Unban</option>
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
        <motion.button
            type="button"
            onClick={handleUpdate}
            disabled={saving || !action}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 w-[20vw] h-[5vh] bg-[#e0ebe2] text-xl rounded-full mt-4"
        >
            {saving ? "Saving..." : "Update"}
        </motion.button>
        </div>

        {/* profile */}
        <div className="flex items-center gap-6 mb-6 mt-12">
        <img src={`${API_URL}${user.avatar}`} alt={user.username} className="w-14 h-14 rounded-full object-cover" />
        <div>
            <div className="text-lg font-semibold">{user.fullName || user.username}</div>
            <div className="text-sm text-gray-500">@{user.username}</div>
            {user.bio && <div className="text-sm mt-1 text-gray-700">{user.bio}</div>}
        </div>
        </div>

        {/* post and detail report */}
        <div className="flex gap-6">
        {/* post list */}
        <div className="flex-1 bg-[#fdfaf6] rounded shadow divide-y">
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

        {/* report summary */}
        <div className="w-[300px] h-[40vh] bg-[#fdfaf6] rounded-xl shadow-2xl p-6">
            <h1 className="text-xl mb-10">Number of reports</h1>
            <div className="text-6xl font-bold text-center mb-10">{user.numberOfReports}</div>
            <h1 className="text-xl mb-2">Category of reports</h1>
            <div dangerouslySetInnerHTML={{ __html: formatCategories(user.reportCategories) }} />
        </div>
        </div>

        {/* load more */}
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
}
  