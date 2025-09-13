import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Sign_in from './pages/Sign in/Sign_in';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signin" element={<Sign_in />} />
    </Routes>
  );
}
export default App;