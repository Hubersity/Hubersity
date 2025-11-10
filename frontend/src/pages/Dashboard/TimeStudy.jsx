import React, { useState, useEffect, useRef } from "react";
import { PlayIcon, PauseIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

// สร้างวันที่ปัจจุบัน
// const currentDate = new Date();

function CountTime({ onAfterStop, onSyncSeconds, userObj, token }) {
  const [time, setTime] = useState(0); 
  const [running, setrunning] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const timerRef = useRef(null);
  const [sessionId, setSessionId] = useState(null);

  const baseSecsRef = useRef(0);        // วินาทีที่ commit แล้ว + extra ณ ตอน sync ล่าสุด
  const baseClientNowRef = useRef(0);   // เวลาเครื่อง ณ ตอน sync ล่าสุด

  // every time "time" เปลี่ยน ส่งขึ้น parent เพื่อทำสีปฏิทิน
  useEffect(() => {
    if (typeof onSyncSeconds === "function") onSyncSeconds(time);
  }, [time, onSyncSeconds]);

  useEffect(() => {
    if (!userObj?.uid || !token) return;
  
    (async () => {
      // 1) โหลดเวลาวันนี้ที่ commit แล้วใน DB
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth()+1).padStart(2,'0');
      const d = String(now.getDate()).padStart(2,'0');

      // 1) โหลดยอดที่ commit แล้ว
      const res1 = await fetch(`http://localhost:8000/study/progress/${userObj.uid}/${y}/${m}/${d}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const prog = await res1.json();
      const savedSecs = prog.total_seconds ?? (prog.total_minutes || 0) * 60;
  
      // 2) เช็คว่ามี session ค้างอยู่มั้ย
      const res2 = await fetch(`http://localhost:8000/study/active/${userObj.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const active = await res2.json();
  
      if (active.active) {
        setSessionId(active.sid);
  
        // ใช้เวลา server เพื่อลดปัญหา clock เพี้ยน
        const serverNow = new Date(active.server_now);
        const start = new Date(active.start_time);
  
        // กันข้ามเที่ยงคืน: นับเพิ่มเฉพาะส่วนที่ทับวันนี้
        const todayStart = new Date(serverNow);
        todayStart.setHours(0,0,0,0);
        const overlapStart = start > todayStart ? start : todayStart;
  
        // const extra = Math.max(0, Math.floor((serverNow - overlapStart) / 1000));
        const extra = Math.max(0, Math.floor((serverNow.getTime() - overlapStart.getTime()) / 1000));
        const show = savedSecs + extra;
        setTime(show);
        // เหมือนกด "กำลังวิ่ง"
        setrunning(true);
        // clear interval เก่า ก่อนตั้งใหม่
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          // แค่เพิ่ม time; effect ด้านบนจะ sync ให้ parent เอง
          setTime((prev) => prev + 1);
        }, 1000);
      } else {
        setTime(savedSecs);
        setrunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    })();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [userObj?.uid, token]);

  const startSession = async () => {
    if (!userObj?.uid || !token) return;
    try {
      const res = await fetch(`http://localhost:8000/study/start?user_id=${userObj.uid}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.sid) setSessionId(data.sid);
    } catch (err) { console.error("Start session failed:", err); }
  };

  const start_t = async () => {
    if (running) return;
    if (!userObj?.uid || !token) return;
  
    await startSession();
    setrunning(true);
  
    // เคลียร์ interval เก่าก่อนกันซ้อน
    if (timerRef.current) clearInterval(timerRef.current);
  
    // ✅ เพิ่มแค่ time; effect ด้านบนจะ sync ให้ parent เอง
    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
  };

  const pause_time = async () => {
    setrunning(false);
    clearInterval(timerRef.current);
    if (!sessionId || !token) return;
  
    try {
      const res = await fetch(`http://localhost:8000/study/stop/${sessionId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (res.ok) {
        const data = await res.json(); // รวม commit แล้ว
        const secs = data.total_seconds ?? (data.total_minutes || 0) * 60;
        setTime(secs); // แค่ setTime; effect จะ sync ให้เอง
      } else {
        console.error("Stop failed", res.status);
      }
    } catch (e) {
      console.error("Pause error:", e);
    }
  
    // ✅ ดีเฟอร์เพื่อเลี่ยง warning update ข้าม component
    setTimeout(() => onAfterStop?.(), 0);
  };

  // picture system
  const picture_f = [
    "/images/ts_l0-rebg.png",
    "/images/ts_l1-rebg.png",
    "/images/ts_l2-rebg.png",
    "/images/ts_l3-rebg.png",
    "/images/ts_l4-rebg.png"
  ];

  const hoursNum = Math.floor(time / 3600) % 24;
  const minutesNum = Math.floor(time / 60) % 60;
  const secondsNum = time % 60;
  const hours = String(hoursNum).padStart(2, "0");
  const minutes = String(minutesNum).padStart(2, "0");
  const seconds = String(secondsNum).padStart(2, "0");

  let ShowPicture = picture_f[0];
  if (hoursNum === 0 && minutesNum === 0 && secondsNum === 0) ShowPicture = picture_f[0];
  else if (hoursNum < 3) ShowPicture = picture_f[1];
  else if (hoursNum < 6) ShowPicture = picture_f[2];
  else if (hoursNum < 9) ShowPicture = picture_f[3];
  else ShowPicture = picture_f[4];

  return (
    <div>
      <h2 className="text-5xl font-bold self-end mb-8 mt-4">Today</h2>
      <div className="flex flex-col items-center gap-2 mt-12">
        <div className="flex gap-1 mt-4">
          <img src={ShowPicture} alt="study-status" className="w-full h-full object-contain" />
        </div>

        <span className="text-4xl font-bold mt-14">{`${hours}:${minutes}:${seconds}`}</span>

        <div className="flex gap-[20vh] mt-14">
          <motion.button
            type="button"
            onClick={() => {
              start_t();
              setActiveButton("play");
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`rounded-3xl px-8 transition ${activeButton === "play" ? "bg-[#6aa484]" : "bg-[#a0c4a8]"} hover:opacity-90`}
          >
            <PlayIcon className="h-12 w-12 text-gray-700" />
          </motion.button>

          <motion.button
            type="button"
            onClick={() => {
              pause_time();
              setActiveButton("pause");
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`rounded-3xl px-8 transition ${activeButton === "pause" ? "bg-[#6aa484]" : "bg-[#a0c4a8]"} hover:opacity-90`}
          >
            <PauseIcon className="h-12 w-12 text-gray-700" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function Text_InfoHour() {
  const items = [
    { color: "bg-[#a6a6a6]", label: "Study 0 hour" },
    { color: "bg-[#38b6ff]", label: "Study more than 0 seconds to 3 hours" },
    { color: "bg-[#fe9031]", label: "study between 3 to 6 hours" },
    { color: "bg-[#8c52ff]", label: "Study between 6 to 9 hours" },
    { color: "bg-[#ea4128]", label: "Study more than 9 hours" },
  ];

  return (
    <div className="mt-4 ml-2 text-lg space-y-2">
      {items.map((items, index) => (
        <div key={index} className="flex items-center gap-4">
          <span className={`w-4 h-4 rounded-full ${items.color}`} />
          <span>{items.label}</span>
        </div>
      ))}
    </div>
  );
}

// helpers
const getTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function Calendar() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [studyData, setStudyData] = useState({});

  // โหลด user/token จาก localStorage ใน parent (ครั้งเดียว)
  const [userObj, setUserObj] = useState(null);
  const [token, setToken] = useState(null);

  // const [todaySeconds, setTodaySeconds] = useState(0);

  const [todayStr, setTodayStr] = useState(getTodayStr());
  const [todaySeconds, setTodaySeconds] = useState(0);
  
    // // กันเครื่องนอน/แท็บแช่ยาว: sync todayStr ทุก ๆ 1 นาที
    // useEffect(() => {
    //   const id = setInterval(() => setTodayStr(getTodayStr()), 60_000);
    //   return () => clearInterval(id);
    // }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = JSON.parse(localStorage.getItem("user") || "null");
    const t = localStorage.getItem("token");
    setUserObj(u);
    setToken(t);
  }, []);

  // useEffect(() => {
  //   const tickToMidnight = () => {
  //     const now = new Date();
  //     const next = new Date(now);
  //     next.setHours(24, 0, 0, 0); // เที่ยงคืนถัดไป
  //     return next.getTime() - now.getTime();
  //   };
  
  //   let t = setTimeout(async () => {
  //     // 1) ถ้ามี session กำลังวิ่ง → ให้ CountTime หยุดอัตโนมัติ
  //     // (ถ้ายังไม่มีระบบ onAutoStop ก็แค่ reload calendar พอ)
  //     await fetchCalendar(); // รีโหลดสีทั้งเดือน (วันที่เก่า update)
  //     setTodaySeconds(0);    // รีเซ็ต counter ของวันใหม่
  //   }, tickToMidnight());
  
  //   return () => clearTimeout(t);
  // }, [userObj?.uid, token, month, year]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchCalendar = async () => {
    if (!userObj?.uid || !token) return;
    try {
      const res = await fetch(`http://localhost:8000/study/calendar/${userObj.uid}/${year}/${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`calendar ${res.status}`);
      const data = await res.json();
      setStudyData(data);
    } catch (err) {
      console.error("Fetch calendar failed:", err);
    }
  };

  useEffect(() => {
    const msToNextMidnight = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      return next.getTime() - now.getTime();
    };
    const t = setTimeout(() => {
      setTodayStr(getTodayStr());
      setTodaySeconds(0);
      fetchCalendar();
    }, msToNextMidnight());
    return () => clearTimeout(t);
  }, [userObj?.uid, token, month, year]);

  // กันเครื่องนอน/แท็บแช่ยาว: sync todayStr ทุก ๆ 1 นาที
  useEffect(() => {
    const id = setInterval(() => setTodayStr(getTodayStr()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetchCalendar();
  }, [month, year, userObj?.uid, token]);

  // --- สีของแต่ละวัน ---
  const currentDayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  // const getColorForDay = (day) => {
  //   const dayStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  //   if (dayStr > currentDayStr) return "bg-transparent"; // อนาคต

  //   if (dayStr === currentDayStr) {
  //     const hoursLive = todaySeconds / 3600;
  //     if (hoursLive <= 0) return "bg-[#a6a6a6]";
  //     if (hoursLive < 3) return "bg-[#38b6ff]";
  //     if (hoursLive < 6) return "bg-[#fe9031]";
  //     if (hoursLive < 9) return "bg-[#8c52ff]";
  //     return "bg-[#ea4128]";
  //   }

  //   const dayData = studyData[dayStr];
  //   if (!dayData) return "bg-[#a6a6a6]";
  //   const secs = dayData.total_seconds ?? (dayData.total_minutes || 0) * 60;
  //   const hours = secs / 3600;
  //   if (hours <= 0) return "bg-[#a6a6a6]";
  //   if (hours < 3) return "bg-[#38b6ff]";
  //   if (hours < 6) return "bg-[#fe9031]";
  //   if (hours < 9) return "bg-[#8c52ff]";
  //   return "bg-[#ea4128]";
  // };


  // ใช้ todayStr ในการระบายสี
  const getColorForDay = (day) => {
    const dayStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

    if (dayStr > todayStr) return "bg-transparent"; // อนาคต

    if (dayStr === todayStr) {
      const hoursLive = todaySeconds / 3600;
      if (hoursLive <= 0) return "bg-[#a6a6a6]";
      if (hoursLive < 3) return "bg-[#38b6ff]";
      if (hoursLive < 6) return "bg-[#fe9031]";
      if (hoursLive < 9) return "bg-[#8c52ff]";
      return "bg-[#ea4128]";
    }

    const dayData = studyData[dayStr];
    if (!dayData) return "bg-[#a6a6a6]";
    const secs = dayData.total_seconds ?? (dayData.total_minutes || 0) * 60;
    const hours = secs / 3600;
    if (hours <= 0) return "bg-[#a6a6a6]";
    if (hours < 3) return "bg-[#38b6ff]";
    if (hours < 6) return "bg-[#fe9031]";
    if (hours < 9) return "bg-[#8c52ff]";
    return "bg-[#ea4128]";
  };

  const renderCalendar = () => {
    const days = [];
    let day = 1;
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-[5vh] h-[5vh]" />);
    }
    for (let i = 0; i < daysInMonth; i++) {
      const dayStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      const isCurrentDay = dayStr === currentDayStr;
      days.push(
        <div key={i} className="flex flex-col items-center justify-center p-2 w-[5vh] h-[5vh]">
          <div className="font-bold">{day}</div>
          <div className={`w-[5vh] h-[5vh] rounded-full ${getColorForDay(day)} ${isCurrentDay ? "ring-2 ring-[#b7ddbf]" : ""}`} />
        </div>
      );
      day++;
    }
    return days;
  };

  const nextMonth = () => {
    setMonth(m => {
      if (m === 12) { setYear(y => y + 1); return 1; }
      return m + 1;
    });
  };

  const prevMonth = () => {
    setMonth(m => {
      if (m === 1) { setYear(y => y - 1); return 12; }
      return m - 1;
    });
  };

  return (
    <>
      <div className="flex gap-6 items-start">
        <div className="w-1/2 flex flex-col gap-6">
          <div className="bg-[#fffbf5] rounded-xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-4">
              <div className="font-bold text-3xl">
                <span>{`${monthNames[month - 1]} ${year}`}</span>
              </div>
              <div className="text-3xl">
                <button onClick={prevMonth} className="ml-4">
                  {" "}
                  &lt;{" "}
                </button>
                <button onClick={nextMonth} className="ml-4">
                  {" "}
                  &gt;{" "}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-4">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, index) => (
                <div key={index} className="font-bold text-center">
                  {day}
                </div>
              ))}
              {renderCalendar()}
            </div>
          </div>
          <div className="self-start">
            <Text_InfoHour />
          </div>
        </div>
        <div className="w-1/2 h-[87vh] sticky top-0 bg-[#fffbf5] rounded-xl shadow-2xl p-4 overflow-auto">
          {userObj?.uid && token ? (
            <CountTime onAfterStop={fetchCalendar} onSyncSeconds={setTodaySeconds} userObj={userObj} token={token} />
          ) : (
            <div className="text-sm text-gray-500">Loading user...</div>
          )}
        </div>
      </div>
    </>
  );
}
export default Calendar;