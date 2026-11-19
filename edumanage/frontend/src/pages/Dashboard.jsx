import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import StudentTable from '../components/StudentTable.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalStudents: 0, departments: 0, academicYears: 0 });

  const loadStats = useCallback(async () => {
    try {
      setStats(await api('/students/stats'));
    } catch (e) {
      /* stats are non-critical */
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <>
      <div className="banner">
        <div>
          <h2>Welcome Back, {user?.name}! 👋</h2>
          <p>Manage your students and academic records easily.</p>
        </div>
        <div className="banner-icon">🎓</div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-icon blue">👤</div>
          <span>Total Students</span>
          <strong>{stats.totalStudents}</strong>
        </div>
        <div className="stat">
          <div className="stat-icon green">🏛</div>
          <span>Departments</span>
          <strong>{stats.departments}</strong>
        </div>
        <div className="stat">
          <div className="stat-icon orange">📅</div>
          <span>Academic Years</span>
          <strong>{stats.academicYears}</strong>
        </div>
      </div>

      <StudentTable onChange={loadStats} />
    </>
  );
}
