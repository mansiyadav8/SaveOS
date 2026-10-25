import { useState } from "react";
import { analyzeReel } from "./services/gemini";
import { saveReelToMemory } from "./services/storage";

export default function UploadSave({ onSaved }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setResult(null);
    setError("");
    setSaved(false);
  };

  const analyzeFile = async () => {
    if (!file) {
      setError("Choose a video file before starting analysis.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const analysis = await analyzeReel(file);
      setResult(analysis);
    } catch (analysisError) {
      console.error("Could not analyze the selected reel:", analysisError);
      setError("The reel could not be analyzed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveToMemory = async () => {
    if (!file || !result) return;
    setLoading(true);
    setError("");
    try {
      await saveReelToMemory(file.name, result);
      setSaved(true);
      setFile(null);
      setResult(null);
      onSaved?.();
    } catch (saveError) {
      console.error("Could not save reel to memory:", saveError);
      setError(`The analyzed reel could not be saved: ${saveError.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-card">
      <h2>Drop a video, save an insight</h2>
      <p className="ingest-copy">Choose an Instagram reel or video file. SaveOS will extract the key ideas and make them searchable.</p>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      {file && <div className="upload-note">Selected: {file.name}</div>}
      <button className="primary-button" onClick={analyzeFile} disabled={!file || loading}>
        {loading ? "Analyzing..." : "✧ Extract insights"}
      </button>
      {error && <p className="notice" role="alert">{error}</p>}
      {saved && <p className="upload-result" role="status">Saved to your memory. It is ready to search and organize.</p>}
      {result && (
        <div className="upload-result">
          <strong>{result.golden_nugget || "Reel analyzed"}</strong>
          {result.extracted_data?.items?.length > 0 && (
            <ul>
              {result.extracted_data.items.slice(0, 3).map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
            </ul>
          )}
          <button className="green-button" onClick={saveToMemory} disabled={loading}>
            {loading ? "Saving..." : "＋ Save to memory"}
          </button>
        </div>
      )}
    </div>
  );
}
