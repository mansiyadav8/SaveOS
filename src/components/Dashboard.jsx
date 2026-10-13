import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Goes up one folder to src
import { collection, getDocs } from 'firebase/firestore';
import UploadSave from '../UploadSave'; // Goes up one folder to src
import SimpleSearch from './SimpleSearch';
import PatternFinder from './PatternFinder';
import ActionAgent from './ActionAgent';

export default function Dashboard() {
  const [saves, setSaves] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);

  // Fetch recent saves for the dashboard
  useEffect(() => {
    const fetchSaves = async () => {
      const snapshot = await getDocs(collection(db, 'saves'));
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by newest first
      fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setSaves(fetched);
    };
    fetchSaves();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Header */}
      <header style={{ marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: 0 }}>
          🧠 SaveOS <span style={{ fontSize: '14px', fontWeight: '400', color: '#6b7280', marginLeft: '10px' }}>Intent Dashboard</span>
        </h1>
        <p style={{ color: '#4b5563', marginTop: '5px' }}>
          You have <strong>{saves.length}</strong> insights in your memory.
        </p>
      </header>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Widget 1: Upload */}
          <div style={cardStyle}>
            <h3 style={cardTitle}>📤 Ingest New Reel</h3>
            <UploadSave onSaved={() => window.location.reload()} />
          </div>

          {/* Widget 2: Recent Saves */}
          <div style={cardStyle}>
            <h3 style={cardTitle}>🕒 Recent Memories</h3>
            {saves.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>No saves yet. Upload a video!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {saves.map(save => (
                  <div key={save.id} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px', color: '#1f2937' }}>{save.goldenNugget}</strong>
                      <span style={{ fontSize: '10px', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px' }}>
                        {save.category}
                      </span>
                    </div>
                    
                    {/* Action Agent Button */}
                    <button 
                      onClick={() => setActivePlanId(activePlanId === save.id ? null : save.id)}
                      style={{ 
                        marginTop: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: activePlanId === save.id ? '#dcfce7' : '#16a34a', 
                        color: activePlanId === save.id ? '#166534' : 'white', 
                        border: 'none', borderRadius: '4px', cursor: 'pointer' 
                      }}
                    >
                      {activePlanId === save.id ? 'Hide Action Plan' : '🚀 Create Action Plan'}
                    </button>

                    {activePlanId === save.id && <ActionAgent saveData={save} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Widget 3: The Intent Board (Pattern Finder) */}
          <div style={{ ...cardStyle, backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe' }}>
            <h3 style={{ ...cardTitle, color: '#5b21b6' }}>✨ Intent Board (Agentic Analysis)</h3>
            <PatternFinder />
          </div>

          {/* Widget 4: Semantic Search */}
          <div style={cardStyle}>
            <h3 style={cardTitle}>🔍 Semantic Search</h3>
            <SimpleSearch />
          </div>

        </div>
      </div>
    </div>
  );
}

// Reusable Card Styles
const cardStyle = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  border: '1px solid #f3f4f6'
};

const cardTitle = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#111827',
  marginTop: 0,
  marginBottom: '16px',
  borderBottom: '2px solid #f3f4f6',
  paddingBottom: '10px'
};