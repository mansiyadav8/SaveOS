import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import ActionAgent from './ActionAgent';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export default function SimpleSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePlanId, setActivePlanId] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    
    try {
      // ✅ 1. Embed the query using the CORRECT, stable model name
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001", 
        contents: [{ text: query }],
      });
      const queryEmbedding = response.embeddings[0].values;

      // ✅ 2. Get all saves from Firestore
      const snapshot = await getDocs(collection(db, 'saves'));
      const saves = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // ✅ 3. Calculate similarity and sort
      const scored = saves.map(save => ({
        ...save,
        score: cosineSimilarity(queryEmbedding, save.embedding || [])
      })).sort((a, b) => b.score - a.score);

      setResults(scored);
    } catch (error) {
      console.error("Search error:", error);
      alert("Search failed. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h3>🔍 Search Your Memory</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., 'AI tools', 'website builder', 'travel destinations'"
          style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button 
          onClick={handleSearch}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: loading ? '#ccc' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Results:</h4>
          {results.map((result, idx) => (
            <div key={result.id} style={{ 
              padding: '15px', 
              marginBottom: '10px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px',
              borderLeft: result.score > 0.7 ? '4px solid #22c55e' : '4px solid #3b82f6',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '16px', color: '#1e293b' }}>{result.goldenNugget || 'No title'}</strong>
                <span style={{ 
                  fontSize: '12px', 
                  backgroundColor: result.score > 0.7 ? '#dcfce7' : '#dbeafe', 
                  color: result.score > 0.7 ? '#166534' : '#1e40af',
                  padding: '4px 8px', 
                  borderRadius: '12px',
                  fontWeight: 'bold'
                }}>
                  {(result.score * 100).toFixed(0)}% match
                </span>
              </div>
              
              {result.extractedData?.items && result.extractedData.items.length > 0 && (
                <ul style={{ marginTop: '10px', paddingLeft: '20px', color: '#475569' }}>
                  {result.extractedData.items.slice(0, 3).map((item, i) => (
                    <li key={i} style={{ fontSize: '14px', marginBottom: '4px' }}>{item}</li>
                  ))}
                </ul>
              )}
              
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
                Category: {result.category} | Confidence: {result.confidenceScore}/10
              </div>
                 <button 
                    onClick={() => setActivePlanId(activePlanId === result.id ? null : result.id)}
                    style={{ 
                      marginTop: '12px', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold',
                      backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                    }}
                  >
                    {activePlanId === result.id ? 'Hide Plan' : '🚀 Generate Action Plan'}
                 </button>

                  {activePlanId === result.id && (
                    <ActionAgent saveData={result} />
                  )}
            </div>
          ))}
        </div>
      )}
      
      {results.length === 0 && query && !loading && (
        <p style={{ textAlign: 'center', color: '#64748b', marginTop: '20px' }}>
          No matching saves found. Try different keywords!
        </p>
      )}
    </div>
  );
}