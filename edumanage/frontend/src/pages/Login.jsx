import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('user');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(userId, password, role);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">🎓 EduManage</div>
        <p className="auth-sub">Student Management System</p>

        <div className="tabs">
          <button type="button" className={role === 'user' ? 'tab active' : 'tab'} onClick={() => setRole('user')}>
            User Login
          </button>
          <button type="button" className={role === 'admin' ? 'tab active' : 'tab'} onClick={() => setRole('admin')}>
            Admin Login
          </button>
        </div>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit}>
          <label>
            User ID
            <input value={userId} onChange={(e) => setUserId(e.target.value)} required autoFocus />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn primary full" disabled={busy}>
            {busy ? 'Signing in...' : role === 'admin' ? 'Login as Admin' : 'Login'}
          </button>
        </form>

        {role === 'user' && (
          <p className="auth-foot">
            New here? <Link to="/register">Create an account</Link>
          </p>
        )}
      </div>
    </div>
  );
}
