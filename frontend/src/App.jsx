import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Sign_in from './pages/Sign in/Sign_in';
import Dashboard from './pages/Dashboard/Dashboard';
import Board from './pages/Dashboard/Board';
import TimeStudy from './pages/Dashboard/TimeStudy';
import CreateAcc from "./pages/Create-account/create-acc.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signin" element={<Sign_in />} />

      {/* Dashboard Layout */}
      <Route path="/app" element={<Dashboard />}>
        {/* default → /app/board */}
        <Route index element={<Navigate to="board" replace />} />
        <Route path="board" element={<Board />} />
        <Route path="time-study" element={<TimeStudy />} />
      </Route>

      {/* creata account */}
      <Route path="/create-account" element={<CreateAcc />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;