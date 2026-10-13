import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateEmbedding } from './gemini';

/**
 * Saves ONLY the extracted AI findings to Firestore
 * No video files stored - just the valuable insights!
 */
export const saveReelToMemory = async (fileName, analysis) => {
  try {
    const userId = auth.currentUser?.uid || 'guest_user';

    // 1. Generate Embedding for Semantic Search
    // Combine all valuable text for rich search context
    const textToEmbed = `
      ${analysis.golden_nugget} 
      ${analysis.extracted_data.items.join(' ')} 
      ${analysis.action_items.join(' ')}
    `;
    const embedding = await generateEmbedding(textToEmbed);

    // 2. Save ONLY the lightweight metadata + embedding to Firestore
    const saveData = {
      userId,
      fileName, // Just the name, not the file
      goldenNugget: analysis.golden_nugget,
      extractedData: analysis.extracted_data,
      actionItems: analysis.action_items,
      category: analysis.category,
      confidenceScore: analysis.confidence_score,
      embedding: embedding, // The vector for semantic search
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'saves'), saveData);
    
    console.log("✅ Saved to Memory:", docRef.id);
    console.log("📊 Data size:", JSON.stringify(saveData).length, "bytes");
    return docRef.id;

  } catch (error) {
    console.error("❌ Memory Storage Error:", error);
    throw error;
  }
};

/**
 * Optional: Get all saves for the user
 */
export const getAllSaves = async () => {
  const { getDocs, collection } = await import('firebase/firestore');
  const { db } = await import('../firebase');
  
  const querySnapshot = await getDocs(collection(db, 'saves'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};