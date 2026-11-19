import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { formatDate, formatTime, todayStr } from '../utils.js';

const TYPES = ['Unit Test', 'Internal', 'Mid Term', 'Final', 'Practical', 'Other'];
const YEARS = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];
const EMPTY = {
  subject: '',
  examType: 'Internal',
  department: 'All',
  academicYear: 'All',
  date: todayStr(),
  startTime: '09:00',
  endTime: '12:00',
  venue: '',
};

function statusOf(date) {
  const today = todayStr();
  if (date === today) return ['Today', 'orange'];
  return date > today ? ['Upcoming', 'green'] : ['Completed', 'gray'];
}

export default function Exams() {
  const { isAdmin } = useAuth();
  const [exams, setExams] = useState([]);
  const [query, setQuery] = useState('');
  const [when, setWhen] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ q: query, when });
      setExams(await api(`/exams?${qs.toString()}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query, when]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY, date: todayStr() });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (exam) => {
    setEditingId(exam._id);
    setForm({
      subject: exam.subject,
      examType: exam.examType,
      department: exam.department || 'All',
      academicYear: exam.academicYear || 'All',
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
      venue: exam.venue || '',
    });
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editingId) {
        await api(`/exams/${editingId}`, { method: 'PUT', body: form });
        setSuccess('Exam updated');
      } else {
        await api('/exams', { method: 'POST', body: form });
        setSuccess('Exam added to the schedule');
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (exam) => {
    if (!window.confirm(`Delete exam "${exam.subject}"?`)) return;
    try {
      await api(`/exams/${exam._id}`, { method: 'DELETE' });
      setSuccess('Exam deleted');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      {isAdmin && showForm && (
        <div className="card form-card" style={{ marginBottom: 24 }}>
          <h2>{editingId ? 'Edit Exam' : 'Add Exam'}</h2>
          {formError && <div className="alert error">{formError}</div>}
          <form onSubmit={submit} className="form-grid">
            <label>
              Subject
              <input name="subject" value={form.subject} onChange={update} required />
            </label>
            <label>
              Exam Type
              <select name="examType" value={form.examType} onChange={update}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Department
              <input name="department" value={form.department} onChange={update} placeholder="All" />
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
              Exam Date
              <input type="date" name="date" value={form.date} onChange={update} required />
            </label>
            <label>
              Venue / Hall
              <input name="venue" value={form.venue} onChange={update} />
            </label>
            <label>
              Start Time
              <input type="time" name="startTime" value={form.startTime} onChange={update} required />
            </label>
            <label>
              End Time
              <input type="time" name="endTime" value={form.endTime} onChange={update} required />
            </label>
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Exam' : 'Add Exam'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Exam Schedule</h2>
            <p>{isAdmin ? 'Create and manage exam timetables' : 'View upcoming and past exams'}</p>
          </div>
          {isAdmin && (
            <button className="btn primary" onClick={openAdd}>
              + Add Exam
            </button>
          )}
        </div>

        <div className="toolbar">
          <div className="search-box grow">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by subject, department or venue..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="inline-field">
            Show
            <select value={when} onChange={(e) => setWhen(e.target.value)}>
              <option value="all">All exams</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Completed</option>
            </select>
          </label>
        </div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Department</th>
                <th>Year</th>
                <th>Venue</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="empty">
                    Loading...
                  </td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="empty">
                    No exams scheduled
                  </td>
                </tr>
              ) : (
                exams.map((x) => {
                  const [label, color] = statusOf(x.date);
                  return (
                    <tr key={x._id}>
                      <td>{formatDate(x.date)}</td>
                      <td>
                        {formatTime(x.startTime)} - {formatTime(x.endTime)}
                      </td>
                      <td>{x.subject}</td>
                      <td>{x.examType}</td>
                      <td>{x.department || 'All'}</td>
                      <td>{x.academicYear || 'All'}</td>
                      <td>{x.venue || '-'}</td>
                      <td>
                        <span className={`chip ${color}`}>{label}</span>
                      </td>
                      {isAdmin && (
                        <td className="actions">
                          <button className="btn small" onClick={() => openEdit(x)}>
                            ✎ Edit
                          </button>
                          <button className="btn small danger" onClick={() => handleDelete(x)}>
                            🗑 Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
