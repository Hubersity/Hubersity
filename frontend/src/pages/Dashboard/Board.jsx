import { useState, useRef, useEffect } from "react";
import { Paperclip, Image, Video, Search, X, Heart, MessageCircle } from "lucide-react";

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
  { id: 1, user: "aong", text: "Has anyone ever taken the ISP course?", minutes: 10, likes: 48, comments: [], category: "university" },
  { id: 2, user: "Skibidi", text: "Looking for a single woman.", minutes: 2, likes: 9, comments: [], category: "university" },
  { id: 3, user: "Pysart", text: "Share the summary file for English 2, course code 01355102-64", minutes: 32, likes: 102, comments: [], category: "university" },
];

export default function Board() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("university");
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [pendingFiles, setPendingFiles] = useState([]);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);



  // โหลดโพสต์จาก backend
  useEffect(() => {
    const fetchPosts = async () => {
      const authData = JSON.parse(localStorage.getItem("authData"));
      const token = authData?.token;
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
          minutes: 0,
          liked: p.liked,
          likes: p.like_count,
          profile_image: p.profile_image,
          comments: p.comments.map((c) => ({
            username: c.username,
            content: c.content,
            profile_image: c.profile_image,
            minutes: Math.floor((Date.now() - new Date(c.created_at)) / 60000),
          })),
          images: p.images || [],
          category: "university",
        }));

        setPosts(loaded);
      } catch (err) {
        console.error("Error loading posts:", err);
      }
    };

    fetchPosts();
  }, []);


  //  สร้างโพสต์
  const handlePost = async () => {
    if (newPost.trim() === "") return;

    try {
      const authData = JSON.parse(localStorage.getItem("authData"));
      const token = authData?.token;

      if (!token) return;

      const formData = new FormData();
      formData.append("post_content", newPost);
      formData.append("forum_id", 1);

      const res = await fetch(`${API_URL}/posts/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to create post");
      const created = await res.json();

      const newEntry = {
        id: created.pid,
        user: created.username || "You",
        text: created.post_content,
        profile_image: created.profile_image,
        minutes: 0,
        likes: 0,
        comments: [],
        images: [],
        category: "university",
      };


      setPosts((prev) => [newEntry, ...prev]);
      setNewPost("");

      // Upload pending files
      if (pendingFiles.length > 0) {
        const fileForm = new FormData();
        pendingFiles.forEach((f) => fileForm.append("files", f));

        const uploadRes = await fetch(`${API_URL}/posts/${created.pid}/upload-files`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fileForm,
        });

        if (!uploadRes.ok) throw new Error("File upload failed");
        const uploadData = await uploadRes.json();
        console.log("Files uploaded:", uploadData);
        setPendingFiles([]);
      }
    } catch (err) {
      console.error("Error posting:", err);
    }
  };

  const handleFileUpload = (e, type) => {
  const file = e.target.files[0];
  if (!file) return;
  setPendingFiles((prev) => [...prev, file]);
  e.target.value = null; // allow re-selecting same file
};



  // กด Like
  const handleLike = async (id) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const newLiked = !p.liked;
        const newLikes = newLiked ? p.likes + 1 : p.likes - 1;

        return { ...p, liked: newLiked, likes: newLikes };
      })
    );

    try {
      const authData = JSON.parse(localStorage.getItem("authData"));
      const token = authData?.token;
      if (!token) return;

      const res = await fetch(`${API_URL}/posts/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("Like response:", data);
    } catch (err) {
      console.error("Error liking:", err);
    }
  };


  // เปิด/ปิดช่องคอมเมนต์
  const handleToggleComment = (id) => {
    setOpenComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // เพิ่มคอมเมนต์
  const handleAddComment = async (postId) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    setCommentInputs({ ...commentInputs, [postId]: "" });

    try {
      const authData = JSON.parse(localStorage.getItem("authData"));
      const token = authData?.token;
      if (!token) return;

      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Failed to comment");
      const newComment = await res.json();

      // ✅ Use backend response to update comments
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: [...p.comments, {
                username: newComment.username,
                content: newComment.content,
                profile_image: newComment.profile_image,
                minutes: Math.floor((Date.now() - new Date(newComment.created_at)) / 60000),
              }] }
            : p
        )
      );

      console.log("Comment added:", newComment);
    } catch (err) {
      console.error("Error adding comment:", err);
    }
};


  // Filter ตามแท็บ
  const filteredPosts = posts.filter(
    (p) =>
      p.category === activeTab &&
      p.text.toLowerCase().includes(search.toLowerCase())
  );

  // ---------------- UI ----------------
  return (
    <div className="p-4">
      {/* Search + Tabs */}
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
            University Talk
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

      {/* New Post */}
      <div className="flex items-center gap-3 mb-6 p-3 rounded-lg shadow bg-[#fdfaf6]">
        <input
          type="text"
          placeholder="Type here what do you think..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          className="flex-1 bg-transparent outline-none px-2"
        />

        {/* Upload File */}
        <div className="flex items-center gap-5 pr-2">
          <button onClick={() => fileInputRef.current.click()} className="text-gray-500 hover:text-green-600">
            <Paperclip className="w-5 h-5" />
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={(e) => handleFileUpload(e, "file")} />

          <button onClick={() => imageInputRef.current.click()} className="text-gray-500 hover:text-green-600">
            <Image className="w-5 h-5" />
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, "image")} />

          <button onClick={() => videoInputRef.current.click()} className="text-gray-500 hover:text-green-600">
            <Video className="w-5 h-5" />
          </button>
          <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={(e) => handleFileUpload(e, "video")} />
        </div>

        {/* POST Button */}
        <button 
          onClick={handlePost} 
          className="bg-green-600 text-white px-4 py-1.5 rounded-full hover:bg-green-700 text-sm font-medium"
        >
          POST
        </button>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {filteredPosts.map((p) => (
          <div key={p.id} className="flex gap-3 items-start">
            <div className="flex flex-col items-center justify-start w-20">
              <span className="text-xs font-medium mb-2">{p.user}</span>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                <img src={`${API_URL}${p.profile_image || "/images/default-avatar.png"}`} alt={p.user} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex-1 rounded-lg shadow p-4 bg-[#fdfaf6]">
              <p className="text-slate-800">{p.text}</p>

              <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-4">
                  <button onClick={() => handleLike(p.id)} className={`flex items-center gap-1 ${p.liked ? "text-red-600" : "hover:text-red-600"}`}>
                    <Heart className="w-4 h-4" fill={p.liked ? "red" : "none"} /> {p.likes}
                  </button>
                  <button onClick={() => handleToggleComment(p.id)} className="flex items-center gap-1 hover:text-blue-600">
                    <MessageCircle className="w-4 h-4" /> {p.comments.length}
                  </button>
                </div>
                <div className="text-slate-400 text-xs">post {p.minutes} minute ago…</div>
              </div>

              {openComments[p.id] && (
                <div className="mt-3 space-y-2">
                  {p.comments.map((c, i) => (
                    <div key={i} className="flex gap-2 ml-6 items-center">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        <img src={`${API_URL}${c.profile_image || "/uploads/user/default-avatar.png"}`} alt={c.username} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 p-2 rounded-lg bg-[#fff6ee] relative">
                        <span className="font-medium text-xs block">{c.username}</span>
                        <p className="text-sm text-slate-800">{c.content}</p>
                        <span className="absolute bottom-1 right-2 text-xs text-gray-400">
                          post {c.minutes} minute ago…
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 ml-6">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[p.id] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [p.id]: e.target.value })}
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
    </div>
  );
}