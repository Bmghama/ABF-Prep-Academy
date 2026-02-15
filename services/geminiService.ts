import { ForumAiFeedback } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/**
 * FONCTION UNIVERSELLE D'APPEL À L'IA (Optimisée)
 */
async function callGemini(prompt: string) {
  if (!API_KEY) throw new Error("Clé API absente");

  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4, // Plus bas pour plus de précision (JSON)
          topP: 0.8,
          topK: 40
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Erreur API");
    }

    let text = data.candidates[0].content.parts[0].text;

    // Nettoyage : On extrait uniquement le bloc JSON s'il y en a un
    if (prompt.toLowerCase().includes("json")) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      text = jsonMatch ? jsonMatch[0] : text;
    }

    return text;
  } catch (err: any) {
    console.error("Gemini Error:", err);
    throw err;
  }
}

// --- SERVICES EXPORTÉS ---

export const askMentor = async (q: string, ctx: string) => {
  try {
    const prompt = `En tant que mentor expert à l'ABF Academy au Mali, réponds de manière pédagogique et encourageante à : ${q}. Contexte : ${ctx}`;
    return await callGemini(prompt);
  } catch (e: any) {
    return `⚠️ Erreur : ${e.message}`;
  }
};

export const analyzeForumPost = async (title: string, content: string, sector: string): Promise<ForumAiFeedback> => {
  try {
    const prompt = `Analyse ce post forum (${title}) pour le secteur ${sector}. 
    Réponds EXCLUSIVEMENT en JSON avec ce format : 
    {"status": "COMPLET", "explanation": "...", "keyTerm": "...", "keyDefinition": "...", "practicalAdvice": "...", "suggestions": []}`;
    
    const res = await callGemini(prompt);
    return JSON.parse(res);
  } catch (e) {
    return { status: 'PARTIEL', explanation: "Analyse indisponible", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };
  }
};

export const generateInterviewScenario = async (role: string, difficulty: number) => {
  try {
    const prompt = `Génère un scénario d'entretien pour le rôle de ${role} (Difficulté: ${difficulty}/10) à l'ABF Academy. 
    Réponds en JSON : {"companyName": "ABF Academy", "firstQuestion": "..."}`;
    const res = await callGemini(prompt);
    return JSON.parse(res);
  } catch (e) {
    return { companyName: "ABF Academy", firstQuestion: "Pouvez-vous vous présenter ?" };
  }
};

export const evaluateInterviewAnswer = async (question: string, answer: string, role: string) => {
  try {
    const prompt = `Question: ${question}. Réponse: "${answer}". Pour le rôle de ${role}, évalue la réponse. 
    Réponds en JSON : {"score": 0-100, "feedback": "...", "tips": "..."}`;
    const res = await callGemini(prompt);
    return JSON.parse(res);
  } catch (e) {
    return { score: 0, feedback: "Évaluation impossible pour le moment." };
  }
};

export const checkRegulatoryCompliance = async (op: string) => {
  try {
    const prompt = `Vérifie la conformité LCB-FT (Lutte contre le blanchiment) selon les normes UEMOA/CENTIF Mali pour l'opération suivante : ${op}. 
    Réponds en JSON : {"riskLevel": "BAS/MOYEN/ELEVE", "details": "..."}`;
    const res = await callGemini(prompt);
    return JSON.parse(res);
  } catch (e) {
    return { riskLevel: "INCONNU", details: "Erreur lors de la vérification." };
  }
};
