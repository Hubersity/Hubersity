import React from "react";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
// นำเข้าไอคอน Google
import { FcGoogle } from "react-icons/fc";
export default function Sign_in() {
    const [show, setShow] = useState(false);
    return (
        <div className="min-h-screen bg-[#f1f6ec] flex justify-center items-center relative overflow-hidden px-4">

            {/* เส้นเขียว */}
            <div
                className="absolute border-[2vh] border-[#3ab153] rounded-full
                border-l-transparent border-r-transparent border-t-transparent rotate-[130deg]"
                style={{
                    top: "60vh",
                    right: "-35vw",
                    width: "60vw",
                    height: "60vw",
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
                    right: "-2vw",
                    width: "15vw",
                    height: "15vw",
                    }}
            />
            <div
                className="absolute bg-[#0a5f24] rounded-full z-0"
                style={{
                    top: "3vh",
                    right: "-5vw",
                    width: "12vw",
                    height: "12vw",
                }}
            />

            <div
                className="absolute rounded-full bg-gradient-to-r from-green-400 to-lime-300 shadow-lg"
                style={{
                    top: "6vh",
                    right: "8vw",
                    width: "10vw",
                    height: "10vw",
                }}
            />

            {/* ฝั่งซ้าย: Logo */}
            <div className="absolute top-[-80px] left-4">
            <img
            src="/images/horizontal-logo.png" // change to your logo path
            alt="Hubersity Logo"
            className="max-w-[300px] md:max-w-[250px] h-auto"
            />
            </div>

            <div className="w-full max-w-lg md:max-w-2xl bg-white rounded-[70px] shadow-lg z-10">
                <div className="px-6 md:px-12 py-10">


                    <form className="flex flex-col gap-10 p-12">
                        
                        <h1 className="text-7xl md:text-5xl lg:text-6xl text-[#085e24] font-bold text-center mb-10">Sign Up</h1>
                        
                        <input
                        type="name"
                        placeholder="User name"
                        className="w-full text-[15px] md:text-[25px] lg:text-[30xl] border-black border-b-2 focus:outline-none"
                        />

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
                            className="w-full text-[15px] md:text-[25px] lg:text-[30xl] focus:outline-none"
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

                        <div className="flex items-center border-b-2 border-black">
                            <input
                                type={show ? "text" : "password"}
                                placeholder="Confirm Password"
                                className="w-full text-[15px] md:text-[25px] lg:text-[30xl] focus:outline-none"
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
                            href="sigin"
                            className="rounded-full bg-[#8cab93] text-center py-3 px-12 text-lg md:text-2xl hover:opacity-90 transition block mx-auto w-fit">
                            Sign up
                        </a>

                        <button className="flex items-center gap-3 px-5 py-2 rounded-lg hover:text-[#4caf50] transition block mx-auto w-fit text-black">
                            <FcGoogle className="text-2xl md:text-3xl" />
                            <span className="text-lg md:text-2xl">Sign up with Google</span>
                        </button>

                    </form>

                </div>
            </div>
        </div>
    );
}
