import { useState, useEffect } from "react";
import { Camera, GraduationCap, Lock, Globe, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker-fix.css";

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

  // 🧠 ดึงข้อมูลผู้ใช้จาก backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentKey = localStorage.getItem("currentUserKey");
        const authData = currentKey
          ? JSON.parse(localStorage.getItem(currentKey) || "{}")
          : {};

        if (!authData?.token) {
          console.warn("No token found. Please log in again.");
          return;
        }

        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${authData.token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch user data");

        const data = await res.json();
        console.log("Loaded user:", data);

        setUsername(data.username);
        setName(data.name || "");
        setBio(data.bio || "");
        setUniversity(data.university || "");
        setVisibility(data.visibility || "public");
        setBirthdate(data.birthdate ? new Date(data.birthdate) : null);
        setFollowers(data.followers_count || 0);
        setFollowing(data.following_count || 0);
        setProfilePic(
          data.profile_image
            ? `${API_URL}${data.profile_image}`
            : "/images/default-avatar.png"
        );
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };

    fetchUser();
  }, []);

  // 🧮 คำนวณอายุ
  const calculateAge = (birth) => {
    if (!birth) return "";
    const b = new Date(birth);
    const t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
    return isNaN(age) ? "" : age;
  };

  // 📸 เปลี่ยนรูปโปรไฟล์ (preview ก่อน)
  const handleImageChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setProfilePic(URL.createObjectURL(f));
    }
  };

  // ✅ อัปเดตโปรไฟล์
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

        if (!uploadRes.ok)
          throw new Error("Image upload failed. Please try again.");

        const uploadData = await uploadRes.json();
        uploadedImagePath = uploadData.file_path;
        console.log("Uploaded image:", uploadedImagePath);
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
          bio,
          university,
          visibility,
          birthdate: birthdate ? birthdate.toISOString().split("T")[0] : null,
          profile_image: uploadedImagePath || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      // ✅ อัปเดตใน localStorage
      const updatedUser = {
        ...authData,
        name,
        university,
        profile_image: uploadedImagePath || authData.profile_image,
      };

      localStorage.setItem(currentKey, JSON.stringify(updatedUser));

      alert("✅ Profile updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("❌ Failed to update profile.");
    }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] flex justify-center items-center bg-[#fff9ef] overflow-hidden">
      <div className="bg-[#fff3e6] w-[80%] max-w-5xl rounded-2xl shadow-lg p-10 flex flex-row gap-10 items-center justify-center relative">
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
            User Name : {username || "Loading..."}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Following :{" "}
            <span className="font-medium text-black">{following}</span> | Follower :{" "}
            <span className="font-medium text-black">{followers}</span>
          </p>
        </div>

        {/* ข้อมูลบัญชี */}
        <div className="flex-1 space-y-5">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Account Information
          </h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Name :</label>
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
              <label className="block text-sm font-medium mb-1">
                Birthdate :
              </label>
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
                Age :
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
            <label className="block text-sm font-medium mb-1">Bio :</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full border rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-[#e0ebe2]"
            />
          </div>

          {/* University */}
          <div>
            <label className="block text-sm font-medium mb-2">University :</label>
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
                <option value="">Select University</option>
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
            <label className="block text-sm font-medium mb-2">Visibility :</label>
            <div className="flex gap-3">
              {[
                { value: "private", label: "Private", icon: <Lock size={16} /> },
                { value: "public", label: "Public", icon: <Globe size={16} /> },
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
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}