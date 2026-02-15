import { ForumAiFeedback } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// SOLUTION DE SECOURS : gemini-1.0-pro est le modèle le plus stable et compatible
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent";

/**
 * FONCTION UNIVERSELLE D'APPEL À L'IA
 */
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
      const msg = data.error?.message || "Erreur inconnue";
      throw new Error(msg);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("Aucune réponse reçue de l'IA.");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (err: any) {
    throw err;
  }
}

// --- TOUS LES SERVICES EXPORTÉS (NE RIEN SUPPRIMER) ---

export const askMentor = async (q: string, ctx: string) => {
  try {
    const prompt = `En tant que mentor expert ABF Academy au Mali, réponds à cette question : ${q}. Contexte : ${ctx}`;
    return await callGemini(prompt);
  } catch (e: any) {
    return `⚠️ Diagnostic : ${e.message}`;
  }
};

export const analyzeForumPost = async (title: string, content: string, sector: string): Promise<ForumAiFeedback> => {
  try {
    const prompt = `Analyse ce post forum (${title}) pour le secteur ${sector}. Réponds uniquement en JSON avec ce format: {"status": "COMPLET", "explanation": "...", "keyTerm": "...", "keyDefinition": "...", "practicalAdvice": "...", "suggestions": []}`;
    const res = await callGemini(prompt);
    // Nettoyage des balises markdown si l'IA en ajoute
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { status: 'PARTIEL', explanation: "IA indisponible", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };
  }
};

export const generateInterviewScenario = async (role: string, difficulty: number) => {
  try {
    const prompt = `Génère un scénario d'entretien JSON pour ${role} avec: {"companyName": "...", "firstQuestion": "..."}`;
    const res = await callGemini(prompt);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { companyName: "ABF Academy", firstQuestion: "Pouvez-vous vous présenter ?" };
  }
};

export const generateInterviewQuestion = generateInterviewScenario;

export const analyzeFinancialStatement = async (data: any) => {
  try {
    const res = await callGemini(`Analyse ces chiffres financiers : ${JSON.stringify(data)}`);
    return { analysis: res };
  } catch (e) {
    return { analysis: "Analyse indisponible." };
  }
};

export const evaluateInterviewAnswer = async (question: string, answer: string, role: string) => {
  try {
    const prompt = `Évalue cette réponse : "${answer}" pour le poste ${role}. Réponds en JSON : {"score": 80, "feedback": "..."}`;
    const res = await callGemini(prompt);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { score: 0, feedback: "Évaluation impossible." };
  }
};

export const evaluateSimulationStep = async (sc: string, act: string) => {
  try {
    const prompt = `Évalue l'action "${act}" dans le scénario "${sc}". Réponds en JSON : {"feedback": "...", "score": 10}`;
    const res = await callGemini(prompt);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { feedback: "Erreur", score: 0 };
  }
};

export const checkRegulatoryCompliance = async (op: string, cl: string) => {
  try {
    const prompt = `Vérifie la conformité LCB-FT de : ${op}. Réponds en JSON : {"riskLevel": "BAS", "details": "..."}`;
    const res = await callGemini(prompt);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { riskLevel: "INCONNU" };
  }
};
