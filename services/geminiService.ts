import { ForumAiFeedback } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/**
 * FONCTION UNIVERSELLE D'APPEL À L'IA (SANS BIBLIOTHÈQUE)
 */
async function callGemini(prompt: string) {
  if (!API_KEY) throw new Error("Clé API manquante");

  const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Erreur API");
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// --- SERVICES EXPORTÉS ---

export const askMentor = async (q: string, ctx: string) => {
  try {
    const prompt = `En tant que mentor expert ABF Academy au Mali, réponds à cette question de manière professionnelle : ${q}. Contexte : ${ctx}`;
    return await callGemini(prompt);
  } catch (e) {
    return "Désolé, je rencontre une difficulté technique pour répondre.";
  }
};

export const analyzeForumPost = async (title: string, content: string, sector: string): Promise<ForumAiFeedback> => {
  try {
    const prompt = `Analyse ce post forum (${title} - ${content}) pour le secteur ${sector}. Réponds uniquement en JSON avec ce format: {"status": "COMPLET", "explanation": "...", "keyTerm": "...", "keyDefinition": "...", "practicalAdvice": "...", "suggestions": []}`;
    const res = await callGemini(prompt);
    return JSON.parse(res.replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) {
    return { status: 'PARTIEL', explanation: "IA indisponible", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };
  }
};

export const generateInterviewScenario = async (role: string, difficulty: number) => {
  try {
    const prompt = `Génère un scénario d'entretien JSON pour ${role} (difficulté ${difficulty}) avec: {"companyName": "...", "firstQuestion": "..."}`;
    const res = await callGemini(prompt);
    return JSON.parse(res.replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) {
    return { companyName: "ABF Academy", firstQuestion: "Pouvez-vous vous présenter ?" };
  }
};

export const generateInterviewQuestion = generateInterviewScenario;

export const analyzeFinancialStatement = async (data: any) => {
  try {
    const res = await callGemini(`Analyse ces chiffres : ${JSON.stringify(data)}`);
    return { analysis: res };
  } catch (e) {
    return { analysis: "Analyse indisponible." };
  }
};

export const evaluateInterviewAnswer = async (question: string, answer: string, role: string) => {
  try {
    const prompt = `Évalue cette réponse d'entretien : "${answer}". Réponds en JSON : {"score": 80, "feedback": "..."}`;
    const res = await callGemini(prompt);
    return JSON.parse(res.replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) {
    return { score: 0, feedback: "Évaluation impossible." };
  }
};

export const evaluateSimulationStep = async (sc: string, act: string) => {
  try {
    const prompt = `Évalue l'action "${act}" dans le scénario "${sc}". Réponds en JSON : {"feedback": "...", "score": 10}`;
    const res = await callGemini(prompt);
    return JSON.parse(res.replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) {
    return { feedback: "Erreur", score: 0 };
  }
};

export const checkRegulatoryCompliance = async (op: string, cl: string) => {
  try {
    const prompt = `Vérifie la conformité LCB-FT de : ${op}. Réponds en JSON : {"riskLevel": "BAS", "details": "..."}`;
    const res = await callGemini(prompt);
    return JSON.parse(res.replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) {
    return { riskLevel: "INCONNU" };
  }
};
