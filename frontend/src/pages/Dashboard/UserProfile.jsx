// ✅ UserProfile.jsx (เวอร์ชันแก้ไขไฟนอล)
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Lock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "http://localhost:8000";

// 🕒 ฟังก์ชันแสดงเวลาแบบ Board
function formatTimeAgo(createdAt) {
  if (!createdAt) return "--";

  const now = new Date();
  const postTime = new Date(createdAt);
  const diffMs = now - postTime;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return `${diffSec} sec ago`;
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;

  return postTime.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [studyTime, setStudyTime] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [authData, setAuthData] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // ✅ โหลด token จาก localStorage
  useEffect(() => {
    const loadAuth = () => {
      const currentKey = localStorage.getItem("currentUserKey");
      const data = currentKey
        ? JSON.parse(localStorage.getItem(currentKey) || "{}")
        : null;

      if (data?.token) {
        setAuthData(data);
        if (String(userId) === String(data.uid)) {
          navigate("/app/account", { replace: true });
        }
      } else {
        setTimeout(loadAuth, 200);
      }
    };

    loadAuth();
  }, [userId, navigate]);

  // ✅ ดึงข้อมูล user + posts
  useEffect(() => {
    if (!authData?.token) return;

    const fetchUserData = async () => {
      try {
        const res = await fetch(`${API_URL}/users/${encodeURIComponent(userId)}`, {
          headers: { Authorization: `Bearer ${authData.token}` },
        });

        if (!res.ok) {
          if (res.status === 401) setError("Authentication expired. Please log in again.");
          else if (res.status === 404) setError(`User id:${userId} was not found.`);
          else setError("Failed to fetch user data");
          return;
        }

        const data = await res.json();
        setUser(data);

        if (data.privacy === "public") {
          const postsRes = await fetch(`${API_URL}/posts/${userId}/posts`, {
            headers: { Authorization: `Bearer ${authData.token}` },
          });
          if (postsRes.ok) setPosts(await postsRes.json());
          const localStudy = JSON.parse(localStorage.getItem("study_today") || "{}");
          setStudyTime(localStudy);
        }
      } catch (err) {
        console.error("❌ Error fetching user data:", err);
        setError("Failed to load user data.");
      }
    };

    fetchUserData();
  }, [authData, userId]);

  if (error)
    return <div className="p-10 text-center text-red-500">Failed to load user: {error}</div>;
  if (!authData)
    return <div className="p-10 text-center text-gray-500">Preparing authentication...</div>;
  if (!user)
    return <div className="p-10 text-center text-gray-600">Loading user profile...</div>;

  const age = user.birthdate
    ? new Date().getFullYear() - new Date(user.birthdate).getFullYear()
    : "N/A";

  const profileImg = user.profile_image
    ? `${API_URL}${user.profile_image}`
    : "/images/default-avatar.png";

  return (
    <div className="flex flex-col items-center bg-white min-h-[calc(100vh-64px)] py-10 relative">
      {/* 🟩 กล่องโปรไฟล์ */}
      <div className="bg-white shadow-lg rounded-[24px] w-[90%] max-w-6xl px-12 py-12 text-center">
        <div className="flex justify-center gap-5 mb-6">
          {["Follow", "Block", "Report"].map((btn, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2 rounded-[10px] font-medium shadow-sm text-sm hover:shadow-md transition-all text-white ${
                btn === "Follow"
                  ? "bg-[#32a349]"
                  : btn === "Block"
                  ? "bg-[#ea4124]"
                  : "bg-[#a6a6a6]"
              }`}
            >
              {btn}
            </motion.button>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <motion.div
            whileHover={{
              scale: 1.08,
              rotate: 3,
              boxShadow: "0 0 30px rgba(50,163,73,0.35)",
            }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="rounded-full p-[4px] bg-gradient-to-tr from-[#32a349]/40 to-[#86efac]/30 cursor-pointer"
            onClick={() => setShowModal(true)}
          >
            <motion.img
              src={profileImg}
              alt={user.name}
              className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
            />
          </motion.div>

          <h2 className="text-xl font-semibold mt-3 text-gray-800">{user.name}</h2>
          <p className="text-gray-600 text-sm">Age: {age}</p>
          <p className="mt-1 text-gray-700 text-center max-w-md leading-relaxed text-sm">
            {user.description || "No bio provided."}
          </p>
        </div>
      </div>

      {/* 🟨 ส่วนล่าง */}
      {user.privacy === "private" ? (
        <div className="mt-10 flex flex-col items-center justify-center bg-[#efecec] p-14 rounded-[22px] text-gray-700 shadow-inner w-[92%] max-w-6xl min-h-[200px]">
          <Lock size={56} className="text-gray-500 mb-3" />
          <p className="text-lg font-medium tracking-wide">This account is private</p>
        </div>
      ) : (
        <div className="mt-10 bg-[#fff9ef] rounded-[20px] w-[90%] max-w-6xl p-10 shadow-inner">
          <div className="grid grid-cols-3 gap-8 items-start">
            <div className="col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">History</h3>
              {posts.length > 0 ? (
                posts.map((p) => (
                  <motion.div
                    key={p.pid}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#fffaf3] p-4 rounded-lg mb-3 border border-[#f2e0ca] hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedPost(p)}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-gray-800 font-medium">{p.post_content}</p>
                      <span className="text-sm text-gray-500 mt-[2px]">
                        {formatTimeAgo(p.created_at)}
                      </span>
                    </div>

                    {/* แสดงรูปหรือไฟล์แนบ */}
                    {p.images && p.images.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {p.images.map((img, idx) =>
                          img.path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                              key={idx}
                              src={`${API_URL}${img.path}`}
                              alt="attachment"
                              className="w-28 h-28 object-cover rounded-md border cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage(`${API_URL}${img.path}`);
                              }}
                            />
                          ) : (
                            <a
                              key={idx}
                              href={`${API_URL}${img.path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              📎 {img.path.split("/").pop()}
                            </a>
                          )
                        )}
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-500 italic">No posts yet.</p>
              )}
            </div>

            {/* Study Time */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center bg-[#fffdf9] p-6 rounded-[16px] shadow-md w-[200px] border border-[#f7dfc4]">
                <img
                  src={studyTime?.image || "/images/ts_l0-rebg.png"}
                  alt="study-status"
                  className="w-20 h-20 object-contain mb-2"
                />
                <h4 className="text-md font-semibold text-gray-700">Study Today</h4>
                <p className="text-xl font-bold text-[#e65a2c] mt-1">
                  {studyTime?.time || "00:00:00"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🪩 Modal ขยายรูปโปรไฟล์ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 flex justify-end bg-black/40 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <div
              className="w-[calc(100%-240px)] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
                className="relative"
              >
                <motion.img
                  src={profileImg}
                  alt="Zoomed profile"
                  className="rounded-[20px] w-[350px] h-[350px] object-cover shadow-2xl border-4 border-white"
                />
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-3 right-3 bg-white/70 hover:bg-white text-gray-800 p-2 rounded-full shadow-md"
                >
                  <X size={20} />
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🪩 Modal แสดงรายละเอียดโพสต์ */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 150, damping: 15 }}
              className="relative bg-white/90 backdrop-blur-xl border border-[#e0e0e0]/60 rounded-[24px] shadow-2xl w-[460px] p-8 overflow-hidden"
            >
              <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[#a6f5c2]/30 via-[#fff5d6]/30 to-[#ffd6d6]/30 pointer-events-none blur-xl opacity-70"></div>

              <motion.div className="relative z-10 text-center">
                <h3 className="text-xl font-semibold text-[#333] mb-4 flex items-center justify-center gap-2">
                  🪶 Post Detail
                </h3>

                <p className="text-gray-800 leading-relaxed text-base bg-white/50 rounded-xl px-4 py-3 border border-[#f0e8d8]/70 shadow-inner">
                  {selectedPost.post_content}
                </p>

                {selectedPost.images && selectedPost.images.length > 0 && (
                  <div className="mt-4 flex flex-col items-center gap-3">
                    {selectedPost.images.map((img, idx) =>
                      img.path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          key={idx}
                          src={`${API_URL}${img.path}`}
                          alt="attachment"
                          className="w-60 h-60 object-cover rounded-lg shadow-md border cursor-pointer"
                          onClick={() => setPreviewImage(`${API_URL}${img.path}`)}
                        />
                      ) : (
                        <a
                          key={idx}
                          href={`${API_URL}${img.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline flex items-center gap-2"
                        >
                          📎 {img.path.split("/").pop()}
                        </a>
                      )
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-4 italic">
                  {formatTimeAgo(selectedPost.created_at)}
                </p>

                <motion.div
                  className="mt-6 flex justify-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPost(null)}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#32a349] to-[#6dd47e] text-white font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    Close
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🖼️ Modal Zoom รูปภาพ */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
          >
            <motion.img
              src={previewImage}
              alt="preview"
              className="max-w-[90%] max-h-[85%] rounded-[16px] shadow-2xl border-4 border-white object-contain"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", stiffness: 150, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-6 right-6 bg-white/80 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg"
              onClick={() => setPreviewImage(null)}
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}