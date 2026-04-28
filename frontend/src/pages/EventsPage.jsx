import { useState, useEffect } from 'react';
import { fetchEvents, rsvpEvent } from '../services/api';
import Header from '../components/Header';
import { CalendarDays, MapPin, Users, CheckCircle } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await fetchEvents();
      setEvents(data?.events || []);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (eventId) => {
    try {
      await rsvpEvent(eventId);
      await loadEvents();
    } catch (err) {
      alert("Failed to RSVP. Please try again later.");
    }
  };

  return (
    <div className="page-container">
      <Header title="Campus Events" subtitle="Discover and RSVP to upcoming events" />

      <div className="card" style={{ marginTop: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <CalendarDays size={24} color="var(--primary-color)" /> Upcoming Events
        </h2>

        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p>No upcoming events scheduled right now.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {events.map((evt) => {
              const isRsvped = evt.user_rsvped; // Assumes backend sends this flag
              const eventDate = new Date(evt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

              return (
                <div key={evt.id} style={{ border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {evt.image_url ? (
                    <img src={evt.image_url} alt={evt.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100px', backgroundColor: 'var(--primary-color)', opacity: 0.1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CalendarDays size={40} color="var(--primary-color)" />
                    </div>
                  )}
                  
                  <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{evt.title}</h3>
                      <span className="pill-badge" style={{ backgroundColor: 'var(--bg-secondary)', whiteSpace: 'nowrap' }}>{evt.category || 'General'}</span>
                    </div>
                    
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '16px', flexGrow: 1 }}>
                      {evt.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CalendarDays size={16} /> {eventDate}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} /> {evt.location || 'TBA'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={16} /> {evt.rsvp_count || 0} Attending
                      </div>
                    </div>

                    <button 
                      onClick={() => !isRsvped && handleRsvp(evt.id)}
                      disabled={isRsvped}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: isRsvped ? 'var(--bg-secondary)' : 'var(--primary-color)',
                        color: isRsvped ? 'var(--text-color)' : 'white',
                        fontWeight: 'bold',
                        cursor: isRsvped ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'opacity 0.2s'
                      }}
                    >
                      {isRsvped ? (
                        <><CheckCircle size={18} color="green" /> RSVP Confirmed</>
                      ) : (
                        'RSVP Now'
                      )}
                    </button>
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
