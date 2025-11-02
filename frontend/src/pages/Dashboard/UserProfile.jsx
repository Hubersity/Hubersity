import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Lock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "http://localhost:8000";

export default function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [studyTime, setStudyTime] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentKey = localStorage.getItem("currentUserKey");
      const authData = currentKey
        ? JSON.parse(localStorage.getItem(currentKey) || "{}")
        : {};

      try {
        const res = await fetch(`${API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${authData.token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user data");
        const data = await res.json();
        setUser(data);

        if (data.privacy === "public") {
          const postsRes = await fetch(`${API_URL}/users/${userId}/posts`);
          if (postsRes.ok) setPosts(await postsRes.json());

          const localStudy = JSON.parse(
            localStorage.getItem("study_today") || "{}"
          );
          setStudyTime(localStudy);
        }
      } catch (err) {
        console.error("❌ Error fetching user data:", err);
        setError(err.message);
      }
    };
    fetchUserData();
  }, [userId]);

  if (error)
    return (
      <div className="p-10 text-center text-red-500">
        Failed to load user: {error}
      </div>
    );

  if (!user)
    return <div className="p-10 text-center text-gray-600">Loading...</div>;

  const age = user.birthdate
    ? new Date().getFullYear() - new Date(user.birthdate).getFullYear()
    : "N/A";

  const profileImg = user.profile_image && `${API_URL}${user.profile_image}`;

  return (
    <div className="flex flex-col items-center bg-white min-h-[calc(100vh-64px)] py-10 relative">
      {/* 🟩 กล่องโปรไฟล์ */}
      <div className="bg-white shadow-lg rounded-[24px] w-[90%] max-w-6xl px-12 py-12 text-center">
        {/* 🔘 ปุ่ม Follow / Block / Report */}
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

        {/* 👤 รูปโปรไฟล์ + ชื่อ + Bio */}
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
              src={profileImg || "/images/default-avatar.png"}
              alt={user.name}
              className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </motion.div>

          <h2 className="text-xl font-semibold mt-3 text-gray-800">
            {user.name}
          </h2>
          <p className="text-gray-600 text-sm">Age: {age}</p>
          <p className="mt-1 text-gray-700 text-center max-w-md leading-relaxed text-sm">
            {user.description || "No bio provided."}
          </p>
        </div>
      </div>

      {/* 🟨 ส่วนล่าง */}
      {user.privacy === "private" ? (
        <div className="mt-10 flex flex-col items-center justify-center bg-[#efecec] p-14 rounded-[22px] text-gray-700 shadow-inner w-[92%] max-w-6xl min-h-[200px]">
          {/* 🔒 กุญแจ hover แล้วขยายใหญ่ */}
          <motion.div
            whileHover={{
              scale: 1.25,
              rotate: 6,
              transition: { type: "spring", stiffness: 300, damping: 12 },
            }}
            whileTap={{ scale: 1.2 }}
            className="bg-white/80 p-5 rounded-full shadow-md mb-4 cursor-pointer hover:shadow-[0_0_25px_rgba(0,0,0,0.15)] hover:bg-white"
          >
            <Lock size={56} className="text-gray-500" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-lg font-medium tracking-wide"
          >
            This account is private
          </motion.p>
        </div>
      ) : (
        <div className="mt-10 bg-[#fff9ef] rounded-[20px] w-[90%] max-w-6xl p-10 shadow-inner">
          <div className="grid grid-cols-3 gap-8 items-start">
            <div className="col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                History
              </h3>
              {posts.length > 0 ? (
                posts.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center bg-[#fffaf3] p-3 rounded-lg mb-2 border border-[#f2e0ca]"
                  >
                    <p className="text-gray-800">{p.content}</p>
                    <span className="text-sm text-gray-500">
                      {new Date(p.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No posts yet.</p>
              )}
            </div>

            <div className="flex justify-center">
              <div className="flex flex-col items-center bg-[#fffdf9] p-6 rounded-[16px] shadow-md w-[200px] border border-[#f7dfc4]">
                <img
                  src={studyTime?.image || "/images/ts_l0-rebg.png"}
                  alt="study-status"
                  className="w-20 h-20 object-contain mb-2"
                />
                <h4 className="text-md font-semibold text-gray-700">
                  Study Today
                </h4>
                <p className="text-xl font-bold text-[#e65a2c] mt-1">
                  {studyTime?.time || "00:00:00"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🪩 Modal รูปโปรไฟล์ขยาย */}
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
                  src={profileImg || "/images/default-avatar.png"}
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
    </div>
  );
}