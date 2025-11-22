import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// user pages (keep as direct imports)
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Sign_up from './pages/Sign up/Sign_up';
import GoogleCallback from "./pages/GoogleCallback/GoogleCallback.jsx";
import Dashboard from './pages/Dashboard/Dashboard';
import Board from './pages/Dashboard/Board';
import TimeStudy from './pages/Dashboard/TimeStudy';
import CreateAcc from "./pages/Create-account/create-acc.jsx";
import Account from './pages/Dashboard/Account';
import Follow from './pages/Dashboard/Follow';
import FollowerPage from "./pages/Dashboard/Follower.jsx";
import Chat from './pages/Dashboard/Chat';
import Notifications from './pages/Dashboard/Notifications';
import UserProfile from './pages/Dashboard/UserProfile';
import Tags from './pages/Dashboard/Tags';
import TagDetail from './pages/Dashboard/TagDetail'; 
import Setting from "./pages/Dashboard/Setting/Setting";
import News from './pages/Dashboard/News';
import NewDetail from './pages/Dashboard/NewDetail.jsx';

// ⬇admin: lazy imports (so they don't execute until visited)
const Dashboard_admin     = lazy(() => import('./pages/Admin/Dashboard-admin.jsx'));
const Overview            = lazy(() => import('./pages/Admin/Overview.jsx'));
const Account_admin       = lazy(() => import('./pages/Admin/Account-admin.jsx'));
const Report              = lazy(() => import('./pages/Admin/Report.jsx'));
const Notification_admin  = lazy(() => import('./pages/Admin/Notification-admin.jsx'));
const PostDetail          = lazy(() => import('./pages/Admin/PostDetail.jsx'));
const UserDetail          = lazy(() => import('./pages/Admin/UserDetail.jsx'));
const News_admin          = lazy(() => import('./pages/Admin/News-admin.jsx'));
const NewsCreate_admin    = lazy(() => import('./pages/Admin/NewsCreate-admin.jsx'));

const News_Detail          = lazy(() => import('./pages/Admin/News-Detail.jsx'));

const ForHelp_admin = lazy(() => import('./pages/Admin/ForHelp-admin.jsx'));
const CommentDetail = lazy(() => import('./pages/Admin/CommentDetail.jsx'));


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
      <Route path="/google-callback" element={<GoogleCallback />} />

      {/* user dashboard */}
      <Route path="/app" element={<Dashboard />} >
        <Route index element={<Navigate to="board" replace />} />
        <Route path="board" element={<Board />} />
        <Route path="time-study" element={<TimeStudy />} />
        <Route path="follow" element={<Follow />} />
        <Route path="followers" element={<FollowerPage />} />
        <Route path="chat" element={<Chat />} />
        <Route path="notification" element={<Notifications />} />
        <Route path="account" element={<Account />} />
        <Route path="user/:userId" element={<UserProfile />} />
        <Route path="tags" element={<Tags />} />
        <Route path="news" element={<News />} />
        <Route path="tags/:tagName" element={<TagDetail />} /> 
        <Route path="setting" element={<Setting />} />
        {/* <Route path="newdetail" element={<NewDetail />} /> */}
        <Route path="news/:id" element={<NewDetail />} />
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
        <Route path="/app_admin/report/comment/:commentId" element={<CommentDetail />} />
        <Route path="noti-admin" element={<Suspense fallback={null}><Notification_admin /></Suspense>} />
        <Route path="news" element={<Suspense fallback={null}><News_admin /></Suspense>} />
        <Route path="news/create" element={<Suspense fallback={null}><NewsCreate_admin /></Suspense>} />
        <Route path="news/edit/:id" element={<Suspense fallback={null}><News_Detail /></Suspense>} />
        <Route path="forhelp-admin" element={<Suspense fallback={null}><ForHelp_admin /></Suspense>} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}