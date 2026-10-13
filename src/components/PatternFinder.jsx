import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { findPatternsAcrossSaves } from '../services/gemini';

export default function PatternFinder() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeMyMemory = async () => {
    setLoading(true);
    setError('');
    setInsights(null);

    try {
      // 1. Fetch all saves from Firestore
      const snapshot = await getDocs(collection(db, 'saves'));
      const saves = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (saves.length < 2) {
        setError("Save at least 2 videos so the agent can find patterns!");
        setLoading(false);
        return;
      }

      // 2. Send to the Pattern Finder Agent
      const result = await findPatternsAcrossSaves(saves);
      setInsights(result);
    } catch (err) {
      setError("Failed to analyze memory. Check console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        ️ Connect the Dots (Agentic Analysis)
      </h3>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
        Let the AI look at all your saves and figure out your hidden goals.
      </p>

      <button 
        onClick={analyzeMyMemory}
        disabled={loading}
        style={{ 
          width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold',
          backgroundColor: loading ? '#ccc' : '#8b5cf6', color: 'white',
          border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? '🧠 Agent is thinking across your memory...' : '✨ Find Patterns in My Saves'}
      </button>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      {insights && (
        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          
          {/* Theme */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#4f46e5', margin: '0 0 5px 0' }}>🎯 Overall Theme</h4>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>{insights.overall_theme}</p>
          </div>

          {/* Patterns */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#4f46e5', margin: '0 0 10px 0' }}> Hidden Patterns</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155' }}>
              {insights.patterns.map((p, i) => <li key={i} style={{ marginBottom: '5px' }}>{p}</li>)}
            </ul>
          </div>

          {/* Missing Piece */}
          <div style={{ marginBottom: '20px', backgroundColor: '#fef3c7', padding: '10px', borderRadius: '8px' }}>
            <h4 style={{ color: '#92400e', margin: '0 0 5px 0' }}>🧩 The Missing Piece</h4>
            <p style={{ margin: 0, color: '#78350f' }}>{insights.missing_piece}</p>
          </div>

          {/* Action Plan */}
          <div>
            <h4 style={{ color: '#4f46e5', margin: '0 0 10px 0' }}>🚀 Your Master Action Plan</h4>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#334155' }}>
              {insights.action_plan.map((step, i) => <li key={i} style={{ marginBottom: '8px', fontWeight: '500' }}>{step}</li>)}
            </ol>
          </div>

        </div>
      )}
    </div>
  );
}