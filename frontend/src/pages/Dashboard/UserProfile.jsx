import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Lock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag } from "lucide-react";

const API_URL = "http://localhost:8000";

// ฟังก์ชันแสดงเวลาแบบ Board
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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [extraDetails, setExtraDetails] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [reportAccountOpen, setReportAccountOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const openReport = (pid) => {
    setReportPostId(pid);
    setReportOpen(true);
  };

  const submitReport = async (reason, details = "") => {
  const currentKey = localStorage.getItem("currentUserKey");
  const authData = currentKey
    ? JSON.parse(localStorage.getItem(currentKey) || "{}")
    : null;

    if (!authData?.token) {
      console.error("No auth token found");
      alert("Please log in to submit a report.");
      return;
    }

    try {
      const url = reportPostId
        ? `${API_URL}/posts/${reportPostId}/report`
        : `${API_URL}/users/${userId}/report`; // ✅ matches backend

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify({ reason, details }), // ✅ match schema
      });

      if (!res.ok) throw new Error("Failed to submit report");

      alert("Report submitted successfully!");
      setReportOpen(false);
      setReportAccountOpen(false); // ✅ close user report modal
      setReportPostId(null); // ✅ reset post report state
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Failed to submit report");
    }
  };



  // โหลด token จาก localStorage
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

  // ดึงข้อมูล user + posts
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
        console.error("Error fetching user data:", err);
        setError("Failed to load user data.");
      }
    };

    fetchUserData();
  }, [authData, userId]);

  useEffect(() => {
    if (!authData?.token || !user) return;

    const checkBlockStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/block/list`, {
          headers: { Authorization: `Bearer ${authData.token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const blocked = data.some((b) => String(b.blocked_id) === String(userId));
          setIsBlocked(blocked);
        }
      } catch (err) {
        console.error("Error checking block status:", err);
      }
    };

    checkBlockStatus();
  }, [authData, user]);

  useEffect(() => {
    if (!authData?.token || !user) return;

    const checkFollowing = async () => {
      try {
        const res = await fetch(`${API_URL}/follow/following`, {
          headers: { Authorization: `Bearer ${authData.token}` },
        });
        if (res.ok) {
          const followingList = await res.json();
          const alreadyFollowing = followingList.some((f) => String(f.uid) === String(userId));
          setIsFollowing(alreadyFollowing);
        }
      } catch (err) {
        console.error("Error checking follow status:", err);
      }
    };

    checkFollowing();
  }, [authData, user]);

  
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

  const handleFollowToggle = async () => {
    if (!authData?.token) return;

    try {
      if (isFollowing) {
        // ยกเลิกติดตาม
        const res = await fetch(`${API_URL}/follow/${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authData.token}` },
        });
        if (res.ok) setIsFollowing(false);
      } else {
        // ติดตาม
        const res = await fetch(`${API_URL}/follow/${userId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${authData.token}` },
        });
        if (res.ok) setIsFollowing(true);
      }
    } catch (err) {
      console.error("Follow action failed:", err);
    }
  };

  const handleBlockToggle = async () => {
    if (!authData?.token) return;

    try {
      // ถ้าบล็อกอยู่ → ปลดบล็อก
      if (isBlocked) {
        const res = await fetch(`${API_URL}/block/${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authData.token}` },
        });

        if (res.ok) {
          setIsBlocked(false);
          alert("User unblocked.");
        }
      } 
      // ถ้ายังไม่บล็อก → เปิด modal confirm
      else {
        setBlockOpen(true);
      }
    } catch (err) {
      console.error("Block action failed:", err);
    }
  };

  const confirmBlock = async () => {
    try {
      const res = await fetch(`${API_URL}/block/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authData.token}` },
      });

      if (res.ok) {
        setIsBlocked(true);
        setBlockOpen(false);
        alert("User blocked successfully.");
      }
    } catch (err) {
      console.error("Block failed:", err);
    }
  };

  return (
    <div className="flex flex-col items-center bg-white min-h-[calc(100vh-64px)] py-10 relative">
      {/* กล่องโปรไฟล์ */}
      <div className="bg-white shadow-lg rounded-[24px] w-[90%] max-w-6xl px-12 py-12 text-center">
      <div className="flex justify-center gap-5 mb-6">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFollowToggle}
          className={`px-6 py-2 rounded-[10px] font-medium shadow-sm text-sm hover:shadow-md transition-all text-white ${
            isFollowing ? "bg-[#6dbf74]" : "bg-[#32a349]"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBlockToggle}
          className={`px-6 py-2 rounded-[10px] font-medium shadow-sm text-sm hover:shadow-md transition-all text-white ${
            isBlocked ? "bg-red-800" : "bg-[#ea4124]"
          }`}
        >
          {isBlocked ? "Blocked" : "Block"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setReportAccountOpen(true)}
          className="px-6 py-2 rounded-[10px] font-medium shadow-sm text-sm hover:shadow-md bg-[#a6a6a6] text-white"
        >
          Report
        </motion.button>
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

      {/* ส่วนล่าง */}
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 mt-[2px]">
                      {formatTimeAgo(p.created_at)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openReport(p.pid);
                      }}
                      className="flex items-center gap-1 px-3 py-[4px] rounded-full border border-gray-300 
                                bg-white/80 text-gray-700 text-sm font-medium shadow-sm 
                                hover:bg-[#fff4e5] hover:text-[#b45309] hover:border-[#facc15] 
                                transition-all duration-200"
                    >
                      <Flag size={14} strokeWidth={2} />
                      Report
                    </button>
                  </div>
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
                    {/* แสดงคอมเมนต์ใต้โพสต์ */}
                    {p.comments && p.comments.length > 0 && (
                      <div className="mt-3 border-t border-[#f0e0c8] pt-3">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Comments</h4>

                        <div className="flex flex-col gap-3">
                          {p.comments.map((c, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 bg-white/80 rounded-lg p-3 border border-[#f7e8c2] shadow-sm"
                            >
                              {/* โปรไฟล์คอมเมนต์ */}
                              <img
                                src={
                                  c.profile_image
                                    ? `${API_URL}${c.profile_image}`
                                    : "/images/default-avatar.png"
                                }
                                alt={c.username}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200 cursor-pointer"
                                onClick={() => navigate(`/user/${c.user_id}`)}
                              />

                              {/* เนื้อหาคอมเมนต์ */}
                              <div className="flex-1">
                                <p className="text-sm text-gray-800">
                                  <span
                                    className="font-semibold text-black mr-1 hover:underline cursor-pointer"
                                    onClick={() => navigate(`/user/${c.user_id}`)}
                                  >
                                    {c.username}
                                  </span>
                                  {c.content}
                                </p>

                                {/* แสดงไฟล์แนบในคอมเมนต์ */}
                                {c.files && c.files.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {c.files.map((f, i) =>
                                      f.file_type === "image" ? (
                                        <img
                                          key={i}
                                          src={`${API_URL}${f.path}`}
                                          alt="comment attachment"
                                          className="w-24 h-24 object-cover rounded-md border border-gray-200 cursor-pointer hover:scale-[1.05] transition"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewImage(`${API_URL}${f.path}`);
                                          }}
                                        />
                                      ) : (
                                        <a
                                          key={i}
                                          href={`${API_URL}${f.path}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                                        >
                                          📎 {f.path.split("/").pop()}
                                        </a>
                                      )
                                    )}
                                  </div>
                                )}

                                <p className="text-[11px] text-gray-500 mt-[4px] ml-[2px]">
                                  {formatTimeAgo(c.created_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
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

      {/* Modal ขยายรูปโปรไฟล์ */}
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

      {/* Modal แสดงรายละเอียดโพสต์ */}
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
              className="relative bg-white/90 backdrop-blur-xl border border-[#e0e0e0]/60 rounded-[24px] shadow-2xl w-[520px] max-h-[85vh] overflow-y-auto p-8"
            >
              <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[#a6f5c2]/30 via-[#fff5d6]/30 to-[#ffd6d6]/30 blur-xl opacity-70 pointer-events-none"></div>

              <div className="relative z-10 text-center">
                <h3 className="text-xl font-semibold text-[#333] mb-4 flex items-center justify-center gap-2">
                  Post Detail
                </h3>

                {/* เนื้อหาโพสต์ */}
                <p className="text-gray-800 leading-relaxed text-base bg-white/70 rounded-xl px-4 py-3 border border-[#f0e8d8]/70 shadow-inner">
                  {selectedPost.post_content}
                </p>

                {/* รูปภาพ / ไฟล์แนบ */}
                {selectedPost.images && selectedPost.images.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    {selectedPost.images.map((img, i) =>
                      img.path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          key={i}
                          src={`${API_URL}${img.path}`}
                          alt="attachment"
                          className="w-32 h-32 object-cover rounded-md border cursor-pointer hover:scale-[1.05] transition"
                          onClick={() => setPreviewImage(`${API_URL}${img.path}`)}
                        />
                      ) : (
                        <a
                          key={i}
                          href={`${API_URL}${img.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
                        >
                          📎 {img.path.split("/").pop()}
                        </a>
                      )
                    )}
                  </div>
                )}

                {/* คอมเมนต์ */}
                {selectedPost.comments && selectedPost.comments.length > 0 && (
                  <div className="mt-6 text-left">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Comments</h4>
                    <div className="flex flex-col gap-3">
                      {selectedPost.comments.map((c, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 bg-white/70 rounded-lg p-3 border border-[#f7e8c2] shadow-sm"
                        >
                          <img
                            src={
                              c.profile_image
                                ? `${API_URL}${c.profile_image}`
                                : "/images/default-avatar.png"
                            }
                            alt={c.username}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          />

                          <div className="flex-1">
                            <p className="text-sm text-gray-800">
                              <span className="font-semibold text-black mr-1">
                                {c.username}
                              </span>
                              {c.content}
                            </p>

                            {/* ไฟล์แนบในคอมเมนต์ */}
                            {c.files && c.files.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {c.files.map((f, i) =>
                                  f.file_type === "image" ? (
                                    <img
                                      key={i}
                                      src={`${API_URL}${f.path}`}
                                      alt="comment file"
                                      className="w-20 h-20 object-cover rounded-md border cursor-pointer hover:scale-[1.05] transition"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImage(`${API_URL}${f.path}`);
                                      }}
                                    />
                                  ) : (
                                    <a
                                      key={i}
                                      href={`${API_URL}${f.path}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                                    >
                                      📎 {f.path.split("/").pop()}
                                    </a>
                                  )
                                )}
                              </div>
                            )}

                            <p className="text-[11px] text-gray-500 mt-[3px] ml-[2px]">
                              {formatTimeAgo(c.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* เวลาโพสต์ */}
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Zoom รูปภาพ */}
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

      <AnimatePresence>
        {reportOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
              onClick={() => setReportOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="relative w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50 to-amber-50 border-b">
                <div className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3h18M9 3v18m6-18v18"
                    />
                  </svg>
                  Report Post
                </div>
                <button
                  onClick={() => setReportOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 mb-2">
                  Please select a reason for reporting this post:
                </p>

                {[
                  {
                    key: "Harassment",
                    text: "Harassment (Bullying, discrimination, or targeting a religion, gender, or group.)",
                  },
                  {
                    key: "Sexual Content",
                    text: "Sexual Content (Sexual, pornographic, or inappropriate material.)",
                  },
                  {
                    key: "Illegal Activity",
                    text: "Illegal Activity (Promoting illegal actions or services.)",
                  },
                  {
                    key: "Spam",
                    text: "Spam (Reposting or irrelevant content repeatedly.)",
                  },
                  {
                    key: "Privacy Violation",
                    text: "Privacy Violation (Sharing personal information or photos of others without consent.)",
                  },
                  { key: "Other", text: "Other (Please specify.)" },
                ].map((r) => (
                  <label
                    key={r.key}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-all"
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      value={r.key}
                      onChange={() => setSelectedReason(r.key)}
                      className="mt-1 accent-emerald-500"
                    />
                    <span className="text-sm text-gray-700">{r.text}</span>
                  </label>
                ))}

                {/* Extra details */}
                <div className="mt-4">
                  <label className="block text-sm text-gray-600 mb-1">
                    Additional details (optional)
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Describe what happened or any context that helps us review this report."
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-emerald-400 focus:ring-emerald-200 outline-none"
                    onChange={(e) => setExtraDetails(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                <button
                  onClick={() => setReportOpen(false)}
                  className="px-5 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitReport(selectedReason, extraDetails)}
                  className="px-5 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                >
                  Submit Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Confirm Block */}
      <AnimatePresence>
        {blockOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* overlay */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
              onClick={() => setBlockOpen(false)}
            />

            {/* modal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b">
                <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-600" />
                  Block User
                </h3>
              </div>

              {/* Body */}
              <div className="p-6 text-gray-700 space-y-3">
                <p className="text-sm">
                  Are you sure you want to block{" "}
                  <span className="font-semibold text-gray-900">{user.name}</span>?
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  They will not be able to see your posts or interact with your account anymore.
                  You can unblock them anytime.
                </p>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
                <button
                  onClick={() => setBlockOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBlock}
                  className="px-5 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 shadow"
                >
                  Confirm Block
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Report Account */}
      <AnimatePresence>
        {reportAccountOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
              onClick={() => setReportAccountOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="relative w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50 to-amber-50 border-b">
                <div className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3h18M9 3v18m6-18v18"
                    />
                  </svg>
                  Report Account
                </div>
                <button
                  onClick={() => setReportAccountOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 mb-2">
                  Please select a reason for reporting this account:
                </p>

                {[
                  {
                    key: "Harassment",
                    text: "Harassment (Bullying, discrimination, or targeting a religion, gender, or group.)",
                  },
                  {
                    key: "Fake Account",
                    text: "Fake Account (Pretending to be someone else or impersonating others.)",
                  },
                  {
                    key: "Spam",
                    text: "Spam (Fake, automated, or promotional accounts.)",
                  },
                  {
                    key: "Inappropriate Behavior",
                    text: "Inappropriate Behavior (Offensive, threatening, or harmful activity.)",
                  },
                  {
                    key: "Privacy Violation",
                    text: "Privacy Violation (Sharing private information or photos of others without consent.)",
                  },
                  { key: "Other", text: "Other (Please specify.)" },
                ].map((r) => (
                  <label
                    key={r.key}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-all"
                  >
                    <input
                      type="radio"
                      name="report_account_reason"
                      value={r.key}
                      onChange={() => setSelectedReason(r.key)}
                      className="mt-1 accent-emerald-500"
                    />
                    <span className="text-sm text-gray-700">{r.text}</span>
                  </label>
                ))}

                {/* Extra details */}
                <div className="mt-4">
                  <label className="block text-sm text-gray-600 mb-1">
                    Additional details (optional)
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Describe what happened or any context that helps us review this report."
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-emerald-400 focus:ring-emerald-200 outline-none"
                    onChange={(e) => setExtraDetails(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                <button
                  onClick={() => setReportAccountOpen(false)}
                  className="px-5 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitReport(selectedReason, extraDetails)}
                  className="px-5 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                >
                  Submit Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}