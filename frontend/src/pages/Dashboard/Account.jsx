import { useState, useEffect } from "react";
import { Camera, GraduationCap, Lock, Globe, Calendar, Edit2, Trash2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker-fix.css";
import { useTranslation } from "react-i18next";

const API_URL = "http://localhost:8000";

export default function Account() {
  const [profilePic, setProfilePic] = useState("/images/default-avatar.png");
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState(null);
  const [bio, setBio] = useState("");
  const [university, setUniversity] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [username, setUsername] = useState("");
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [file, setFile] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const { t } = useTranslation();

  // ดึงข้อมูลผู้ใช้ + โพสต์ของตัวเอง
  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentKey = localStorage.getItem("currentUserKey");
        const authData = currentKey
          ? JSON.parse(localStorage.getItem(currentKey) || "{}")
          : {};

        if (!authData?.token) return;

        // โหลดข้อมูล user
        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${authData.token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user data");
        const data = await res.json();

        setUsername(data.username);
        setName(data.name || "");
        setBio(data.description || "");
        setUniversity(data.university || "");
        setVisibility(data.privacy || "public");
        setBirthdate(data.birthdate ? new Date(data.birthdate) : null);
        setFollowers(data.followers_count || 0);
        setFollowing(data.following_count || 0);
        setProfilePic(
          data.profile_image
            ? `${API_URL}${data.profile_image}`
            : "/images/default-avatar.png"
        );

        // โหลดโพสต์ของตัวเอง (ยกเว้นพวกจับเวลา)
        const postsRes = await fetch(`${API_URL}/posts/me`, {
          headers: { Authorization: `Bearer ${authData.token}` },
        });
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          const filtered = postsData.filter(
            (p) => !p.category?.toLowerCase().includes("time")
          );
          setMyPosts(filtered);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };

    fetchData();
  }, []);

  // คำนวณอายุ
  const calculateAge = (birth) => {
    if (!birth) return "";
    const b = new Date(birth);
    const t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
    return isNaN(age) ? "" : age;
  };

  // เปลี่ยนรูปโปรไฟล์ (preview ก่อน)
  const handleImageChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setProfilePic(URL.createObjectURL(f));
    }
  };

  // อัปเดตโปรไฟล์
  const handleSave = async () => {
    try {
      const currentKey = localStorage.getItem("currentUserKey");
      const authData = currentKey
        ? JSON.parse(localStorage.getItem(currentKey) || "{}")
        : {};

      if (!authData?.token || !authData?.uid) {
        alert("Please log in again.");
        return;
      }

      let uploadedImagePath = null;

      // 🔹 ถ้ามีอัปโหลดรูปใหม่
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch(`${API_URL}/users/upload-avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${authData.token}` },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Image upload failed.");

        const uploadData = await uploadRes.json();
        uploadedImagePath = uploadData.file_path;
      }

      // 🔹 ส่งข้อมูลอัปเดตทั่วไป
      const res = await fetch(`${API_URL}/users/${authData.uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify({
          name,
          description: bio,
          university,
          privacy: visibility,
          birthdate: birthdate ? birthdate.toISOString().split("T")[0] : null,
          profile_image: uploadedImagePath || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      alert("Profile updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile.");
    }
  };

  // ลบโพสต์
  const handleDeletePost = async (pid) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const currentKey = localStorage.getItem("currentUserKey");
      const authData = JSON.parse(localStorage.getItem(currentKey) || "{}");
      const res = await fetch(`${API_URL}/posts/${pid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authData.token}` },
      });
      if (res.ok) {
        setMyPosts((prev) => prev.filter((p) => p.pid !== pid));
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  // แก้ไขโพสต์
  const handleEditPost = async (post) => {
    const newContent = prompt("Edit your post:", post.post_content);
    if (!newContent || newContent.trim() === "") return;
    try {
      const currentKey = localStorage.getItem("currentUserKey");
      const authData = JSON.parse(localStorage.getItem(currentKey) || "{}");
      const res = await fetch(`${API_URL}/posts/${post.pid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify({
          post_content: newContent,
          forum_id: post.forum_id,
          tags: post.tags?.map((t) => t.ptid) || [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMyPosts((prev) =>
          prev.map((p) => (p.pid === data.pid ? data : p))
        );
      }
    } catch (err) {
      console.error("Error editing post:", err);
    }
  };

  const formatTimeAgo = (dateStr) => {
    const diff = (new Date() - new Date(dateStr)) / 1000;
    if (diff < 60) return `${Math.floor(diff)} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setEditContent(post.post_content);
  };

  const openDeleteModal = (post) => {
    setDeletingPost(post);
  };

  const confirmEdit = async () => {
    if (!editContent.trim()) return alert("Please enter content.");
    try {
      const currentKey = localStorage.getItem("currentUserKey");
      const authData = JSON.parse(localStorage.getItem(currentKey) || "{}");
      await fetch(`${API_URL}/posts/${editingPost.pid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify({ post_content: editContent }),
      });
      alert("Post updated!");
      setEditingPost(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    try {
      const currentKey = localStorage.getItem("currentUserKey");
      const authData = JSON.parse(localStorage.getItem(currentKey) || "{}");
      await fetch(`${API_URL}/posts/${deletingPost.pid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      });
      alert("Post deleted!");
      setDeletingPost(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="w-full min-h-[calc(100vh-64px)] flex flex-col items-center bg-[#fff9ef] overflow-y-auto pb-20">
      <div className="bg-[#fff3e6] w-[80%] max-w-5xl rounded-2xl shadow-lg p-10 flex flex-row gap-10 items-center justify-center relative mt-10">
        {/* โปรไฟล์ */}
        <div className="flex flex-col items-center justify-center w-[40%] relative">
          <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-[#d1d1d1] bg-white relative">
            <img
              src={profilePic}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          <label
            htmlFor="avatarUpload"
            className="absolute bottom-[105px] left-[230px] bg-white rounded-full p-2 shadow cursor-pointer hover:bg-gray-100 border border-gray-200"
            title="Change photo"
          >
            <Camera className="w-5 h-5 text-gray-700" />
          </label>
          <input
            id="avatarUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />

          <p className="mt-6 text-lg font-semibold">
            {t("account.username")} : {username || "Loading..."}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {t("account.following")}{" "}
            <span className="font-medium text-black">{following}</span> | {t("account.followers")}{" "}
            <span className="font-medium text-black">{followers}</span>
          </p>
        </div>

        {/* ข้อมูลบัญชี */}
        <div className="flex-1 space-y-5">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {t("account.title")}
          </h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">{t("account.name")} :</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-[#e0ebe2]"
            />
          </div>

          {/* Birthdate */}
          <div className="flex items-end gap-1">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">{t("account.birthdate")} :</label>
              <div className="relative">
                <DatePicker
                  selected={birthdate}
                  onChange={(date) => setBirthdate(date)}
                  dateFormat="dd/MM/yyyy"
                  showMonthDropdown
                  maxDate={new Date()}
                  minDate={new Date("1900-01-01")}
                  className="w-full border rounded-md px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-[#e0ebe2]"
                />
                <Calendar className="absolute right-3 top-3 text-gray-400" size={18} />
              </div>
            </div>

            <div className="flex flex-col w-[80px] ml-[-6px]">
              <label className="block text-sm font-medium mb-1 text-center">
                {t("account.age")} :
              </label>
              <input
                type="text"
                value={calculateAge(birthdate)}
                disabled
                className="border rounded-md px-3 py-2 bg-gray-100 text-center"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-1">{t("account.bio")} :</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full border rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-[#e0ebe2]"
            />
          </div>

          {/* University */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("account.university")} :</label>
            <div className="relative">
              <GraduationCap
                className="absolute left-3 top-2.5 text-[#6d8c75]"
                size={18}
              />
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full border rounded-full pl-10 pr-4 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-[#e0ebe2] appearance-none hover:bg-[#f6faf7]"
              >
                <option value="">{t("account.selectUniversity")}</option>
                <option value="Kasetsart University">Kasetsart University</option>
                <option value="Chulalongkorn University">Chulalongkorn University</option>
                <option value="Thammasat University">Thammasat University</option>
                <option value="Mahidol University">Mahidol University</option>
                <option value="Chiang Mai University">Chiang Mai University</option>
              </select>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("account.visibility")} :</label>
            <div className="flex gap-3">
              {[
                { value: "private", label: t("account.private"), icon: <Lock size={16} /> },
                { value: "public", label: t("account.public"), icon: <Globe size={16} /> },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setVisibility(opt.value)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all ${
                    visibility === opt.value
                      ? "bg-[#e0ebe2] text-black border-[#b9d2c2] shadow-sm"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-[#f6faf7]"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              className="bg-[#3ab153] hover:bg-[#2f9246] text-white px-6 py-2 rounded-full font-medium transition"
            >
              {t("account.saveChanges")}
            </button>
          </div>
        </div>
      </div>

      {/* My Posts Section */}
      <div className="mt-10 bg-[#fff3e6] rounded-2xl w-[80%] max-w-5xl p-8 shadow-lg border border-[#f1dcc9]">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("account.myPosts")}</h3>

        {myPosts.length === 0 ? (
          <p className="text-gray-500 italic">{t("account.noPosts")}</p>
        ) : (
          myPosts.map((p) => (
        <div
          key={p.pid}
          className="bg-white/80 rounded-lg p-4 border border-[#f7e8c2] shadow-sm mb-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-800 font-medium">{p.post_content}</p>
              <p className="text-[12px] text-gray-500 mt-1">
                {new Date(p.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => openEditModal(p)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#1976D2] rounded-lg transition"
              >
                <Edit2 size={14} />
                {t("account.edit")}
              </button>
              <button
                onClick={() => openDeleteModal(p)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#FDECEA] hover:bg-[#F8D7DA] text-[#D32F2F] rounded-lg transition"
              >
                <Trash2 size={14} />
                {t("account.delete")}
              </button>
            </div>
          </div>

              {/* รูปภาพ / ไฟล์แนบ */}
              {p.images && p.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.images.map((img, i) =>
                    img.path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        key={i}
                        src={`${API_URL}${img.path}`}
                        alt="attachment"
                        className="w-24 h-24 object-cover rounded-md border"
                      />
                    ) : (
                      <a
                        key={i}
                        href={`${API_URL}${img.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                      >
                        📎 {img.path.split("/").pop()}
                      </a>
                    )
                  )}
                </div>
              )}

              {/* คอมเมนต์ */}
              {p.comments && p.comments.length > 0 && (
                <div className="mt-3 border-t border-[#f0e0c8] pt-2">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Comments
                  </h4>
                  <div className="flex flex-col gap-2">
                    {p.comments.map((c) => (
                      <div
                        key={c.cid}
                        className="flex items-start gap-2 bg-white/60 rounded-md p-2 border border-[#f7e8c2]"
                      >
                        <img
                          src={
                            c.profile_image
                              ? `${API_URL}${c.profile_image}`
                              : "/images/default-avatar.png"
                          }
                          alt={c.username}
                          className="w-7 h-7 rounded-full border border-gray-200"
                        />
                        <div>
                          <p className="text-sm text-gray-800">
                            <span className="font-semibold text-black mr-1">
                              {c.username}
                            </span>
                            {c.content}
                          </p>

                          {/* ไฟล์แนบในคอมเมนต์ */}
                          {c.files && c.files.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {c.files.map((f, i) =>
                                f.file_type === "image" ? (
                                  <img
                                    key={i}
                                    src={`${API_URL}${f.path}`}
                                    alt="comment file"
                                    className="w-14 h-14 object-cover rounded-md border"
                                  />
                                ) : (
                                  <a
                                    key={i}
                                    href={`${API_URL}${f.path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-gray-600 hover:underline"
                                  >
                                    📎 {f.path.split("/").pop()}
                                  </a>
                                )
                              )}
                            </div>
                          )}
                          <p className="text-[11px] text-gray-500">
                            {formatTimeAgo(c.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {/* Edit Modal (เหมือนหน้า Board เป๊ะ) */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setEditingPost(null)}
          />
          {/* modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 border-b bg-gradient-to-r from-green-50 to-amber-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{t("account.editPostTitle")}</h3>
              <button
                onClick={() => setEditingPost(null)}
                className="text-gray-500 hover:text-red-500 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-white"
              >
                {t("account.cancel")}
              </button>
              <button
                onClick={confirmEdit}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                {t("account.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal (เหมือนหน้า Board เป๊ะ) */}
      {deletingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setDeletingPost(null)}
          />
          {/* modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 border-b bg-gradient-to-r from-rose-50 to-amber-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{t("account.deletePostTitle")}</h3>
              <button
                onClick={() => setDeletingPost(null)}
                className="text-gray-500 hover:text-red-500 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 text-center">
              <p className="text-gray-700 mb-5">
                {t("account.deletePostConfirm")}
                <br />
                <span className="text-gray-500 text-sm">
                  {t("account.deleteWarning")}
                </span>
              </p>
            </div>

            <div className="px-5 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setDeletingPost(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-white"
              >
                {t("account.cancel")}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
              >
                {t("account.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}