import { useState, useEffect } from 'react';
import { fetchAchievements } from '../services/api';
import Header from '../components/Header';
import { Award, Star, Zap } from 'lucide-react';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const data = await fetchAchievements();
      setAchievements(data?.achievements || []);
    } catch (err) {
      console.error("Failed to load achievements", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Header title="Achievements" subtitle="Celebrating campus excellence" />

      <div className="card" style={{ marginTop: '20px', background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.05) 0%, rgba(var(--secondary-rgb), 0.05) 100%)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Award size={24} color="var(--primary-color)" /> Hall of Fame
        </h2>

        {loading ? (
          <p>Loading achievements...</p>
        ) : achievements.length === 0 ? (
          <p>No recent achievements to display.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {achievements.map((item) => (
              <div 
                key={item.id} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.category === 'sports' ? <Zap size={24} /> : item.category === 'academic' ? <BookOpen size={24} /> : <Star size={24} />}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{item.title}</h3>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.category}</p>
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={{ color: 'var(--text-color)', fontSize: '0.95rem', lineHeight: '1.5', flexGrow: 1, margin: '0 0 16px 0' }}>
                    {item.description}
                  </p>
                  
                  <div style={{ padding: '12px', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-color)' }}>{item.winner_name}</p>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Awarded on {item.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
