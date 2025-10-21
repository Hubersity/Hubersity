// import React, { useState, useEffect} from "react";
// import {
//     BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
// } from "recharts";

// const allTags = [
//   { name: "foodaroundTU", num: 350},
//   { name: "KU85", num: 330},
//   { name: "AroundCU", num: 304},
//   { name: "FindRoommate", num: 315},
//   { name: "tonightPround", num: 365},
//   { name: "ISP", num: 370},
//   { name: "foodie", num: 220 },
//   { name: "travelgram", num: 180 },
//   { name: "fitnesslife", num: 160 },
//   { name: "studentlife", num: 140 },
//   { name: "codinglife", num: 250 },
//   { name: "technews", num: 190 },
//   { name: "studygram", num: 230 },
//   { name: "digitalart", num: 120 },
//   { name: "musicvibes", num: 170 },
//   { name: "gamerzone", num: 260 },
//   { name: "naturelove", num: 110 },
//   { name: "petlover", num: 90 },
//   { name: "weekendmood", num: 210 },
//   { name: "fashiondaily", num: 150 },
//   { name: "bookclub", num: 130 },
//   { name: "mindfulness", num: 180 },
//   { name: "photography", num: 300 },
//   { name: "startupideas", num: 240 },
//   { name: "productivity", num: 200 },
//   { name: "selfgrowth", num: 190 },
//   { name: "unilife", num: 170 },
//   { name: "devcommunity", num: 280 },
//   { name: "aiupdates", num: 110 },
//   { name: "blockchain", num: 150 },
//   { name: "datascience", num: 260 },
//   { name: "mentalhealth", num: 140 },
//   { name: "artanddesign", num: 200 },
//   { name: "gamejam", num: 100 },
//   { name: "codingchallenge", num: 270 },
//   { name: "musicfestival", num: 160 },
// ];


// export default function Tags() {
//   // คัดลอก และ sort แบบไม่เปลี่ยนต้นฉบับ
//   const sorted = [...allTags].sort((a, b) => b.num - a.num);
//   // แยก top6 and other
//   const top6 = sorted.slice(0, 6);
//   const others = sorted.slice(6);

//   // color of top 6
//   // const colors = ["#99cdd8", "#daebe3", "#fde8d3", "#f3c3b2", "#cfd6c4", "#868f74"];
//   // const colors = ["#74b995", "#88c3a4", "#9ccdb3", "#b0d7c3", "#c3e1d2", "#d7ebe1"];
//   const colors = ["#4b6043", "#75975e", "#95bb72", "#b3cf99", "#c7ddb5", "#ddead1"];

//   // const [loading, setLoading] = useState(true);
//   const [offset, setOffset] = useState(0);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [tags, setTags] = useState([]);
//   const [hasMore, setHasMore] = useState(true);
//   const [error, setError] = useState(null);
//   const PAGE_SIZE = 12;

//   // เมื่อคอมโพเนนท์ mount ให้โหลดหน้าแรกของ others
//   useEffect(() => {
//     const initial = others.slice(0, PAGE_SIZE);
//     setTags(initial);
//     setOffset(initial.length);
//     setHasMore(others.length > initial.length);
//   }, []); // run once

//   // โหลดโพสต์เพิ่ม
//   // โหลดเพิ่มจาก `others` (ไม่ใช่ MOCK_USER_POSTS)
//   async function handleLoadMore() {
//     if (loadingMore) return;
//     setLoadingMore(true);
//     try {
//       // จำลองดีเลย์ ถ้าต้องการ
//       await new Promise((r) => setTimeout(r, 200));
//       const next = others.slice(offset, offset + PAGE_SIZE);
//       setTags((prev) => [...prev, ...next]);
//       const newOffset = offset + next.length;
//       setOffset(newOffset);
//       setHasMore(others.length > newOffset);
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setLoadingMore(false);
//     }
//   }

//   return (
//     <div>
//       <div className="flex flex-row">
//         {/* Bar Chart */}
//         <div className="w-3/4 h-[80vh] bg-[#fdfaf6] rounded-xl shadow-2xl mt-8 p-6">
//           <h1 className="text-2xl font-semibold mb-4">6 popular tags</h1>
//           <ResponsiveContainer width="100%" height="85%"> 
//           {/* ช่วยให้กราฟปรับขนาดอัตโนมัติ ตามพื้นที่ของ parent */}
//             <BarChart layout="vertical" data={top6} margin={{ top: 10, right: 30, left: 100, bottom: 10 }}>
//               <CartesianGrid strokeDasharray="3 3" />
//               {/* เพิ่มเส้นตารางแบบขีดจุดในพื้นหลังกราฟ */}
//               <YAxis type="category" dataKey="name" angle={-30}/>
//               <XAxis type="number" />
//               <Tooltip />
//               <Bar dataKey="num" radius={[8, 8, 0, 0]}>
//                 {top6.map((entry, index) => (
//                   <Cell key={`cell-${entry.name}-${index}`} fill={colors[index % colors.length]} />
//                 ))}
//               </Bar>
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//         {/* show tags */}
//         <div className="w-1/4 bg-[#fdfaf6] rounded-xl shadow-2xl mt-8 ml-2">
//           <h3 className="text-md font-semibold mt-2 mb-3 ml-2">Other tags</h3>
//           <div className="grid grid-cols-1 gap-2">
//             {tags.map((tag) => (
//               <div key={tag.name} className="flex justify-between items-center px-3 py-2">
//                 <span className="truncate block" title={tag.name}>{tag.name}</span>
//                 {/* ตัดข้อความที่ยาวเกินกรอบ แล้วใส่ … ต่อท้ายอัตโนมัติ */}
//                 <span className="font-medium">{tag.num}</span>
//               </div>
//             ))}
//             {others.length === 0 && <div className="text-sm text-gray-500">No other tags</div>}
//           </div>
//           {/* load more */}
//           <div className="mt-4 flex justify-center">
//             {hasMore ? (
//             <button onClick={handleLoadMore} disabled={loadingMore} className="px-4 py-2 border mb-2">
//               {loadingMore ? "Loading…" : "Load more"}
//               </button>
//               ) : (
//               <div className="text-sm text-gray-500">No more posts</div>
//               )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }