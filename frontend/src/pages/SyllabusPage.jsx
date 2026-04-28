import { useState, useEffect } from 'react';
import { fetchSyllabus, toggleSyllabusTopic } from '../services/api';
import Header from '../components/Header';
import { BookMarked, CheckCircle2, Circle } from 'lucide-react';

export default function SyllabusPage() {
  const [syllabusData, setSyllabusData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSyllabus();
  }, []);

  const loadSyllabus = async () => {
    try {
      const data = await fetchSyllabus();
      setSyllabusData(data?.syllabus || []);
    } catch (err) {
      console.error("Failed to load syllabus", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (topicId) => {
    try {
      // Optimistically update UI
      setSyllabusData(prev => prev.map(subject => ({
        ...subject,
        topics: subject.topics.map(topic => 
          topic.id === topicId ? { ...topic, completed: !topic.completed } : topic
        )
      })));
      
      await toggleSyllabusTopic(topicId);
    } catch (err) {
      // Revert on failure
      await loadSyllabus();
      alert("Failed to update topic status.");
    }
  };

  return (
    <div className="page-container">
      <Header title="Syllabus Tracker" subtitle="Track your course progress" />

      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          <div className="card"><p>Loading syllabus...</p></div>
        ) : syllabusData.length === 0 ? (
          <div className="card"><p>No syllabus data available.</p></div>
        ) : (
          syllabusData.map((subject) => {
            const completedCount = subject.topics.filter(t => t.completed).length;
            const totalCount = subject.topics.length;
            const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

            return (
              <div key={subject.subject_id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <BookMarked size={24} color="var(--primary-color)" /> {subject.subject_name}
                  </h2>
                  <span style={{ fontWeight: 'bold', color: progress === 100 ? 'green' : 'var(--primary-color)' }}>
                    {progress}% Completed
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', marginBottom: '20px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', backgroundColor: progress === 100 ? 'green' : 'var(--primary-color)', transition: 'width 0.3s ease' }}></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {subject.topics.map((topic) => (
                    <div 
                      key={topic.id} 
                      onClick={() => handleToggle(topic.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '12px 16px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)', 
                        cursor: 'pointer',
                        backgroundColor: topic.completed ? 'rgba(0, 128, 0, 0.05)' : 'transparent',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {topic.completed ? (
                        <CheckCircle2 size={20} color="green" />
                      ) : (
                        <Circle size={20} color="var(--text-muted)" />
                      )}
                      <span style={{ 
                        fontSize: '1rem', 
                        color: topic.completed ? 'var(--text-muted)' : 'var(--text-color)',
                        textDecoration: topic.completed ? 'line-through' : 'none'
                      }}>
                        {topic.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
