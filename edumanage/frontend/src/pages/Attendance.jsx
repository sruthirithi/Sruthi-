import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { formatDate, todayStr } from '../utils.js';

function Filters({ filters, options, onChange }) {
  return (
    <>
      <label className="inline-field">
        Department
        <select value={filters.department} onChange={(e) => onChange({ ...filters, department: e.target.value })}>
          <option value="All">All</option>
          {options.departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className="inline-field">
        Year
        <select value={filters.academicYear} onChange={(e) => onChange({ ...filters, academicYear: e.target.value })}>
          <option value="All">All</option>
          {options.academicYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function MarkAttendance({ filters, options, setFilters }) {
  const [date, setDate] = useState(todayStr());
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ date, department: filters.department, academicYear: filters.academicYear });
      const data = await api(`/attendance?${qs.toString()}`);
      setStudents(data.students);
      const initial = {};
      data.students.forEach((s) => {
        if (s.status) initial[s._id] = s.status;
      });
      setMarks(initial);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [date, filters.department, filters.academicYear]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const values = students.map((s) => marks[s._id]);
    return {
      present: values.filter((v) => v === 'present').length,
      absent: values.filter((v) => v === 'absent').length,
      pending: values.filter((v) => !v).length,
    };
  }, [students, marks]);

  const setMark = (id, status) => {
    setSuccess('');
    setMarks((prev) => ({ ...prev, [id]: status }));
  };

  const markAll = (status) => {
    setSuccess('');
    const next = {};
    students.forEach((s) => {
      next[s._id] = status;
    });
    setMarks(next);
  };

  const save = async () => {
    setError('');
    setSuccess('');
    const records = students.filter((s) => marks[s._id]).map((s) => ({ studentId: s._id, status: marks[s._id] }));
    if (records.length === 0) {
      setError('Mark at least one student as present or absent before saving.');
      return;
    }
    setSaving(true);
    try {
      const res = await api('/attendance/bulk', { method: 'POST', body: { date, records } });
      setSuccess(res.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="toolbar">
        <label className="inline-field">
          Date
          <input type="date" value={date} max={todayStr()} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        <Filters filters={filters} options={options} onChange={setFilters} />
        <div className="toolbar-spacer" />
        <button className="btn small" onClick={() => markAll('present')} disabled={!students.length}>
          ✔ All Present
        </button>
        <button className="btn small" onClick={() => markAll('absent')} disabled={!students.length}>
          ✖ All Absent
        </button>
      </div>

      <div className="summary-chips">
        <span className="chip green">Present: {counts.present}</span>
        <span className="chip red">Absent: {counts.absent}</span>
        <span className="chip gray">Not marked: {counts.pending}</span>
        <span className="chip-date">{formatDate(date)}</span>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll No</th>
              <th>Department</th>
              <th>Year</th>
              <th>Date of Joining</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="empty">
                  Loading...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty">
                  No students found
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.rollNumber || '-'}</td>
                  <td>{s.department}</td>
                  <td>{s.academicYear}</td>
                  <td>{formatDate(s.dateOfJoining)}</td>
                  <td>
                    <div className="toggle">
                      <button
                        type="button"
                        className={marks[s._id] === 'present' ? 'toggle-btn present active' : 'toggle-btn present'}
                        onClick={() => setMark(s._id, 'present')}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        className={marks[s._id] === 'absent' ? 'toggle-btn absent active' : 'toggle-btn absent'}
                        onClick={() => setMark(s._id, 'absent')}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="form-actions" style={{ marginTop: 20 }}>
        <button className="btn primary" onClick={save} disabled={saving || students.length === 0}>
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </>
  );
}

function Register({ filters, options, setFilters }) {
  const [month, setMonth] = useState(todayStr().slice(0, 7));
  const [data, setData] = useState({ daysInMonth: 30, rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const qs = new URLSearchParams({ month, department: filters.department, academicYear: filters.academicYear });
    api(`/attendance/register?${qs.toString()}`)
      .then((d) => {
        if (!cancelled) setData(d);
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
  }, [month, filters.department, filters.academicYear]);

  const days = Array.from({ length: data.daysInMonth }, (_, i) => i + 1);
  const [y, m] = month.split('-').map(Number);
  const isSunday = (d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 0;

  return (
    <>
      <div className="toolbar">
        <label className="inline-field">
          Month
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </label>
        <Filters filters={filters} options={options} onChange={setFilters} />
      </div>

      <div className="summary-chips">
        <span className="chip green">P = Present</span>
        <span className="chip red">A = Absent</span>
        <span className="chip gray">- = Not marked</span>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="table-wrap">
        <table className="register">
          <thead>
            <tr>
              <th className="sticky-col">Student</th>
              {days.map((d) => (
                <th key={d} className={isSunday(d) ? 'day sunday' : 'day'}>
                  {d}
                </th>
              ))}
              <th className="day">P</th>
              <th className="day">A</th>
              <th className="day">%</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={days.length + 4} className="empty">
                  Loading...
                </td>
              </tr>
            ) : data.rows.length === 0 ? (
              <tr>
                <td colSpan={days.length + 4} className="empty">
                  No students found
                </td>
              </tr>
            ) : (
              data.rows.map((r) => (
                <tr key={r._id}>
                  <td className="sticky-col">
                    {r.name}
                    {r.rollNumber ? <small> ({r.rollNumber})</small> : null}
                  </td>
                  {days.map((d) => {
                    const v = r.days[d];
                    return (
                      <td key={d} className={`cell ${v === 'P' ? 'cell-p' : v === 'A' ? 'cell-a' : ''} ${isSunday(d) ? 'sunday' : ''}`}>
                        {v || '-'}
                      </td>
                    );
                  })}
                  <td className="cell cell-p">{r.present}</td>
                  <td className="cell cell-a">{r.absent}</td>
                  <td className="cell">{r.percentage === null ? '-' : `${r.percentage}%`}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Attendance() {
  const [tab, setTab] = useState('mark');
  const [filters, setFilters] = useState({ department: 'All', academicYear: 'All' });
  const [options, setOptions] = useState({ departments: [], academicYears: [] });

  useEffect(() => {
    api('/attendance/filters')
      .then(setOptions)
      .catch(() => {});
  }, []);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Attendance Register</h2>
          <p>Mark daily present / absent and view the monthly register</p>
        </div>
      </div>

      <div className="tabs wide">
        <button type="button" className={tab === 'mark' ? 'tab active' : 'tab'} onClick={() => setTab('mark')}>
          Mark Attendance
        </button>
        <button type="button" className={tab === 'register' ? 'tab active' : 'tab'} onClick={() => setTab('register')}>
          Monthly Register
        </button>
      </div>

      {tab === 'mark' ? (
        <MarkAttendance filters={filters} options={options} setFilters={setFilters} />
      ) : (
        <Register filters={filters} options={options} setFilters={setFilters} />
      )}
    </div>
  );
}
