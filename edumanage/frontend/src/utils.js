// Local-time "YYYY-MM-DD" (avoids the UTC shift of toISOString)
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "2024-06-15" -> "15 Jun 2024"
export function formatDate(value) {
  if (!value) return '-';
  const str = String(value).slice(0, 10);
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return '-';
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// "14:30" -> "02:30 PM"
export function formatTime(t) {
  if (!t) return '-';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}
