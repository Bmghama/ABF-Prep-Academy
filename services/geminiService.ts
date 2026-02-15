import { ForumAiFeedback } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// On repasse sur v1beta car c'est là que se trouve gemini-1.5-flash
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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
      const status = data.error?.status || "NO_STATUS";
      throw new Error(`${msg} (Status: ${status})`);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("Google n'a renvoyé aucune réponse (Candidate empty)");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (err: any) {
    throw err;
  }
}

// --- SERVICES EXPORTÉS ---
// Garde toutes tes fonctions askMentor, analyzeForumPost, etc. telles qu'elles sont.
// Elles utiliseront automatiquement la nouvelle BASE_URL.

export const askMentor = async (q: string, ctx: string) => {
  try {
    const prompt = `En tant que mentor expert ABF Academy au Mali, réponds à : ${q}. Contexte : ${ctx}`;
    return await callGemini(prompt);
  } catch (e: any) {
    return `⚠️ Diagnostic technique : ${e.message}`;
  }
};

// ... (Assure-toi que les autres fonctions exportées sont présentes pour éviter l'erreur de build précédente)
export const analyzeForumPost = async (title: string, content: string, sector: string): Promise<ForumAiFeedback> => {
  try {
    const prompt = `Analyse ce post forum (${title}) pour le secteur ${sector}. Réponds en JSON : {"status": "COMPLET", "explanation": "...", "keyTerm": "...", "keyDefinition": "...", "practicalAdvice": "...", "suggestions": []}`;
    const res = await callGemini(prompt);
    return JSON.parse(res.replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) {
    return { status: 'PARTIEL', explanation: "IA indisponible", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };
  }
};

export const generateInterviewScenario = async (role: string, difficulty: number) => {
  try {
    const prompt = `Génère un scénario d'entretien JSON pour ${role} avec: {"companyName": "...", "firstQuestion": "..."}`;
    const res = await callGemini(prompt);
    return JSON.parse(res.replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) {
    return { companyName: "ABF Academy", firstQuestion: "Présentez-vous." };
  }
};

export const generateInterviewQuestion = generateInterviewScenario;

export const analyzeFinancialStatement = async (data: any) => {
  try {
    const res = await callGemini(`Analyse : ${JSON.stringify(data)}`);
    return { analysis: res };
  } catch (e) {
    return { analysis: "Analyse indisponible." };
  }
};

export const evaluateInterviewAnswer = async (question: string, answer: string, role: string) => {
  try {
    const prompt = `Évalue : "${answer}". Réponds en JSON : {"score": 80, "feedback": "..."}`;
    const res = await callGemini(prompt);
    return JSON.parse(res.replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) {
    return { score: 0, feedback: "Erreur." };
  }
};

export const evaluateSimulationStep = async (sc: string, act: string) => {
  try {
    const prompt = `Évalue l'action "${act}". Réponds en JSON : {"feedback": "...", "score": 10}`;
    const res = await callGemini(prompt);
    return JSON.parse(res.replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) {
    return { feedback: "Erreur", score: 0 };
  }
};

export const checkRegulatoryCompliance = async (op: string, cl: string) => {
  try {
    const prompt = `Vérifie conformité LCB-FT de : ${op}. Réponds en JSON : {"riskLevel": "BAS", "details": "..."}`;
    const res = await callGemini(prompt);
    return JSON.parse(res.replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) {
    return { riskLevel: "INCONNU" };
  }
};
