import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { formatDate } from '../utils.js';

export default function StudentTable({ onChange }) {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (q) => {
    setLoading(true);
    setError('');
    try {
      const data = await api(`/students?q=${encodeURIComponent(q)}`);
      setStudents(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(query), 300);
    return () => clearTimeout(timer);
  }, [query, load]);

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete student "${student.name}"?`)) return;
    try {
      await api(`/students/${student._id}`, { method: 'DELETE' });
      await load(query);
      if (onChange) onChange();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Student Details</h2>
          <p>{isAdmin ? 'Manage all registered students' : 'View and edit registered students'}</p>
        </div>
        {isAdmin && (
          <Link to="/students/new" className="btn primary">
            + Add Student
          </Link>
        )}
      </div>

      <div className="search-box">
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search student by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Roll No</th>
              <th>Department</th>
              <th>Year</th>
              <th>Phone</th>
              <th>Date of Joining</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="empty">Loading...</td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty">No students found</td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.rollNumber || '-'}</td>
                  <td>{s.department}</td>
                  <td>{s.academicYear}</td>
                  <td>{s.phone || '-'}</td>
                  <td>{formatDate(s.dateOfJoining)}</td>
                  <td className="actions">
                    <Link to={`/students/${s._id}/edit`} className="btn small">
                      ✎ Edit
                    </Link>
                    {isAdmin && (
                      <button className="btn small danger" onClick={() => handleDelete(s)}>
                        🗑 Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
