import React, { useState, useEffect} from "react";
import {
    BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell
  } from "recharts";

const universityData = [
    { name: "Kasetsart", value: 430 },
    { name: "Mahidol", value: 380 },
    { name: "Chiang Mai", value: 250 },
    { name: "Chulalongkorn", value: 500 },
    { name: "Thammasat", value: 450 },
  ];

const weeklyData = [
    { day: "Mon", active: 120},
    { day: "Tue", active: 150},
    { day: "Wed", active: 200},
    { day: "Thu", active: 180},
    { day: "Fri", active: 220},
    { day: "Sat", active: 190},
    { day: "Sun", active: 160},
];

export default function Overview() {
    // เก็บจำนวนผู้ใช้
    const [userCount, setUserCount] = useState(0);
    const [numPosts, setNumPosts] = useState(0);
    const [numReports, setNumReports] = useState(0);
    const [numRepostsPost, setNumRepostsPost] = useState(0); 
    // State สำหรับจัดการ Loading
    const [isLoading, setIsLoading] = useState(true);
    // use useEffect for call API Backend

    // useEffect(() => {
    //     // assume http://backend-api.com/users  is url of API our wed
    //     const API_URL = "http://backend-api.com/users";

    //     async function fetchUsers() {
    //         try{
    //             // หยุดรอ ให้การแปลงข้อมูลเสร็จสมบูรณ์เสียก่อน
    //             const response = await fetch(API_URL);
                 
    //             // check that response it OK (ได้ข้อมูลกับมาแล้ว) or not
    //             if (!response.ok) {
    //                 throw new Error(`HTTP error! Status: ${response.status}`);
    //             }

    //             const data = await response.json();

    //             setNumUsers(data.totalUser || 0);
    //             // || 0 if result not be num > 0 the output will show
    //             setNumPosts(data.totalPosts || 0);
    //             setNumReports(data.reportedPostsCount || 0);
    //             setNumRepostsPost(data.totalReposts || 0);
    //         }
    //         catch (error) {
    //             // แจ้งเตือนเมื่อเกิดข้อผิดพลาด
    //             // console.error("Error fetching user data:", error);
    //             console.error("Error fetching metrics data:", error);
    //             setUserCount('Error');
    //             setNumPosts('Error');
    //             setNumReports('Error');
    //             setNumRepostsPost('Error');
    //         }
    //         finally{
    //             // สิ้นสุดสถานะ Loading ไม่ว่าจะสำเร็จหรือล้มเหลว
    //             setIsLoading(false);
    //         }
    //     }
    //     fetchUsers();
    // }, []); // Array ว่าง [] หมายถึงให้รัน Effect นี้เพียงครั้งเดียวหลังการ Render ครั้งแรก

    useEffect(() => {
        const fetchMetrics = async () => {
          try {
            // mock data for dev
            await new Promise(r => setTimeout(r, 200));
            const data = { totalUser: 1280, totalPosts: 340, reportedPostsCount: 22, totalReposts: 58 };
    
            setUserCount(data.totalUser);
            setNumPosts(data.totalPosts);
            setNumReports(data.reportedPostsCount);
            setNumRepostsPost(data.totalReposts);
          } catch (e) {
            console.error("Error fetching metrics data:", e);
            setUserCount("Error");
            setNumPosts("Error");
            setNumReports("Error");
            setNumRepostsPost("Error");
          } finally {
            setIsLoading(false);
          }
        };
        fetchMetrics();
      }, []);

    return(
        <div className="flex p-2 gap-4">

            <div className="flex flex-col gap-4">
                {/* === คอลัมน์ซ้าย (Column 1): สำหรับกล่องที่มีความสูงเท่ากัน === */}
                <div className="flex flex-row gap-4">
                    
                    {/* Box 1: Number of users (w-[25vw] h-[20vh]) */}
                    <div className="w-[25vw] h-[20vh] bg-[#fdfaf6] rounded-xl shadow-2xl">
                        <div className="flex flex-col h-full ml-4">
                            <h1 className="mt-4 text-xl">Number of users</h1>
                            <div className="flex justify-center items-center h-full -mt-6">
                                <div className="text-6xl font-bold">
                                    {isLoading ? "..." : userCount}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Box 2: Number of posts (w-[25vw] h-[20vh]) */}
                    <div className="w-[25vw] h-[20vh] bg-[#fdfaf6] rounded-xl shadow-2xl">
                        <div className="flex flex-col h-full ml-4">
                            <h1 className="mt-4 text-xl">Number of posts</h1>
                            <div className="flex justify-center items-center h-full -mt-6">
                                <div className="text-6xl font-bold">
                                    {isLoading ? "..." : numPosts}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Bar Chart */}
                <div className="w-[50vw] h-[60vh] bg-[#fdfaf6] rounded-xl shadow-2xl mt-8 p-6">
                    <h1 className="text-2xl font-semibold mb-4">Num of users in each university</h1>
                    <ResponsiveContainer width="100%" height="85%"> 
                    {/* ช่วยให้กราฟปรับขนาดอัตโนมัติ ตามพื้นที่ของ parent */}
                        <BarChart data={universityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            {/* เพิ่มเส้นตารางแบบขีดจุดในพื้นหลังกราฟ */}
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                {universityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} 
                                        fill={["#cbe3ca", "#b2d8e9", "#f0d7df", "#f2d3ce", "#efd5ba"][index % 5]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* === คอลัมน์ขวา (Column 2): สำหรับกล่องสถิติรายสัปดาห์ === */}
            <div className="flex flex-col gap-4">
                
                {/* Box 3: Weekly user statistics (w-[25vw] h-[50vh] - กล่องที่สูงกว่า) */}
                <div className="w-[25vw] h-[43vh] bg-[#fdfaf6] rounded-xl shadow-2xl">
                    {/* Line Chart for Weekly user statistics */}
                    <div className="w-[28vw] h-[43vh] bg-[#fdfaf6] rounded-xl shadow-2xl p-6 mb-4">
                        <h1 className="text-xl font-semibold mb-4">Weekly user statistics</h1>
                        <ResponsiveContainer width="100%" height="85%">
                            <LineChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="active"
                                    stroke="#c9c0b5"
                                    strokeWidth={3}
                                    name="Active Users"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="w-[28vw] h-[20vh] bg-[#fdfaf6] rounded-xl shadow-2xl">
                        <div className="flex flex-col h-full mb-4 ml-4">
                            <h1 className="mt-4 text-xl">Number of report posts</h1>
                            <div className="flex justify-center items-center h-full -mt-6">
                                <div className="text-6xl font-bold">
                                    {isLoading ? "..." : numRepostsPost}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-[28vw] h-[20vh] bg-[#fdfaf6] rounded-xl shadow-2xl">
                        <div className="flex flex-col h-full mt-4 ml-4">
                            <h1 className="mt-4 text-xl">Number of report users</h1>
                            <div className="flex justify-center items-center h-full -mt-6">
                                <div className="text-6xl font-bold">
                                    {isLoading ? "..." : numReports}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
  }
