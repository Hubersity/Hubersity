// import { Routes, Route, Navigate } from 'react-router-dom';
// import Home from './pages/Home/Home';
// import Login from './pages/Login/Login';
// import Sign_in from './pages/Sign in/Sign_in';
// import Dashboard from './pages/Dashboard/Dashboard';
// import Board from './pages/Dashboard/Board';
// import TimeStudy from './pages/Dashboard/TimeStudy';
// import CreateAcc from "./pages/Create-account/create-acc.jsx";
// import Account from './pages/Dashboard/Account';
// import Follow from './pages/Dashboard/Follow';
// import Chat from './pages/Dashboard/Chat';
// import Notifications from './pages/Dashboard/Notifications'; 
// import Dashboard_admin from './pages/Admin/Dashboard-admin.jsx';
// import Overview from './pages/Admin/Overview.jsx';
// import Account_admin from './pages/Admin/Account-admin.jsx';
// import Report from './pages/Admin/Report.jsx';
// import Tags from './pages/Admin/Tags.jsx';
// import Notifications_admin from './pages/Admin/Notification-admin.jsx';

// function App() {
//   return (
//     <Routes>
//       {/* 🏠 หน้าแรก */}
//       <Route path="/" element={<Home />} />
//       <Route path="/login" element={<Login />} />
//       <Route path="/signin" element={<Sign_in />} />
//       <Route path="/create-account" element={<CreateAcc />} />

//       {/* 🧭 Dashboard Layout */}
//       <Route path="/app" element={<Dashboard />}>
//         {/* default → /app/board */}
//         <Route index element={<Navigate to="board" replace />} />
//         <Route path="board" element={<Board />} />
//         <Route path="time-study" element={<TimeStudy />} />
//         <Route path="follow" element={<Follow />} />
//         <Route path="chat" element={<Chat />} />
//         <Route path="notification" element={<Notifications />} />
//         <Route path="account" element={<Account />} />
//       </Route>

//       {/* Dashboard Layout for admin */}
//       <Route path="/app_admin" element={<Dashboard_admin />}>
//         <Route index element={<Navigate to="overview" replace />} />
//         <Route path="overview" element={<Overview />} />
//         <Route path="acc-admin" element={<Account_admin />} />
//         <Route path="report" element={<Report />} />
//         <Route path="tags" element={<Tags />} />
//         <Route path="noti-admin" element={<Notifications_admin />} />
//       </Route>

//       {/* ❌ ถ้าเส้นทางไม่ถูก → กลับไปหน้าแรก */}
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   );
// }
// export default App;

import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// user pages (keep as direct imports)
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Sign_up from './pages/Sign up/Sign_up';
import Dashboard from './pages/Dashboard/Dashboard';
import Board from './pages/Dashboard/Board';
import TimeStudy from './pages/Dashboard/TimeStudy';
import CreateAcc from "./pages/Create-account/create-acc.jsx";
import Account from './pages/Dashboard/Account';
import Follow from './pages/Dashboard/Follow';
import Chat from './pages/Dashboard/Chat';
import Notifications from './pages/Dashboard/Notifications';
import UserProfile from './pages/Dashboard/UserProfile';
import Tags from './pages/Dashboard/Tags';
import TagDetail from './pages/Dashboard/TagDetail'; 

// ⬇admin: lazy imports (so they don't execute until visited)
const Dashboard_admin     = lazy(() => import('./pages/Admin/Dashboard-admin.jsx'));
const Overview            = lazy(() => import('./pages/Admin/Overview.jsx'));
const Account_admin       = lazy(() => import('./pages/Admin/Account-admin.jsx'));
const Report              = lazy(() => import('./pages/Admin/Report.jsx'));
const Notification_admin  = lazy(() => import('./pages/Admin/Notification-admin.jsx'));
const PostDetail          = lazy(() => import('./pages/Admin/PostDetail.jsx'));
const UserDetail          = lazy(() => import('./pages/Admin/UserDetail.jsx'));

// Simple Error Boundary to isolate admin crashes
class AdminErrorBoundary extends React.Component {
  constructor(props){ 
    super(props); 
    this.state = { hasError:false, err:null }; 
  }
  static getDerivedStateFromError(err){ 
    return { hasError:true, err }; 
  }
  render(){
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold">Admin failed to load</h1>
          <p className="text-sm text-gray-600">Check console for the exact file & line.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Sign_up />} />
      <Route path="/create-account" element={<CreateAcc />} />

      {/* user dashboard */}
      <Route path="/app" element={<Dashboard />} >
        <Route index element={<Navigate to="board" replace />} />
        <Route path="board" element={<Board />} />
        <Route path="time-study" element={<TimeStudy />} />
        <Route path="follow" element={<Follow />} />
        <Route path="chat" element={<Chat />} />
        <Route path="notification" element={<Notifications />} />
        <Route path="account" element={<Account />} />
        <Route path="user/:userId" element={<UserProfile />} />
        <Route path="tags" element={<Tags />} />
        <Route path="tags/:tagName" element={<TagDetail />} /> 
      </Route>

      {/* admin dashboard (lazy + boundary) */}
      <Route
        path="/app_admin"
        element={
          <AdminErrorBoundary>
            <Suspense fallback={<div className="p-6">Loading admin…</div>}>
              <Dashboard_admin />
            </Suspense>
          </AdminErrorBoundary>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Suspense fallback={null}><Overview /></Suspense>} />
        <Route path="acc-admin" element={<Suspense fallback={null}><Account_admin /></Suspense>} />
        <Route path="report" element={<Suspense fallback={null}><Report /></Suspense>} />
        <Route path="report/:id" element={<Suspense fallback={null}><PostDetail /></Suspense>} />
        <Route path="report/user/:username" element={<Suspense fallback={null}><UserDetail /></Suspense>} />
        {/* <Route path="tags-admin" element={<Suspense fallback={null}><Tags /></Suspense>} /> */}
        <Route path="noti-admin" element={<Suspense fallback={null}><Notification_admin /></Suspense>} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}