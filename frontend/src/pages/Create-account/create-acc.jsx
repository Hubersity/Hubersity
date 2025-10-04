import React, { useState } from "react";
import { motion } from "framer-motion";

export default function CreateAcc() {
    const [image, setImage] = useState(null); // for perview the picture
    const [privacy, setPrivacy] = useState("private");


    const handleImageChange = async (e) => { 
        const file = e.target.files?.[0]; // if the user choose many picture we wil get only the first pic
        if (!file) return; // check ว่ามี file จริงมั้ย
        // สร้าง URL ชั่วคราวไว้แสดงพรีวิว
        // show preview picture
        setImage(URL.createObjectURL(file)); // setImage() อัปเดต state เพื่อให้ React เอา URL ไปใช้, 
        // URL.createObjectURL(file) สร้าง URL ชั่วคราวสำหรับไฟล์นั้น

        // real picture that user choice
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload-avatar", { method: "POST", body: fd });
        const data = await res.json(); // { url: "https://..." }
    
        setAvatarUrl(data.url); // เก็บไว้โชว์/ส่งต่อไปหน้าอื่น
      };

    // ฟังก์ชันให้กดปุ่มแล้วเปิด file picker
    const openFilePicker = () => {
        document.getElementById("profile-upload").click();
    };
    
    return (
            <motion.div
            className="min-h-screen w-screen relative flex items-center justify-center overflow-hidden"
            initial={{ backgroundColor: "#f1f6ec" }}
            transition={{ duration: 2, ease: "easeInOut"}}>

                {/* ลตรงกลาง */}
                <motion.div
                className="w-[50vh] h-[200vh] bg-[#338646] absolute"
                initial={{ x: 0, y: 0, opacity: 0.3 }}  // เริ่มจาง
                animate={{ 
                    x: ["0%", "40vw"], 
                    y: ["0%", "40vh"], 
                    rotate: 50, 
                    opacity: 1  // ค่อยๆ เข้มขึ้น
                }}
                transition={{
                    duration: 3,
                    type: "spring",
                }}
                />

                {/* ล่าง */}
                <motion.div
                className="w-[200vh] h-[50vh] bg-[#8cab93] absolute"
                initial={{ x: 0, y: 100, opacity: 0.3 }}
                animate={{ 
                    x: ["0%", "-25vw"], 
                    y: ["0%", "50vh"], 
                    rotate:  25, 
                    opacity: 1
                }}
                transition={{
                    duration: 3,
                    type: "spring",
                }}
                />

                {/* up */}
                <motion.div
                className="w-[50vh] h-[200vh] bg-[#8cab93] absolute"
                initial={{ x: -100, y: 0, opacity: 0.3 }}
                animate={{ 
                    x: ["0%", "45vw"], 
                    y: ["0%", "-50vh"], 
                    rotate: 135,
                    opacity: 1
                }}
                transition={{
                    duration: 3,
                    type: "spring",
                }}
                />

                {/* pictue */}
                <motion.div
                className="absolute top-[-80px] left-4"
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, type: "spring", delay: 0.5 }}>
                    <img
                    src="/images/horizontal-logo.png"
                    alt="Hubersity Logo"
                    className="max-w-[300px] md:max-w-[250px] h-auto"
                />
                </motion.div>
                <motion.div className="w-1/2 rounded-xl shadow-2xl p-8"
                initial={{backgroundColor: 'white', y: "100vw"}}
                animate={{backgroundColor: 'white', y: 0}}
                transition={{ duration: 1, type: "spring", bounce: 0.3 }}>

                <h1 className="text-3xl text-[#085e24]">Create Account</h1>
                {/* make 2 คอลัมน์ if com but 1 คอลัมน์ if in phone คอลัมน์ left picture right infomation of user*/}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-0 gap-y-4">
                    {/* left column */}
                    <div>
                        {/* box of picture */}
                        <div
                            className="w-40 h-40 rounded-full bg-[#f9f9f9] border-2 border-gray-300 flex items-center justify-center overflow-hidden
                                        mt-4"
                        >
                            {image ? (
                            <img
                                src={image}
                                alt="Profile preview"
                                className="w-full h-full object-cover"
                            />
                            ) : (
                            <span className="text-gray-500 text-sm">No Photo</span>
                            )}
                        </div>
                        {/* ปุ่มเปลี่ยนรูป */}
                        <button
                            onClick={openFilePicker}
                            className="flex items-center justify-center px-4 py-2 bg-[#8cab93] text-white rounded-full hover:opacity-90 transition mt-4 ml-2"
                        >
                            Change Photo
                        </button>
                        <input
                            id="profile-upload"
                            type="file"
                            accept="image/*"    // จำกัดเฉพาะไฟล์รูป
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>
                    {/* right column */}
                    <div>
                        {/* Display Name */}
                        <div className="flex items-center">
                            <h1>Display Name:</h1>
                            <input
                                type="text"
                                autoComplete= "Display Name"
                                className="w-[20vh] border-b-2 ml-2 focus:outline-none"/>
                        </div>
                        {/* date of brith */}
                        <div className="flex items-center mt-4">
                            <h1 className="mr-2">Date of Birth:</h1>
                            <input 
                                type="date"
                                autoComplete= "date of brith"
                                className="w-[20vh] border-b-2 ml-2 focus:outline-none" 
                            />
                        </div>
                        {/* BIO */}
                        <div className="flex items-center mt-4">
                            <h1>Bio:</h1>
                            <input
                                type="text"
                                autoComplete= "bio"
                                className="w-[30vh] h-[10vh] border-2 rounded-xl ml-4 focus:outline-none"/>
                        </div>

                        {/* Private */}
                        <label className="inline-flex items-center gap-2 cursor-pointer mt-4 mr-[15vh]">
                        <input
                            type="radio"
                            name="visibility"
                            value="private"
                            checked={privacy === "private"}
                            onChange={(e) => setPrivacy(e.target.value)}
                            className="h-4 w-4 accent-[#8cab93]"  /* สีปุ่ม */
                        />
                        <span className="text-gray-800">Private</span>
                        </label>

                        {/* Public */}
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="visibility"
                            value="public"
                            checked={privacy === "public"}
                            onChange={(e) => setPrivacy(e.target.value)}
                            className="h-4 w-4 accent-[#8cab93]"
                        />
                        <span className="text-gray-800">Public</span>
                        </label>
                        {/* choose uni */}
                        <div className="flex flex-col mt-4 mb-8">
                            <select
                                className="rounded-full bg-gray-200 text-black px-4 py-2 focus:outline-none focus:ring-2
                                cursor-pointer">

                                <option value="">What your University</option>
                                <option value="ku">Kasetsart University</option>
                                <option value="chula">Chulalongkorn University</option>
                                <option value="cmu">Chiang Mai University</option>
                                <option value="mahidol">Mahidol University</option>
                                <option value="mahidol">Thammasat University</option>
                             </select>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
