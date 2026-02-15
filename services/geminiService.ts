import { ForumAiFeedback } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// On utilise l'alias "gemini-1.5-flash" sans versioning forcé pour laisser Google choisir
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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
      // Si ça dit encore NOT_FOUND, on saura que c'est la clé le problème
      throw new Error(data.error?.message || "Erreur Google");
    }

    if (!data.candidates || data.candidates[0].content.parts[0].text === undefined) {
      throw new Error("Réponse vide de l'IA.");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (err: any) {
    throw err;
  }
}

// --- SERVICES EXPORTÉS ---

export const askMentor = async (q: string, ctx: string) => {
  try {
    const prompt = `En tant que mentor expert ABF Academy au Mali, réponds à : ${q}. Contexte : ${ctx}`;
    return await callGemini(prompt);
  } catch (e: any) {
    return `⚠️ Diagnostic : ${e.message}`;
  }
};

export const analyzeForumPost = async (title: string, content: string, sector: string): Promise<ForumAiFeedback> => {
  try {
    const res = await callGemini(`Analyse ce post forum : ${title} - ${content}`);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { status: 'PARTIEL', explanation: "IA indisponible", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };
  }
};

export const generateInterviewScenario = async (role: string, difficulty: number) => {
  try {
    const res = await callGemini(`Génère un scénario d'entretien pour ${role}`);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
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
    const res = await callGemini(`Évalue cette réponse : ${answer}`);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { score: 0, feedback: "Évaluation impossible." };
  }
};

export const evaluateSimulationStep = async (sc: string, act: string) => {
  try {
    const res = await callGemini(`Évalue l'action : ${act}`);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { feedback: "Erreur", score: 0 };
  }
};

export const checkRegulatoryCompliance = async (op: string, cl: string) => {
  try {
    const res = await callGemini(`Vérifie conformité LCB-FT : ${op}`);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { riskLevel: "INCONNU" };
  }
};
