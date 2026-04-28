import { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../services/api';
import Header from '../components/Header';
import { Trophy, Medal, Star } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await fetchLeaderboard('merit');
      setLeaderboard(data?.leaderboard || []);
    } catch (err) {
      console.error("Failed to load leaderboard", err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy size={24} color="#FFD700" />; // Gold
    if (index === 1) return <Medal size={24} color="#C0C0C0" />; // Silver
    if (index === 2) return <Medal size={24} color="#CD7F32" />; // Bronze
    return <span style={{ fontWeight: 'bold', fontSize: '1.2rem', width: '24px', textAlign: 'center' }}>{index + 1}</span>;
  };

  return (
    <div className="page-container">
      <Header title="Leaderboard" subtitle="Top performers in the batch" />

      <div className="card" style={{ marginTop: '20px', background: 'linear-gradient(to bottom right, var(--bg-color), var(--bg-secondary))' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Star size={24} color="var(--primary-color)" /> Campus Rankings
        </h2>

        {loading ? (
          <p>Loading rankings...</p>
        ) : leaderboard.length === 0 ? (
          <p>Leaderboard is currently empty.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leaderboard.map((student, index) => (
              <div 
                key={student.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  backgroundColor: index < 3 ? 'white' : 'transparent',
                  border: index < 3 ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  boxShadow: index < 3 ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                  transform: index === 0 ? 'scale(1.02)' : 'none',
                  transition: 'transform 0.2s'
                }}
              >
                <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                  {getRankIcon(index)}
                </div>
                
                {student.avatar_url ? (
                  <img src={student.avatar_url} alt={student.name} style={{ width: '48px', height: '48px', borderRadius: '24px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: 'var(--primary-color)', opacity: 0.1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-color)' }}>
                    {student.name.charAt(0)}
                  </div>
                )}
                
                <div style={{ flexGrow: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{student.name}</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{student.department} • Year {student.year}</p>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{student.score}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Points</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
