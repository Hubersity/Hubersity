import { useState, useRef } from "react";
import { Paperclip, Image, Video, Search, X, Heart, MessageCircle } from "lucide-react";

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
  const [posts, setPosts] = useState(initialPosts);
  const [newPost, setNewPost] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("university");
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});

  // refs สำหรับ input file
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handlePost = () => {
    if (newPost.trim() === "") return;
    const newEntry = {
      id: posts.length + 1,
      user: "You",
      text: newPost,
      minutes: 0,
      likes: 0,
      comments: [],
      category: activeTab,
    };
    setPosts([newEntry, ...posts]);
    setNewPost("");
  };

  const handleLike = (id) => {
    setPosts(posts.map(p => 
      p.id === id 
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } 
        : p
    ));
  };

  const handleToggleComment = (id) => {
    setOpenComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComment = (postId) => {
    if (!commentInputs[postId]?.trim()) return;

    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments, 
            { user: "You", text: commentInputs[postId], minutes: 0 }
          ]
        };
      }
      return p;
    }));

    setCommentInputs({ ...commentInputs, [postId]: "" });
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const newEntry = {
      id: posts.length + 1,
      user: "You",
      text: `Uploaded a ${type}: ${file.name}`,
      minutes: 0,
      likes: 0,
      comments: [],
      category: activeTab,
    };
    setPosts([newEntry, ...posts]);
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.category === activeTab &&
      p.text.toLowerCase().includes(search.toLowerCase())
  );

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

        {/* ปุ่ม Upload File */}
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

        {/* ปุ่ม POST วงกลม */}
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
            {/* โปรไฟล์ */}
            <div className="flex flex-col items-center justify-start w-20">
              <span className="text-xs font-medium mb-2">{p.user}</span>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                <img src={userProfiles[p.user]} alt={p.user} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* กล่องโพสต์ */}
            <div className="flex-1 rounded-lg shadow p-4 bg-[#fdfaf6]">
              <p className="text-slate-800">{p.text}</p>

              {/* ปุ่ม Like / Comment */}
              <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-4">
                  <button onClick={() => handleLike(p.id)} className={`flex items-center gap-1 ${p.liked ? "text-red-600" : "hover:text-red-600"}`}>
                    <Heart className="w-4 h-4" fill={p.liked ? "red" : "none"} /> {p.likes}
                  </button>
                  <button
                    onClick={() => handleToggleComment(p.id)}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    <MessageCircle className="w-4 h-4" /> {p.comments.length}
                  </button>
                </div>
                <div className="text-slate-400 text-xs">post {p.minutes} minute ago…</div>
              </div>

              {/* แสดงคอมเมนต์ */}
              {openComments[p.id] && (
                <div className="mt-3 space-y-2">
                  {p.comments.map((c, i) => (
                    <div key={i} className="flex gap-2 ml-6 items-center">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        <img src={userProfiles[c.user]} alt={c.user} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 p-2 rounded-lg bg-[#fff6ee] relative">
                        {/* ชื่อ */}
                        <span className="font-medium text-xs block">{c.user}</span>
                        {/* ข้อความคอมเมนต์ */}
                        <p className="text-sm text-slate-800">{c.text}</p>
                        {/* เวลา */}
                        <span className="absolute bottom-1 right-2 text-xs text-gray-400">
                          post {c.minutes} minute ago…
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* ช่องพิมพ์คอมเมนต์ */}
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