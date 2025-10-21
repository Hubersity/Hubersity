import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Login() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ ฟังก์ชัน login (ใช้ JSON)
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const apiUrl = `${import.meta.env.VITE_API_URL}/login`;
    console.log("🔗 Sending login request to:", apiUrl);

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      console.log("📡 Response status:", res.status);

      if (!res.ok) {
        const errMsg =
          res.status === 403
            ? "Invalid email or password"
            : "Cannot connect to server";
        setError(errMsg);
        console.warn("❌ Login failed:", res.status, errMsg);
        return;
      }

      const data = await res.json();
      console.log("✅ Login success:", data);

      localStorage.setItem("user", JSON.stringify(data));
      navigate("/app/board");
    } catch (err) {
      console.error("🚨 Connection error:", err);
      setError("Cannot connect to server");
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f6ec] flex relative overflow-hidden">
      {/* เส้นตกแต่งด้านซ้าย */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, type: "spring" }}
        className="absolute border-[2vh] border-[#3ab153] rounded-full 
        border-b-transparent border-r-transparent border-l-transparent rotate-[135deg]"
        style={{ top: "-5vh", left: "-15vw", width: "65vw", height: "65vw" }}
      />

      {/* เส้นเขียว top */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2, type: "spring", delay: 0.2 }}
        className="absolute border-[2vh] border-[#3ab153] rounded-full
        border-l-transparent border-r-transparent border-t-transparent rotate-[135deg]"
        style={{ top: "8vh", left: "4vw", width: "55vw", height: "55vw" }}
      />

      {/* วงกลมซ้ายล่าง */}
      <motion.div
        initial={{ opacity: 0, x: -200, y: 200 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1, type: "spring", delay: 0.4 }}
        className="absolute bg-[#2c9a43] rounded-full z-0"
        style={{ top: "75vh", right: "85vw", width: "20vw", height: "20vw" }}
      />
      <motion.div
        initial={{ opacity: 0, x: -150, y: 150 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1, type: "spring", delay: 0.6 }}
        className="absolute bg-[#00bf63] rounded-full z-0"
        style={{ top: "90vh", right: "80vw", width: "10vw", height: "10vw" }}
      />

      {/* วงกลมขวาบน */}
      <motion.div
        initial={{ opacity: 0, x: 200, y: -200 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1, type: "spring", delay: 0.8 }}
        className="absolute bg-[#30a148] rounded-full z-0"
        style={{ top: "-5vh", right: "45vw", width: "15vw", height: "15vw" }}
      />
      <motion.div
        initial={{ opacity: 0, x: 150, y: -150 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1, type: "spring", delay: 0.9 }}
        className="absolute bg-[#0a5f24] rounded-full z-0"
        style={{ top: "-8vh", right: "55vw", width: "12vw", height: "12vw" }}
      />

      {/* โลโก้ฝั่งซ้าย */}
      <motion.div
        className="w-1/2 flex justify-center items-center"
        initial={{ opacity: 0, y: -150, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, type: "spring", bounce: 0.5, delay: 0.9 }}
      >
        <img
          src="/images/Vertical-logo.png"
          className="max-w-[400px] md:max-w-[500px] h-auto"
        />
      </motion.div>

      {/* กล่อง login ฝั่งขวา */}
      <motion.div
        className="w-1/2 bg-white flex items-center justify-center rounded-l-[50px] shadow-2xl z-10"
        initial={{ opacity: 0, x: 150 }}
        animate={{ opacity: 1, x: 0, scale: [0.98, 1] }}
        transition={{ duration: 0.9, type: "spring", bounce: 0.35, delay: 1.2 }}
      >
        <div className="w-full max-w-[500px] px-12 py-16">
          <h1 className="text-6xl md:text-7xl text-[#085e24] font-extrabold text-center mb-10 drop-shadow-lg">
            Login
          </h1>

          <form className="flex flex-col gap-8 p-6" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-[18px] md:text-[22px] border-black border-b-2 focus:outline-none"
              required
            />

            {/* Password input */}
            <div className="flex flex-col">
              <div className="flex items-center border-b-2 border-black">
                <input
                  type={show ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-[18px] md:text-[22px] outline-none"
                  required
                />
                {show ? (
                  <EyeIcon
                    className="h-6 w-6 text-gray-500 cursor-pointer"
                    onClick={() => setShow(false)}
                  />
                ) : (
                  <EyeSlashIcon
                    className="h-6 w-6 text-gray-500 cursor-pointer"
                    onClick={() => setShow(true)}
                  />
                )}
              </div>

              {error && (
                <p className="text-[#e74c3c] text-sm mt-2 text-left">{error}</p>
              )}
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-[#8cab93] text-center py-3 px-12 text-xl md:text-2xl hover:opacity-90 transition block w-full shadow-md"
            >
              Login
            </motion.button>

            <div className="flex justify-between text-sm mt-3">
              <label className="flex gap-2">
                <input type="checkbox" className="accent-[#8cab93]" />
                Remember me
              </label>

              <a href="forgot.jsx" className="hover:text-[#4caf50] transition">
                Forgot password?
              </a>
            </div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/signup"
                className="rounded-full bg-[#8cab93] text-center py-3 px-12 text-lg md:text-xl hover:opacity-90 transition block mx-auto w-fit shadow-md"
              >
                Sign Up
              </Link>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}