import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY 
});

export const analyzeReel = async (videoFile) => {
  try {
    // 1. Upload the file to Google's temporary file storage (MUCH FASTER than base64!)
    console.log("Uploading file to Google AI...");
    const uploadedFile = await ai.files.upload({
      file: videoFile,
      config: { mimeType: videoFile.type },
    });

    // 2. The targeted prompt
    const prompt = `
You are SaveOS AI. Extract the CORE VALUE from this video.
Focus on: OCR/Text, Audio/Subtitles, and Structured Data (lists, rankings).

Return JSON:
{
  "golden_nugget": "The ONE main thing this video teaches.",
  "extracted_data": {
    "type": "list|ranking|tutorial|comparison|tips|other",
    "items": ["Complete list of all items mentioned"],
    "details": ["Additional context"]
  },
  "action_items": ["2-3 specific actions"],
  "category": "Learning|Reference|Tools|Tutorial|Inspiration|Task",
  "confidence_score": 1-10
}
Be SPECIFIC. Extract EVERY item in a list.
`;

    // 3. Generate content using the file URI
    console.log("Analyzing with Gemini...");
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        { text: prompt },
        { 
          // This tells Gemini to look at the uploaded file directly!
          fileData: { 
            mimeType: uploadedFile.mimeType, 
            fileUri: uploadedFile.uri 
          } 
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    
    try {
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON response:", text);
      throw new Error("AI returned invalid JSON format.");
    }

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

/**
 * Generates a semantic embedding for the extracted text
 */
/**
 * Generates a semantic embedding for the extracted text
 */
export const generateEmbedding = async (text) => {
  try {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001", // ✅ Updated to the stable, free embedding model
      contents: [{ text: text }],    // ✅ Correct format for the new SDK
    });
    
    // ✅ Extract the vector values from the response
    return response.embeddings[0].values; 
  } catch (error) {
    console.error("Embedding Error:", error);
    return [];
  }
};
/**
 * Stage 7: The Pattern Finder Agent
 * Analyzes multiple saves to find hidden connections and user intent.
 */
export const findPatternsAcrossSaves = async (saves) => {
  try {
    // 1. Format the saved data into a clean list for the AI
    const saveSummaries = saves.map((save, index) => {
      const itemsPreview = save.extractedData?.items?.slice(0, 2).join(', ') || 'N/A';
      return `${index + 1}. [${save.category}] ${save.goldenNugget} (Key items: ${itemsPreview})`;
    }).join('\n');

    // 2. The "Agentic" Prompt
    const prompt = `
You are SaveOS, an advanced AI Intent Analyst. 
The user has saved the following insights recently:
---
${saveSummaries}
---

Analyze these saves deeply. Find hidden connections, underlying user goals, and patterns that the user might not even realize.

Return STRICT JSON with this structure:
{
  "overall_theme": "A 1-sentence summary of what this user is currently focused on or trying to achieve.",
  "patterns": ["List of 2-3 specific patterns you noticed (e.g., 'User is researching X to achieve Y')"],
  "missing_piece": "One thing the user hasn't saved yet but likely needs to achieve their goal.",
  "action_plan": ["A 3-step master plan combining these insights into a concrete workflow."]
}
`;

    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash", // Excellent at reasoning and agentic tasks
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
      }
    });

    // 4. Parse the JSON
    const text = response.text;
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Pattern Finder Error:", error);
    throw error;
  }
};
/**
 * Stage 8: The Action Agent
 * Turns a saved insight into a concrete, step-by-step execution plan.
 */
export const generateActionPlan = async (saveData) => {
  try {
    const prompt = `
You are SaveOS Action Agent. The user has saved the following insight:
---
Title: ${saveData.goldenNugget}
Category: ${saveData.category}
Extracted Items: ${saveData.extractedData?.items?.join(', ') || 'N/A'}
---

Your job is to turn this insight into a highly practical, actionable checklist the user can execute immediately. 

Return STRICT JSON with this structure:
{
  "plan_title": "A catchy title for this action plan",
  "tasks": [
    {
      "id": 1,
      "title": "Short, punchy task title",
      "description": "Specific details on how to do this step",
      "estimated_time": "e.g., 15 mins",
      "is_done": false
    }
  ]
}
Generate exactly 4 to 6 highly specific tasks.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Action Agent Error:", error);
    throw error;
  }
};