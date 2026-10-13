import { useState } from "react";
import { analyzeReel } from "./services/gemini";
import { saveReelToMemory } from "./services/storage";


export default function UploadSave() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const sendToGemini = async () => {
    if (!file) return;
    setLoading(true);
    
    try {
      const analysis = await analyzeReel(file); 
      setResult(analysis);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToMemory = async () => {
    if (!result) return;
    setLoading(true);
    
    try {
      await saveReelToMemory(file.name, result);
      alert("✅ Saved! The insights are now searchable.");
      setResult(null); // Clear the form
      setFile(null);
    } catch (error) {
      alert("Failed to save: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">📤 Upload Reel</h2>
      
      <input 
        type="file" 
        accept="video/*" 
        onChange={handleFileChange} 
        className="mb-4"
      />
      
      <button
        onClick={sendToGemini}
        disabled={!file || loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg mb-4"
      >
        {loading ? "Analyzing..." : "🤖 Extract Insights with Gemini"}
      </button>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800">💎 Golden Nugget</h3>
            <p className="text-green-900">{result.golden_nugget}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold text-blue-800"> Extracted Data</h3>
            <ul className="list-disc list-inside mt-2">
              {result.extracted_data.items.map((item, idx) => (
                <li key={idx} className="text-gray-700">{item}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleSaveToMemory}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            💾 Save Insights to Memory
          </button>
        </div>
      )}
    </div>
  );
}