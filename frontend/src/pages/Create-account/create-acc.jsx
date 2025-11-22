import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaUniversity } from "react-icons/fa";
import DatePicker from "react-datepicker";
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker-fix.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export default function CreateAcc() {
  // ✅ ดึงข้อมูลผู้ใช้จาก localStorage
  const currentKey = localStorage.getItem("currentUserKey");
  const authData = currentKey
    ? JSON.parse(localStorage.getItem(currentKey) || "{}")
    : {};

  const [image, setImage] = useState(null);
  const [isPrivate, setIsPrivate] = useState(true);
  const [birthdate, setBirthdate] = useState(new Date());
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [university, setUniversity] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const navigate = useNavigate();

  // 📸 เมื่อเลือกรูปใหม่
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const openFilePicker = () => {
    document.getElementById("profile-upload").click();
  };

  // 💾 ฟังก์ชันบันทึกข้อมูลโปรไฟล์
  const handleSave = async () => {
    if (!authData.uid || !authData.token) {
      alert("Missing signup info. Please sign up again.");
      return;
    }

    let uploadedImagePath = null;
    console.log("🔘 Button state:", isPrivate ? "Private" : "Public");

    // ✅ อัปโหลดรูปก่อน ถ้ามี
    if (selectedFile) {
      const fd = new FormData();
      fd.append("file", selectedFile);

      const uploadRes = await fetch(`${API_URL}/users/upload-avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
        body: fd,
      });

      if (!uploadRes.ok) {
        alert("❌ Failed to upload image");
        return;
      }

      const data = await uploadRes.json();
      uploadedImagePath = data.filename;
    }

    const formattedDate = birthdate.toISOString().split("T")[0];

    const body = {
      name,
      birthdate: formattedDate,
      university,
      is_private: isPrivate,
      description: bio,
      profile_image: uploadedImagePath,
    };

    console.log("📤 Sending profile update:", body);

    const res = await fetch(`${API_URL}/users/${authData.uid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.token}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      // ✅ เก็บข้อมูลโปรไฟล์กลับเข้าคีย์ปัจจุบัน
      localStorage.setItem(
        currentKey,
        JSON.stringify({
          ...authData,
          name,
          bio,
          description: bio,
          university,
          profile_image: uploadedImagePath,
          is_private: isPrivate,
        })
      );

      alert("✅ Profile updated successfully!");
      window.location.href = "/app/board";
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`❌ Error: ${err.detail || "Failed to update profile"}`);
    }
  };

  return (
    <motion.div
      className="min-h-screen w-screen relative flex items-center justify-center overflow-hidden"
      initial={{ backgroundColor: "#f1f6ec" }}
      transition={{ duration: 2, ease: "easeInOut" }}
    >
      {/* --- พื้นหลังเขียว --- */}
      <motion.div
        className="w-[50vh] h-[200vh] bg-[#338646] absolute"
        initial={{ x: 0, y: 0, opacity: 0.3 }}
        animate={{
          x: ["0%", "40vw"],
          y: ["0%", "40vh"],
          rotate: 50,
          opacity: 1,
        }}
        transition={{ duration: 3, type: "spring" }}
      />
      <motion.div
        className="w-[200vh] h-[50vh] bg-[#8cab93] absolute"
        initial={{ x: 0, y: 100, opacity: 0.3 }}
        animate={{
          x: ["0%", "-25vw"],
          y: ["0%", "50vh"],
          rotate: 25,
          opacity: 1,
        }}
        transition={{ duration: 3, type: "spring" }}
      />
      <motion.div
        className="w-[50vh] h-[200vh] bg-[#8cab93] absolute"
        initial={{ x: -100, y: 0, opacity: 0.3 }}
        animate={{
          x: ["0%", "45vw"],
          y: ["0%", "-50vh"],
          rotate: 135,
          opacity: 1,
        }}
        transition={{ duration: 3, type: "spring" }}
      />

      {/* --- โลโก้ Hubersity --- */}
      <motion.div
        className="absolute top-[-80px] left-4 z-20"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", delay: 0.5 }}
      >
        <img
          src="/images/horizontal-logo.png"
          alt="Hubersity Logo"
          className="max-w-[300px] md:max-w-[250px] h-auto"
        />
      </motion.div>

      {/* --- กล่องฟอร์ม --- */}
      <motion.div
        className="relative z-10 bg-white rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.15)]
                   p-10 flex flex-col md:flex-row items-center justify-center gap-12
                   w-[90vw] md:w-[70vw]"
        initial={{ y: "100vh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, type: "spring", bounce: 0.3 }}
      >
        {/* --- ซ้าย: รูปโปรไฟล์ --- */}
        <div className="flex flex-col items-center justify-center w-full md:w-1/2 gap-4">
          <div className="w-40 h-40 rounded-full border-2 border-gray-300 overflow-hidden flex items-center justify-center bg-white">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile preview"
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-gray-500">No Photo</span>
            )}
          </div>
          <button
            onClick={openFilePicker}
            className="px-4 py-2 bg-[#8cab93] text-white rounded-full hover:opacity-90 transition"
          >
            Change Photo
          </button>
          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* --- ขวา: ฟอร์มข้อมูล --- */}
        <div className="flex flex-col gap-5 w-full md:w-1/2">
          <h1 className="text-3xl text-[#085e24] font-semibold mb-2">
            Create Account
          </h1>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="font-medium">Name :</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="rounded-lg border px-3 py-2 focus:ring-2 focus:ring-[#e0ebe2]"
            />
          </div>

          {/* Date of Birth */}
          <div className="flex flex-col gap-2">
            <label className="font-medium">Date of Birth :</label>
            <DatePicker
              selected={birthdate}
              onChange={(date) => setBirthdate(date)}
              dateFormat="dd/MM/yyyy"
              showMonthDropdown
              maxDate={new Date()}
              minDate={new Date("1900-01-01")}
              renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
                <div className="flex justify-between items-center px-2 py-1 bg-[#eaf2ed] rounded-t-lg">
                  <button
                    onClick={decreaseMonth}
                    className="text-gray-600 hover:text-black"
                  >
                    {"<"}
                  </button>
                  <span className="text-gray-800 font-medium">
                    {date.toLocaleString("default", {
                      month: "long",
                    })}{" "}
                    {date.getFullYear()}
                  </span>
                  <button
                    onClick={increaseMonth}
                    className="text-gray-600 hover:text-black"
                  >
                    {">"}
                  </button>
                </div>
              )}
              className="w-full border rounded-md px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-[#e0ebe2]"
              calendarClassName="rounded-lg border border-[#e0ebe2] shadow-md bg-white"
              popperClassName="z-50"
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-2">
            <label className="font-medium">Bio :</label>
            <textarea
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write something about yourself..."
              className="rounded-lg border px-3 py-2 focus:ring-2 focus:ring-[#e0ebe2]"
            ></textarea>
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-5 mt-2">
            <span className="font-medium mr-2">Visibility :</span>
            <div className="flex gap-3 bg-gray-100 rounded-full px-2 py-1">
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`px-4 py-1 rounded-full transition ${
                  isPrivate ? "bg-[#8cab93] text-white" : "text-gray-700"
                }`}
              >
                Private
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`px-4 py-1 rounded-full transition ${
                  !isPrivate ? "bg-[#8cab93] text-white" : "text-gray-700"
                }`}
              >
                Public
              </button>
            </div>
          </div>


          {/* University */}
          <div className="flex flex-col gap-2">
            <label className="font-medium">University :</label>
            <div className="flex items-center border rounded-full px-3 bg-gray-100">
              <FaUniversity className="text-[#8cab93] mr-2" />
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="bg-gray-100 w-full py-2 focus:outline-none cursor-pointer"
              >
                <option value="">Select your University</option>
                <option value="Kasetsart University">
                  Kasetsart University
                </option>
                <option value="Chulalongkorn University">
                  Chulalongkorn University
                </option>
                <option value="Chiang Mai University">
                  Chiang Mai University
                </option>
                <option value="Mahidol University">
                  Mahidol University
                </option>
                <option value="Thammasat University">
                  Thammasat University
                </option>
              </select>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="mt-6 bg-[#085e24] text-white rounded-full py-2 hover:opacity-90 transition"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}