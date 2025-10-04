import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Sign_in from './pages/Sign in/Sign_in';
import Dashboard from './pages/Dashboard/Dashboard';
import Board from './pages/Dashboard/Board';
import TimeStudy from './pages/Dashboard/TimeStudy';
import CreateAcc from "./pages/Create-account/create-acc.jsx";
import Account from './pages/Dashboard/Account';
import Follow from './pages/Dashboard/Follow';
import Chat from './pages/Dashboard/Chat';
import Notifications from './pages/Dashboard/Notifications'; // ✅ เพิ่ม import หน้าแจ้งเตือน

function App() {
  return (
    <Routes>
      {/* 🏠 หน้าแรก */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signin" element={<Sign_in />} />

      {/* 🧭 Dashboard Layout */}
      <Route path="/app" element={<Dashboard />}>
        {/* default → /app/board */}
        <Route index element={<Navigate to="board" replace />} />

        <Route path="board" element={<Board />} />
        <Route path="time-study" element={<TimeStudy />} />
      </Route>

      {/* creata account */}
      <Route path="/create-account" element={<CreateAcc />} />

        <Route path="follow" element={<Follow />} />
        <Route path="chat" element={<Chat />} />
        <Route path="notification" element={<Notifications />} /> {/* 🔔 เพิ่ม Notifications path */}
        <Route path="account" element={<Account />} />
      </Route>

      {/* ❌ ถ้าเส้นทางไม่ถูก → กลับไปหน้าแรก */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;