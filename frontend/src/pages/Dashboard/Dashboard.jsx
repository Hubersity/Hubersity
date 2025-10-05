import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Clock, Users, MessageSquare, Bell, User } from "lucide-react";
import { getCurrentUser } from "../../api/user"; 

const navItems = [
  { to: "/app/board", label: "Board", icon: Home },
  { to: "/app/time-study", label: "Time study", icon: Clock },
  { to: "/app/follow", label: "Follow", icon: Users },
  { to: "/app/chat", label: "Chat", icon: MessageSquare },
  { to: "/app/notification", label: "Notification", icon: Bell },
  { to: "/app/account", label: "Account", icon: User },
];

function Topbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const data = await getCurrentUser();
      if (data) setUser(data);
    }
    fetchUser();
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-20 border-b bg-white shadow h-16 flex items-center justify-between px-6">
      {/* โลโก้ */}
      <img
        src="/images/horizontal-logo.png"
        alt="Hubersity"
        className="h-[120px] w-auto"
      />

      {/* ไอคอนด้านขวา */}
      <div className="flex items-center gap-6">
        {/* กดเข้าแชท */}
        <Link to="/app/chat">
          <MessageSquare
            size={22}
            className="cursor-pointer hover:text-emerald-600 transition"
          />
        </Link>

        {/* กดเข้าแจ้งเตือน */}
        <Link to="/app/notification">
          <div className="relative">
            <Bell
              size={22}
              className="cursor-pointer hover:text-emerald-600 transition"
            />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>
          </div>
        </Link>

        {/* โปรไฟล์จริงจาก backend */}
        <Link
          to="/app/account"
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
        >
          <img
            src={user?.profile_image || "/images/default-avatar.png"}
            alt="profile"
            className="w-9 h-9 rounded-full object-cover border border-gray-200"
          />
          <span className="text-sm text-slate-700 font-medium">
            {user?.username || "Loading..."}
          </span>
        </Link>
      </div>
    </div>
  );
}

// Sidebar
function Sidebar() {
  const location = useLocation();
  return (
    <div className="fixed top-16 left-0 w-56 h-[calc(100vh-64px)] bg-white border-r shadow pt-6">
      <nav className="flex flex-col">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-5 py-3 transition-all w-full ${
                active
                  ? "bg-[#e0ebe2] text-emerald-700 font-semibold"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// Layout หลัก Dashboard
export default function Dashboard() {
  return (
    <div className="flex">
      <Topbar />
      <Sidebar />
      <main className="flex-1 p-6 bg-[#fafafa] overflow-y-auto ml-56 mt-16 h-[calc(100vh-64px)]">
        <Outlet />
      </main>
    </div>
  );
}