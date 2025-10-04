import React, { useState, useEffect, useRef } from "react";
import { PlayIcon, PauseIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

// ฟังก์ชันคำนวณจำนวนวันในเดือนและปีที่ระบุ
const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

// ฟังก์ชันหาวันแรกของเดือน (0-6 คือ วันอาทิตย์ถึงเสาร์)
const getFirstDayOfMonth = (month, year) => {
  return new Date(year, month - 1, 1).getDay();
};

// สร้างวันที่ปัจจุบัน
const currentDate = new Date();
const currentDayStr = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1 < 10 ? `0${currentDate.getMonth() + 1}` : currentDate.getMonth() + 1}-${currentDate.getDate() < 10 ? `0${currentDate.getDate()}` : currentDate.getDate()}`;

function CountTime() {
  const [time, setTime] = useState(0); 
  const [running, setrunning] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const timerRef = useRef(null);
  const [sessionId, setSessionId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // === ฟังก์ชันเริ่ม session (start timer ใน backend) ===
  const startSession = async () => {
    try {
      const res = await fetch("http://localhost:8000/study/start?user_id=" + user?.uid, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.sid) setSessionId(data.sid);
      console.log("Session started:", data);
    } catch (err) {
      console.error("Start session failed:", err);
    }
  };

  // === ฟังก์ชันหยุด session (stop timer ใน backend) ===
  const stopSession = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`http://localhost:8000/study/stop/${sessionId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log("Session stopped:", data);
    } catch (err) {
      console.error("Stop session failed:", err);
    }
  };

  // start time (frontend)
  const start_t = async () => {
    if (!running) {
      await startSession();
      setrunning(true);
      timerRef.current = setInterval(() => {
        setTime((sce) => sce + 1);
      }, 1000);
    }
  };

  // pause time (frontend)
  const pause_time = async () => {
    setrunning(false);
    clearInterval(timerRef.current);
    await stopSession();
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
  else if (hoursNum <= 3) ShowPicture = picture_f[1];
  else if (hoursNum <= 6) ShowPicture = picture_f[2];
  else if (hoursNum <= 9) ShowPicture = picture_f[3];
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

function Calendar() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [studyData, setStudyData] = useState({});
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchCalendar = async () => {
    try {
      const res = await fetch(`http://localhost:8000/study/calendar/${user?.uid}/${year}/${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStudyData(data);
    } catch (err) {
      console.error("Fetch calendar failed:", err);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [month, year]);

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);

  const getColorForDay = (day) => {
    const dayStr = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
    if (dayStr > currentDayStr) return "bg-transparent";
    if (dayStr === currentDayStr) return "bg-[#b7ddbf] rounded-full";
    const dayData = studyData[dayStr];
    if (!dayData) return "bg-[#a6a6a6]";
    const hours = (dayData.total_minutes || 0) / 60;
    if (hours <= 0) return "bg-[#a6a6a6]";
    if (hours <= 3) return "bg-[#38b6ff]";
    if (hours <= 6) return "bg-[#fe9031]";
    if (hours <= 9) return "bg-[#8c52ff]";
    return "bg-[#ea4128]";
  };

  const renderCalendar = () => {
    const days = [];
    let day = 1;
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-[5vh] h-[5vh]" />);
    }
    for (let i = 0; i < daysInMonth; i++) {
      const dayStr = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
      const isnotCurrentDay = dayStr !== currentDayStr;
      const isCurrentDay = dayStr === currentDayStr;
      days.push(
        <div key={i} className="flex flex-col items-center justify-center p-2 w-[5vh] h-[5vh]">
          <div className="font-bold">{day}</div>
          {isnotCurrentDay && (
            <div className={`w-[5vh] h-[5vh] rounded-full ${getColorForDay(day)}`}></div>
          )}
          {isCurrentDay && (
            <div className={`w-[5vh] h-[5vh] rounded-full bg-[#b7ddbf]`}></div>
          )}
        </div>
      );
      day++;
    }
    return days;
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
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
          <CountTime />
        </div>
      </div>
    </>
  );
}
export default Calendar;