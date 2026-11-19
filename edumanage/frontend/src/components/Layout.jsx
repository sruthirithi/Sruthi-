import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const TITLES = {
  '/': ['Dashboard', 'Welcome to Student Management System'],
  '/students': ['Students', 'View and manage student records'],
  '/attendance': ['Attendance', 'Attendance register and present / absent marking'],
  '/exams': ['Exam Schedule', 'Upcoming and past examinations'],
};

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [title, subtitle] = TITLES[pathname] || ['Student Form', 'Add or edit student details'];
  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>🎓</span> EduManage
        </div>
        <div className="menu-label">MAIN MENU</div>
        <nav>
          <NavLink to="/" end className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
            ▦ Dashboard
          </NavLink>
          <NavLink to="/students" end className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
            👤 Students
          </NavLink>
          <NavLink to="/attendance" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
            ✔ Attendance
          </NavLink>
          <NavLink to="/exams" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
            📝 Exam Schedule
          </NavLink>
          {isAdmin && (
            <NavLink to="/students/new" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              + Add Student
            </NavLink>
          )}
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          ⎋ Logout
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="profile">
            <div className="avatar">{initial}</div>
            <div>
              <strong>{user?.name}</strong>
              <p>{isAdmin ? 'Administrator' : 'User'}</p>
            </div>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
