import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getLocalVideo } from '../services/storage';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Helper: Calculate Cosine Similarity between two vectors
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

export default function SearchSaves() {
  const [query, setQuery] = useState('');
  const [saves, setSaves] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all saves on mount
  useEffect(() => {
    const fetchSaves = async () => {
      const querySnapshot = await getDocs(collection(db, 'saves'));
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSaves(fetched);
    };
    fetchSaves();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      // 1. Embed the user's search query
      const response = await ai.models.embedContent({
        model: "text-embedding-004",
        content: query,
      });
      const queryEmbedding = response.embedding.values;

      // 2. Compare with all saved embeddings using Cosine Similarity
      const scoredResults = saves.map(save => {
        const score = cosineSimilarity(queryEmbedding, save.embedding);
        return { ...save, score };
      });

      // 3. Sort by highest similarity score
      const sorted = scoredResults.sort((a, b) => b.score - a.score).slice(0, 5); // Top 5
      setSearchResults(sorted);

    } catch (error) {
      console.error("Search Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🔍 Semantic Search</h2>
      
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., 'tools for building websites' or 'automation tips'"
          className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {searchResults.map((result) => (
          <div key={result.id} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-gray-800">{result.analysis.golden_nugget}</h3>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                Match: {(result.score * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">File: {result.fileName}</p>
            <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
              {result.analysis.extracted_data.items.slice(0, 3).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
        {searchResults.length === 0 && query && !loading && (
          <p className="text-gray-500 text-center">No matching saves found.</p>
        )}
      </div>
    </div>
  );
}