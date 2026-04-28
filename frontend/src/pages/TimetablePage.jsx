import React from 'react';
import ErpLayout from '../components/ErpLayout';
import TimetableWidget from '../components/TimetableWidget';

export default function TimetablePage() {
  return (
    <ErpLayout title="Timetable" subtitle="Your weekly class schedule">
      <div style={{ maxWidth: '1200px', width: '100%' }}>
        <TimetableWidget />
      </div>
    </ErpLayout>
  );
}
