import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Home,
  Clock,
  Users,
  MessageSquare,
  Bell,
  User,
  Hash,
  Settings,
  Megaphone,
  UserPlus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCurrentUser } from "../../api/user";


// Navbar Item Config
const navItems = [
  { to: "/app/board", key: "sidebar.board", icon: Home },
  { to: "/app/time-study", key: "sidebar.time", icon: Clock },
  { to: "/app/follow", key: "sidebar.follow", icon: Users },
   { to: "/app/followers", key: "sidebar.followers", icon: UserPlus }, 
  { to: "/app/chat", key: "sidebar.chat", icon: MessageSquare },
  { to: "/app/notification", key: "sidebar.notification", icon: Bell },
  { to: "/app/tags", key: "sidebar.tags", icon: Hash },
  { to: "/app/news", key: "sidebar.news", icon: Megaphone },
  { to: "/app/account", key: "sidebar.account", icon: User },
];


// Topbar Component
function Topbar() {
  const [user, setUser] = useState({});
  const [openMenu, setOpenMenu] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const loadUser = () => {
      const currentKey = localStorage.getItem("currentUserKey");
      const data = currentKey
        ? JSON.parse(localStorage.getItem(currentKey) || "{}")
        : {};
      setUser(data);
    };

    loadUser();
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const toggleMenu = () => setOpenMenu(!openMenu);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const getProfileImage = () => {
    if (!user?.profile_image) return "/images/default-avatar.png";

    const img = user.profile_image;

    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads/")) return `http://localhost:8000${img}`;
    if (img.startsWith("uploads/")) return `http://localhost:8000/${img}`;
    if (img.startsWith("user/")) return `http://localhost:8000/uploads/${img}`;
    return `http://localhost:8000/uploads/user/${img}`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-20 border-b bg-white shadow h-16 flex items-center justify-between px-6">
      <img
        src="/images/horizontal-logo.png"
        alt="Hubersity"
        className="h-[120px] w-auto"
      />

      <div className="flex items-center gap-6">
        {/* CHAT */}
        <Link to="/app/chat">
          <MessageSquare
            size={22}
            className="cursor-pointer hover:text-emerald-600 transition"
          />
        </Link>

        {/* NOTIFICATION */}
        <Link to="/app/notification">
          <Bell
            size={22}
            className="cursor-pointer hover:text-emerald-600 transition"
          />
        </Link>

        {/* PROFILE DROPDOWN */}
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
            onClick={toggleMenu}
          >
            <img
              src={getProfileImage()}
              alt="profile"
              className="w-9 h-9 rounded-full object-cover border border-gray-200"
            />
            <span className="text-sm text-slate-700 font-medium">
              {user?.name || user?.username || t("loading")}
            </span>
          </div>

          {/* DROPDOWN MENU */}
          {openMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden">
              <Link
                to="/app/account"
                className="block px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => setOpenMenu(false)}
              >
                My Account
              </Link>

              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// Sidebar Component
function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();


  return (
    <div className="fixed top-16 left-0 w-56 h-[calc(100vh-64px)] bg-white border-r shadow pt-6">
      <nav className="flex flex-col h-full justify-between">
        <div>
          {navItems.map(({ to, key, icon: Icon }) => {
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
                <span>{t(key)}</span>
              </Link>
            );
          })}
        </div>

        {/* Setting */}
        <Link
          to="/app/setting"
          className={`flex items-center gap-3 px-5 py-3 mb-4 transition-all w-full ${
            location.pathname === "/app/setting"
              ? "bg-[#e0ebe2] text-emerald-700 font-semibold"
              : "hover:bg-gray-50 text-gray-700"
          }`}
        >
          <Settings size={20} />
          <span>{t("sidebar.setting")}</span>
        </Link>
      </nav>
    </div>
  );
}


// Dashboard Layout
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
