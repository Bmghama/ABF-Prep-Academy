import { ForumAiFeedback } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// On utilise l'URL stable v1 pour éviter les bugs de la beta
const BASE_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

async function callGemini(prompt: string) {
  if (!API_KEY) throw new Error("Clé API absente dans les réglages Vercel");

  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Extrait le message d'erreur précis de Google
      const msg = data.error?.message || "Erreur inconnue";
      const status = data.error?.status || "NO_STATUS";
      throw new Error(`${msg} (Status: ${status})`);
    }

    return data.candidates[0].content.parts[0].text;
  } catch (err: any) {
    throw err;
  }
}

// --- SERVICES EXPORTÉS ---

export const askMentor = async (q: string, ctx: string) => {
  try {
    const prompt = `En tant que mentor expert ABF Academy au Mali, réponds à : ${q}`;
    return await callGemini(prompt);
  } catch (e: any) {
    // Affiche l'erreur RÉELLE sur l'écran pour qu'on puisse la corriger
    return `⚠️ Diagnostic technique : ${e.message}`;
  }
};

// ... Garde le reste de tes fonctions (analyzeForumPost, etc.) 
// mais assure-toi qu'elles appellent bien ce nouveau callGemini.
