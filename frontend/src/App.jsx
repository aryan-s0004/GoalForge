import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';
import ManagerDashboard from './pages/ManagerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading GoalForge...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/employee" element={user?.role === 'employee' ? <EmployeeDashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/manager" element={user?.role === 'manager' ? <ManagerDashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? `/${user.role}` : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
