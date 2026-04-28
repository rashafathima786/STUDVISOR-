import { useState, useEffect } from 'react';
import { fetchPolls, votePoll } from '../services/api';
import Header from '../components/Header';
import { PieChart, CheckCircle2 } from 'lucide-react';

export default function PollsPage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      const data = await fetchPolls();
      setPolls(data?.polls || []);
    } catch (err) {
      console.error("Failed to load polls", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    try {
      await votePoll(pollId, optionId);
      // Optimistically reload polls to show updated results
      await loadPolls();
    } catch (err) {
      alert("Failed to cast vote. You might have already voted.");
    }
  };

  return (
    <div className="page-container">
      <Header title="Campus Polls" subtitle="Have your say in college decisions" />

      <div className="card" style={{ marginTop: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <PieChart size={24} color="var(--primary-color)" /> Active Polls
        </h2>

        {loading ? (
          <p>Loading polls...</p>
        ) : polls.length === 0 ? (
          <p>No active polls at the moment.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {polls.map((poll) => {
              const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

              return (
                <div key={poll.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.2rem' }}>{poll.question}</h3>
                    <span className="pill-badge" style={{ backgroundColor: 'var(--bg-secondary)' }}>{poll.category}</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {poll.options.map((opt) => {
                      const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                      const hasVoted = poll.user_voted; // Assumes backend sends this boolean
                      
                      return (
                        <div key={opt.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: hasVoted ? 'default' : 'pointer' }} onClick={() => !hasVoted && handleVote(poll.id, opt.id)}>
                          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${percentage}%`, backgroundColor: 'var(--primary-color)', opacity: 0.1, zIndex: 0, transition: 'width 0.5s ease' }}></div>
                          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                            <span style={{ fontWeight: 500 }}>{opt.text}</span>
                            {hasVoted ? (
                              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{percentage}% ({opt.votes} votes)</span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>Vote</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Total votes: {totalVotes}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
