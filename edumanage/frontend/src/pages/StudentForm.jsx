import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { todayStr } from '../utils.js';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const EMPTY = { name: '', email: '', rollNumber: '', department: '', academicYear: YEARS[0], phone: '', dateOfJoining: todayStr() };

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    api(`/students/${id}`)
      .then((s) => {
        if (cancelled) return;
        setForm({
          name: s.name || '',
          email: s.email || '',
          rollNumber: s.rollNumber || '',
          department: s.department || '',
          academicYear: s.academicYear || YEARS[0],
          phone: s.phone || '',
          dateOfJoining: s.dateOfJoining ? String(s.dateOfJoining).slice(0, 10) : '',
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, editing]);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editing) {
        await api(`/students/${id}`, { method: 'PUT', body: form });
      } else {
        await api('/students', { method: 'POST', body: form });
      }
      navigate('/students');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card form-card">
      <h2>{editing ? 'Edit Student' : 'Add New Student'}</h2>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={submit} className="form-grid">
        <label>
          Full Name
          <input name="name" value={form.name} onChange={update} required />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={update} required />
        </label>
        <label>
          Roll Number
          <input name="rollNumber" value={form.rollNumber} onChange={update} />
        </label>
        <label>
          Department
          <input name="department" value={form.department} onChange={update} list="dept-list" required />
          <datalist id="dept-list">
            <option value="Computer Science" />
            <option value="Electronics" />
            <option value="Mechanical" />
            <option value="Civil" />
            <option value="Information Technology" />
          </datalist>
        </label>
        <label>
          Academic Year
          <select name="academicYear" value={form.academicYear} onChange={update}>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label>
          Phone
          <input name="phone" value={form.phone} onChange={update} />
        </label>
        <label>
          Date of Joining
          <input type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={update} required />
        </label>
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => navigate('/students')}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update Student' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
