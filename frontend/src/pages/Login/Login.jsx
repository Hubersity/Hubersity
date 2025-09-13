import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
export default function Login() {
    const [show, setShow] = useState(false);
    return (
      <div className="min-h-screen bg-[#f1f6ec] flex relative overflow-hidden">

        {/* เส้นๆ สีเขียว bottom*/}
        <div
          className="absolute border-[2vh] border-[#3ab153] rounded-full 
          border-b-transparent border-r-transparent border-l-transparent rotate-[135deg]"
          style={{
            top: "-5vh",
            left: "-15vw",
            width: "65vw",
            height: "65vw",
          }}
        />


        {/* เส้นเขียว top */}
        <div
          className="absolute border-[2vh] border-[#3ab153] rounded-full
          border-l-transparent border-r-transparent border-t-transparent rotate-[135deg]"
          style={{
            top: "-3vh",
            left: "-2vw",
            width: "55vw",
            height: "55vw",
          }}
        />

        {/* ตกแต่งซ้ายล่าง */}
        <div
          className="absolute bg-[#2c9a43] rounded-full z-0"
          style={{
            top: "75vh",
            right: "85vw",
            width: "20vw",
            height: "20vw",
          }}
        />
        <div
          className="absolute bg-[#00bf63] rounded-full z-0"
          style={{
            top: "90vh",
            right: "80vw",
            width: "10vw",
            height: "10vw",
          }}
        />

        {/* ตกแต่งบนขวา */}
        <div
          className="absolute bg-[#30a148] rounded-full z-0"
          style={{
            top: "-5vh",
            right: "55vw",
            width: "15vw",
            height: "15vw",
          }}
        />
        <div
          className="absolute bg-[#0a5f24] rounded-full z-0"
          style={{
            top: "-8vh",
            right: "65vw",
            width: "12vw",
            height: "12vw",
          }}
/>

        {/* ฝั่งซ้าย: Logo */}
        <div className="w-1/2 flex justify-center items-center">
          <img
            src="/images/Vertical-logo.png"
            className="max-w-[400px] md:max-w-[500px]h-auto"
          />
        </div>
  
        {/* ฝั่งขวา: กล่อง Login */}
        <div className="w-3/4 bg-white flex items-center justify-center rounded-l-[50px] shadow-lg z-10">
          <div className="w-full max-w-[700px] px-20 py-24">
            <h1 className="text-5xl md:text-6xl lg:text-7xl text-[#085e24] font-bold text-center">
              Login
            </h1>
  
            <form className="flex flex-col gap-10 p-10">
              <input
                type="email"
                placeholder="Email"
                className="w-full text-[15px] md:text-[25px] lg:text-[30xl] border-black border-b-2 focus:outline-none"
              />

                {/* Password input with EyeSlashIcon */}
                <div className="flex items-center border-b-2 border-black">
                <input
                    type={show ? "text" : "password"}
                    placeholder="Password"
                    className="w-full text-[15px] md:text-[25px] lg:text-[30xl] outline-none"
                />
                {show ? (
                    <EyeIcon
                    className="h-6 w-6 text-gray-500 cursor-pointer"
                    onClick={() => setShow(false)}
                    />) : (<EyeSlashIcon
                    className="h-6 w-6 text-gray-500 cursor-pointer"
                    onClick={() => setShow(true)}
                    />)}
                </div>

  
              <a
                href="main.jsx"
                className="rounded-full bg-[#8cab93] text-center py-3 px-12 text-lg md:text-2xl hover:opacity-90 transition block w-full"
              >
                Login
              </a>
  
              <div className="flex justify-between text-sm">
                <label className="flex gap-2">
                  <input type="checkbox" className="accent-[#8cab93]" />
                  Remember me
                </label>
  
                <a
                  href="forgot.jsx"
                  className="hover:text-[#4caf50] transition"
                >
                  Forgot Password?
                </a>
              </div>
  
              <a
                href="sigin"
                className="rounded-full bg-[#8cab93] text-center py-3 px-12 text-lg md:text-2xl hover:opacity-90 transition block mx-auto w-fit"
              >
                Sign in
              </a>
            </form>
          </div>
        </div>
      </div>
    );
  }