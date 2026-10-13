import React, { useState } from "react";
import { analyzeReel } from "../services/gemini";

export default function ReelAnalyzer() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError("");
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError("");

    try {
      const analysis = await analyzeReel(file);
      setResult(analysis);
    } catch (err) {
      setError("Failed to analyze video. Please ensure it's under 15MB and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🎬 SaveOS Reel Analyzer</h2>
      
      {/* Upload Section */}
      <div className="mb-6">
        <input 
          type="file" 
          accept="video/*" 
          onChange={handleFileChange} 
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {previewUrl && (
          <video src={previewUrl} controls className="mt-4 w-full rounded-lg max-h-64 object-cover" />
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleAnalyze}
        disabled={!file || isAnalyzing}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
          isAnalyzing || !file ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isAnalyzing ? "🧠 Gemini is watching and reasoning..." : "Analyze with AI"}
      </button>

      {/* Error State */}
      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}

      {/* Results Section (The "Wow" Factor) */}
      {result && (
        <div className="mt-8 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              result.category === "Task" ? "bg-red-100 text-red-800" :
              result.category === "Learning" ? "bg-green-100 text-green-800" :
              "bg-purple-100 text-purple-800"
            }`}>
              {result.category}
            </span>
            <span className="text-sm text-gray-500">
              Confidence: <strong>{result.confidence_score}/10</strong>
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-1">💡 Core Intent</h3>
            <p className="text-gray-600">{result.core_intent}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2">✅ Action Items</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-900">
              {result.action_items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}