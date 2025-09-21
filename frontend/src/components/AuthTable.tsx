
"use client";
import React, { useEffect, useState, useRef } from 'react';
import styles from './authtable.module.css';

export interface AuthTableRow {
  ip: string;
  timestamp: string;
  src_ip: string;
  user: string;
  passwd: string;
  accepted: boolean;
}

const API_URL = 'https://fmab5zbovg.execute-api.us-east-1.amazonaws.com/getauthhistory';

const AuthTable: React.FC = () => {
  const [data, setData] = useState<AuthTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        const rows: AuthTableRow[] = json
          .filter((item: any) => item.event_type === 'password_auth')
          .map((item: any) => ({
            ip: item.ip || '',
            timestamp: item.timestamp || '',
            src_ip: item.src_ip || '',
            user: item.user || '',
            passwd: item.password || '',
            accepted: !!item.accepted,
          }));
        setData(rows);
      } catch (e: any) {
        setError(e.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  // Format timestamp to readable string
  const formatTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  };

  return (
    <div className={styles.tableContainer} ref={containerRef}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tr}>
            <th className={styles.th}>IP</th>
            <th className={styles.th}>Timestamp</th>
            <th className={styles.th}>Src IP</th>
            <th className={styles.th}>User</th>
            <th className={styles.th}>Password</th>
            <th className={styles.th}>Accepted</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={
                styles.tr + ' ' +
                (idx % 2 === 0 ? styles.trOdd : styles.trEven)
              }
              onMouseEnter={e => e.currentTarget.classList.add(styles.trHover)}
              onMouseLeave={e => e.currentTarget.classList.remove(styles.trHover)}
            >
              <td className={styles.td}>{row.ip}</td>
              <td className={styles.td}>{formatTime(row.timestamp)}</td>
              <td className={styles.td}>{row.src_ip}</td>
              <td className={styles.td}>{row.user}</td>
              <td className={styles.td}>{row.passwd}</td>
              <td className={styles.td + ' ' + (row.accepted ? styles.accepted : styles.rejected)}>{row.accepted ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuthTable;
