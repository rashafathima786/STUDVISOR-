import { useState, useEffect } from 'react';
import { fetchFaculty } from '../services/api';
import Header from '../components/Header';
import { Users, Mail, Phone, BookOpen } from 'lucide-react';

export default function FacultyPage() {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadFaculty();
  }, []);

  const loadFaculty = async () => {
    try {
      const data = await fetchFaculty();
      setFacultyList(data?.faculty || []);
    } catch (err) {
      console.error("Failed to load faculty", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaculty = facultyList.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <Header title="Faculty Directory" subtitle="Connect with your professors" />

      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Users size={24} color="var(--primary-color)" /> Faculty Directory
          </h2>
          
          <div className="input-with-icon" style={{ marginBottom: 0, width: '100%', maxWidth: '300px' }}>
            <SearchIcon size={16} />
            <input 
              type="text" 
              placeholder="Search by name or department..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '10px 0', fontSize: '0.9rem' }} 
            />
          </div>
        </div>

        {loading ? (
          <p>Loading faculty directory...</p>
        ) : filteredFaculty.length === 0 ? (
          <p>No faculty members found.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filteredFaculty.map((person) => (
              <div key={person.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                
                {person.image_url ? (
                   <img src={person.image_url} alt={person.name} style={{ width: '80px', height: '80px', borderRadius: '40px', objectFit: 'cover', marginBottom: '16px' }} />
                ) : (
                   <div style={{ width: '80px', height: '80px', borderRadius: '40px', backgroundColor: 'var(--primary-color)', opacity: 0.1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                     <Users size={40} color="var(--primary-color)" />
                   </div>
                )}
                
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0' }}>{person.name}</h3>
                <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '0.9rem', margin: '0 0 16px 0' }}>{person.designation}</p>
                
                <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'left', backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} /> {person.department}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} /> <a href={`mailto:${person.email}`} style={{ color: 'var(--text-color)', textDecoration: 'none' }}>{person.email || 'N/A'}</a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={16} /> {person.phone || 'N/A'}
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

function SearchIcon({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}
