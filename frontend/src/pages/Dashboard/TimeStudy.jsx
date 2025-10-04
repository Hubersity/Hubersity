import React, { useState, useEffect, useRef } from "react";
import {PlayIcon, PauseIcon} from "@heroicons/react/24/outline";

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

  // xd9b useState(0) คืนค่า [0, function]
  // time ช่องเก็บค่าล่าสุด (state value), setTime ปุ่มรีโมทที่สั่ง React: “อัพเดตค่า + วาด UI ใหม่ด้วย”
  const [time, setTime] = useState(0); //เก้บเวลาที่นับ
  const [running, setrunning] = useState(false); // ดูว่าเล่นอยู่มั้ย
  const timerRef = useRef(null);

  // 1 ชั่วโมง = 60 นาที = 3600 วินาที = 3,600,000 มิลลิวินาที
  // % 24 เอาเศษจากการหาร 24 เพื่อให้ค่าอยู่ในช่วง 0–23 ชั่วโมง
  const hoursNum   = Math.floor(time / 3600) % 24;

  // time (ปกติเก็บเป็น มิลลิวินาที) / 60000 (มิลลิวินาที ) get นาที (1 นาที = 60,000 ms) have % (modulo) เพื่อให้ค่า ไม่เกิน 59 นาที
  //ex: (125 % 60) = 5 (ชั่วโมงจะถูกแยกไปอีกตัว)
  const minutesNum = Math.floor(time / 60) % 60;

  // time / 1000 milliseconds → seconds (วินาที)
  const secondsNum = time % 60;

  const hours   = String(hoursNum).padStart(2, "0");   // แปลงเป็น string ไว้โชว์ String(value).padStart(targetLength, padString)
  const minutes = String(minutesNum).padStart(2, "0"); // targetLength → ความยาวของ string ที่เราต้องการ
  const seconds = String(secondsNum).padStart(2, "0"); // padString → จะเติมอะไรที่ด้านหน้า (default คือ " " ช่องว่าง)

  // strat time
  const start_t = () => {
    // running === false → !running === true → เข้าเงื่อนไข
    if (!running) {
      setrunning(true);
      timerRef.current = setInterval(() => {
        //สร้างการนับเวลา ทุก ๆ 1 วินาที เพิ่มค่า seconds +1
        setTime((sce) => sce + 1);
      }, 1000);
    }
  }

  //pause time
  const pause_time = () => {
    setrunning(false); //stop time
    clearInterval(timerRef.current); // ไม่นังเวลาเพิ่ม ( ไม่ + 1 เพิ่ม )
  }

  //picture
  const picture_f = [
    "/images/ts_l0-rebg.png", // index 0
    "/images/ts_l1-rebg.png", // index 1
    "/images/ts_l2-rebg.png", // index 2
    "/images/ts_l3-rebg.png", // index 3
    "/images/ts_l4-rebg.png" //index 4
  ]

  let ShowPicture = picture_f[0] // default
  if (hoursNum === 0 && minutesNum === 0 && secondsNum === 0) ShowPicture = picture_f[0];
  else if (hoursNum <= 3) ShowPicture = picture_f[1];
  else if (hoursNum <= 6) ShowPicture = picture_f[2];
  else if (hoursNum <= 9) ShowPicture = picture_f[3];
  else ShowPicture = picture_f[4];

  return(
    <div>
      <h2 className="text-5xl font-bold self-end mb-8 mt-4">Today</h2>
        <div className="flex flex-col items-center gap-2 mt-12">
            <div className="flex gap-1 mt-4">
              {/* แสดงภาพเดียวตามเงื่อนไข */}
              <img src={ShowPicture} alt="study-status" className="w-full h-full object-contain" />
            </div>

          <span className="text-4xl font-bold mt-14">{`${hours}:${minutes}:${seconds}`}</span>
          
          <div className="flex gap-[20vh] mt-14">
            <button onClick={start_t}  className="bg-[#a0c4a8] hover:opacity-90 rounded-3xl px-8">
              <PlayIcon className="h-12 w-12 text-gray-700" />
            </button>
            <button onClick={pause_time} className="bg-[#a0c4a8] hover:opacity-90 rounded-3xl px-8">
                <PauseIcon className="h-12 w-12 text-gray-700" />
            </button>
          </div>
        </div>
    </div>
  );
}

function Text_InfoHour() {
  const items = [
    {color: "bg-[#a6a6a6]", label: "Study 0 hour"},
    {color: "bg-[#38b6ff]", label: "Study more than 0 seconds to 3 hours"},
    {color: "bg-[#fe9031]", label: "study between 3 to 6 hours"},
    {color: "bg-[#8c52ff]", label: "Study between 6 to 9 hours"},
    {color: "bg-[#ea4128]", label: "Study more than 9 hours"}
  ];

  return(
    <div className="mt-4 ml-2 text-lg space-y-2">
      {/* .map() = loop เพื่อแสดงแต่ละอัน (circle + label) */}
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
  const [month, setMonth] = useState(currentDate.getMonth() + 1); // เดือนปัจจุบัน (1-12)
  const [year, setYear] = useState(currentDate.getFullYear()); // ปีปัจจุบัน
  const [studyData, setStudyData] = useState({}); // ข้อมูลการศึกษาจาก backend

  // อาร์เรย์ชื่อเดือน
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // แปลงเดือนเป็นชื่อเดือนเต็ม month - 1 because array strat at 0
  const monthName = monthNames[month - 1];

  // ดึงข้อมูลการศึกษาจาก backend (ตัวอย่างข้อมูล)
  useEffect(() => {
    fetch("/api/get-study-data")
      .then((response) => response.json())
      .then((data) => setStudyData(data));
  }, [month, year]);

  // คำนวณจำนวนวันในเดือนที่เลือก
  const daysInMonth = getDaysInMonth(month, year);
  // คำนวณวันแรกของเดือน (0-6)
  const firstDay = getFirstDayOfMonth(month, year);

  // ฟังก์ชันสำหรับเปลี่ยนสีตามชั่วโมงการศึกษา
  const getColorForDay = (day) => {

    // สร้างวันที่แบบ 'yyyy-mm-dd' เพื่อใช้ในการเปรียบเทียบ
    const dayStr = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;

      // หากเป็นวันที่ก่อนวันปัจจุบัน ให้ไม่ใส่สี (คืนค่าสีโปร่งใส)
    if (dayStr > currentDayStr) 
      { return "bg-transparent"}; // ไม่มีสี

    // วงกลมสีเขียวถ้าเป็นวันนี้
    if (dayStr == currentDayStr)
      {return "bg-[#b7ddbf] rounded-full";}

    const hours = studyData[dayStr] || 0;

    if (hours === 0) {
      // เช็กว่าจริง ๆ แล้วยังไม่เริ่มหรือยัง
      const totalSeconds = (studyData[dayStr] || 0); 
      if (totalSeconds === 0) {
        return "bg-[#a6a6a6]"; // ยังไม่เริ่มเลย → เทา
      } else {
        return "bg-[#38b6ff]"; // เริ่มแล้วแต่ < 1 ชม. → ฟ้า
      }
    } else if (hours <= 3) {
      return "bg-[#38b6ff]";
    } else if (hours <= 6) {
      return "bg-[#fe9031]";
    } else if (hours <= 9) {
      return "bg-[#8c52ff]";
    } else {
      return "bg-[#ea4128]";
    }
  };

  const renderCalendar = () => {
    const days = [];
    let day = 1;

    // สร้างช่องว่างสำหรับสัปดาห์แรกตามวันที่เริ่มต้นของเดือน
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-[5vh] h-[5vh]" />);
    }

    // สร้างตัวเลขวันและวงกลมที่อยู่ใต้ตัวเลข
      for (let i = 0; i < daysInMonth; i++) {

        // สร้างวันที่ในรูปแบบ 'yyyy-mm-dd' เพื่อใช้ในการเปรียบเทียบ
        const dayStr = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;

        // เปรียบเทียบกับวันที่ปัจจุบัน
        const isnotCurrentDay = dayStr !== currentDayStr;
        const isCurrentDay = dayStr === currentDayStr;

          days.push(
            <div key={i} className="flex flex-col items-center justify-center p-2 w-[5vh] h-[5vh]">
              {/* ตัวเลขวัน */}
              <div className="font-bold">{day}</div>

              {/* วงกลมที่แสดงสีตามชั่วโมงการเรียน */}
              {/* <div className={`w-[5vh] h-[5vh] rounded-full ${getColorForDay(day)}`}></div> */}
              {isnotCurrentDay && ( // use && แทน if
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

  // ฟังก์ชันไปยังเดือนถัดไป
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1); // เพิ่มปีถ้าเดือนคือธันวาคม
    } else {
      setMonth(month + 1);
    }
  };

  // ฟังก์ชันไปยังเดือนก่อนหน้า
  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1); // ลดปีถ้าหากเดือนคือมกราคม
    } else {
      setMonth(month - 1);
    }
  };

  return (
    // <> when want to return many function</>
    <>
      <div className="flex gap-6 items-start">
        <div className="w-1/2 flex flex-col gap-6">
          <div className="bg-[#fffbf5] rounded-xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-4">
              <div className="font-bold text-3xl">
                <span>{`${monthNames[month - 1]} ${year}`}</span>
              </div>
              <div className="text-3xl">
                <button onClick={prevMonth} className="ml-4"> &lt; </button>
                <button onClick={nextMonth} className="ml-4"> &gt; </button>
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
            {/* Legend อยู่ข้างนอก calendar box (info about color in each hour)*/}
            <Text_InfoHour />
          </div>
        </div>

         {/* box of count time */}
         <div className="w-1/2 h-[87vh] sticky top-0 bg-[#fffbf5] rounded-xl shadow-2xl p-4 overflow-auto">
           <CountTime />
        </div>
      </div>
    </>
   );
}
export default Calendar;