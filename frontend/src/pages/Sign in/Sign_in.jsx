import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Sign_in() {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();            // กันรีโหลด
    // go to careta acc page
    navigate("/create-account"); 
  };

  return (
    <div className="min-h-screen bg-[#f1f6ec] flex justify-center items-center relative overflow-hidden px-4">

      {/* เส้นเขียว */}
    <motion.div
    initial={{ opacity: 0, x: 200 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
    className="absolute border-[2vh] border-[#3ab153] rounded-full
    border-l-transparent border-r-transparent border-b-transparent rotate-[135deg]"
    style={{
        top: "90vh",
        right: "-10vw",
        width: "60vw",
        height: "60vw",
    }}
    />

      {/* วงกลมซ้ายล่าง */}
      <motion.div
        initial={{ opacity: 0, x: -150, y: 150 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
        className="absolute bg-[#2c9a43] rounded-full z-0"
        style={{ top: "75vh", right: "85vw", width: "20vw", height: "20vw" }}
      />
      <motion.div
        initial={{ opacity: 0, x: -120, y: 150 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, type: "spring", delay: 0.4 }}
        className="absolute bg-[#00bf63] rounded-full z-0"
        style={{ top: "90vh", right: "80vw", width: "10vw", height: "10vw" }}
      />

      {/* วงกลมขวาบน */}
      <motion.div
        initial={{ opacity: 0, x: 200, y: -200 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, type: "spring", delay: 0.6 }}
        className="absolute bg-[#30a148] rounded-full z-0"
        style={{ top: "-5vh", right: "-2vw", width: "15vw", height: "15vw" }}
      />
      <motion.div
        initial={{ opacity: 0, x: 150, y: -150 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, type: "spring", delay: 0.8 }}
        className="absolute bg-[#0a5f24] rounded-full z-0"
        style={{ top: "3vh", right: "-5vw", width: "12vw", height: "12vw" }}
      />

      {/* วงกลม gradient */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", delay: 1 }}
        className="absolute rounded-full bg-gradient-to-r from-green-400 to-lime-300 shadow-lg"
        style={{ top: "6vh", right: "8vw", width: "10vw", height: "10vw" }}
      />

      {/* โลโก้ */}
      <motion.div
        className="absolute top-[-80px] left-4"
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

      {/* กล่อง Sign Up */}
      <motion.div
        className="w-full max-w-lg md:max-w-2xl bg-white rounded-[70px] shadow-lg z-10"
        initial={{ opacity: 0, scale: 0.9, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, type: "spring", bounce: 0.4, delay: 1.2 }}
      >
        <div className="px-6 md:px-12 py-10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-10 p-12">
            <h1 className="text-7xl md:text-5xl lg:text-6xl text-[#085e24] font-bold text-center mb-10">
              Sign Up
            </h1>

            <input
              type="text"
              placeholder="User name"
              autoComplete="username"
              className="w-full text-[15px] md:text-[25px] lg:text-[30xl] border-black border-b-2 focus:outline-none"
            />

            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              className="w-full text-[15px] md:text-[25px] lg:text-[30xl] border-black border-b-2 focus:outline-none"
            />


            {/* Password */}
            <div className="flex items-center border-b-2 border-black">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Password"
                autoComplete="new-password"
                className="w-full text-[15px] md:text-[25px] lg:text-[30xl] focus:outline-none"
              />
              {showPwd ? (
                <EyeIcon className="h-6 w-6 text-gray-500 cursor-pointer" onClick={() => setShowPwd(false)} />
              ) : (
                <EyeSlashIcon className="h-6 w-6 text-gray-500 cursor-pointer" onClick={() => setShowPwd(true)} />
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex items-center border-b-2 border-black">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                autoComplete="new-password"
                className="w-full text-[15px] md:text-[25px] lg:text-[30xl] focus:outline-none"
              />
              {showConfirm ? (
                <EyeIcon className="h-6 w-6 text-gray-500 cursor-pointer" onClick={() => setShowConfirm(false)} />
              ) : (
                <EyeSlashIcon className="h-6 w-6 text-gray-500 cursor-pointer" onClick={() => setShowConfirm(true)} />
              )}
            </div>

            {/* ปุ่ม Sign up */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-[#8cab93] text-center py-3 px-12 text-lg md:text-2xl hover:opacity-90 transition block mx-auto w-fit"
            >
              Sign up
            </motion.button>

            {/* Google button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-5 py-2 rounded-lg hover:text-[#4caf50] transition block mx-auto w-fit text-black"
              onClick={() => {/* TODO: Google OAuth */}}
            >
              <FcGoogle className="text-2xl md:text-3xl" />
              <span className="text-lg md:text-2xl">Sign up with Google</span>
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}