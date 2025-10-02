import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Clock, Users, MessageSquare, Bell, User } from "lucide-react";

const navItems = [
  { to: "/app/board", label: "Board", icon: Home },
  { to: "/app/time-study", label: "Time study", icon: Clock },
  { to: "/app/follow", label: "Follow", icon: Users },
  { to: "/app/chat", label: "Chat", icon: MessageSquare },
  { to: "/app/notifications", label: "Notification", icon: Bell },
  { to: "/app/account", label: "Account", icon: User },
];

function Topbar() {
  return (
    <div className="sticky top-0 z-10 border-b bg-white shadow">
      <div className="flex items-center justify-between h-16 px-6">
        {/* โลโก้ */}
        <img
          src="/images/horizontal-logo.png"
          alt="Hubersity"
          className="h-[120px] w-auto" 
        />

        {/* ไอคอนด้านขวา */}
        <div className="flex items-center gap-6">
          <MessageSquare
            size={22}
            className="cursor-pointer hover:text-emerald-600"
          />
          <div className="relative">
            <Bell size={22} className="cursor-pointer hover:text-emerald-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer">
            <img
              src="/images/Karnpon.jpg"
              alt="profile"
              className="w-9 h-9 rounded-full object-cover"
            />
            <span className="text-sm text-slate-700">Name</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  const location = useLocation();
  return (
    <div className="w-56 bg-white h-full pt-6">
      <nav className="flex flex-col">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-5 py-3 transition w-full ${
                active
                  ? "bg-gray-100 text-black font-medium" // ✅ เทาอ่อน + ตัวอักษรดำเต็มช่อง
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

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Topbar */}
      <Topbar />

      {/* Body */}
      <div className="flex flex-1">
        {/* Sidebar (อยู่ซ้าย) */}
        <Sidebar />

        {/* Content (Outlet) */}
        <main className="flex-1 p-6 bg-slate-50 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}