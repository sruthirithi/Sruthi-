import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ userId: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
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
        <p className="auth-sub">Create a user account</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit}>
          <label>
            User ID
            <input name="userId" value={form.userId} onChange={update} required />
          </label>
          <label>
            Full Name
            <input name="name" value={form.name} onChange={update} required />
          </label>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={update} />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={update} required minLength={4} />
          </label>
          <button className="btn primary full" disabled={busy}>
            {busy ? 'Creating...' : 'Register'}
          </button>
        </form>

        <p className="auth-foot">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
