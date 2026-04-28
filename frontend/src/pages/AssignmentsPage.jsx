import { useState, useEffect } from 'react';
import { fetchAssignments, submitAssignment } from '../services/api';
import Header from '../components/Header';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const data = await fetchAssignments();
      setAssignments(data?.assignments || []);
    } catch (err) {
      console.error("Failed to load assignments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    try {
      await submitAssignment(assignmentId);
      await loadAssignments(); // Reload to show updated status
    } catch (err) {
      alert("Failed to submit assignment.");
    }
  };

  return (
    <div className="page-container">
      <Header title="Assignments" subtitle="Track your pending tasks and submissions" />

      <div className="card" style={{ marginTop: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <BookOpen size={24} color="var(--primary-color)" /> My Assignments
        </h2>

        {loading ? (
          <p>Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <p>You have no assignments right now. Enjoy your free time!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {assignments.map((assignment) => {
              const isSubmitted = assignment.status === "Submitted";
              const isOverdue = new Date(assignment.due_date) < new Date() && !isSubmitted;

              return (
                <div key={assignment.id} style={{ 
                  border: `1px solid ${isOverdue ? 'rgba(255, 0, 0, 0.3)' : 'var(--border-color)'}`, 
                  borderRadius: '12px', 
                  padding: '20px',
                  backgroundColor: isSubmitted ? 'var(--bg-secondary)' : 'white' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', margin: '0 0 8px 0', textDecoration: isSubmitted ? 'line-through' : 'none', color: isSubmitted ? 'var(--text-muted)' : 'var(--text-color)' }}>
                        {assignment.title}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 12px 0' }}>
                        {assignment.subject}
                      </p>
                    </div>
                    <span className="pill-badge" style={{ 
                      backgroundColor: isSubmitted ? 'rgba(0, 128, 0, 0.1)' : isOverdue ? 'rgba(255, 0, 0, 0.1)' : 'var(--primary-color)',
                      color: isSubmitted ? 'green' : isOverdue ? 'red' : 'white'
                    }}>
                      {isSubmitted ? 'Submitted' : isOverdue ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: isOverdue ? 'red' : 'var(--text-muted)', marginBottom: '20px' }}>
                    <Clock size={16} /> Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </div>

                  <button 
                    onClick={() => !isSubmitted && handleSubmit(assignment.id)}
                    disabled={isSubmitted}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isSubmitted ? 'transparent' : 'var(--primary-color)',
                      color: isSubmitted ? 'green' : 'white',
                      fontWeight: 'bold',
                      cursor: isSubmitted ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isSubmitted ? <><CheckCircle size={18} /> Completed</> : 'Submit Now'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
