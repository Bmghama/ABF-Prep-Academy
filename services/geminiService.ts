import { ForumAiFeedback } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// On passe sur le modèle 8b, souvent plus facile d'accès pour les nouveaux comptes
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent";

async function callGemini(prompt: string) {
  if (!API_KEY) throw new Error("Clé API absente dans Vercel");

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
      // Si même ici ça dit NOT_FOUND, il faudra créer une clé dans un "New Project"
      throw new Error(data.error?.message || "Erreur Google");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (err: any) {
    throw err;
  }
}

// --- SERVICES EXPORTÉS ---

export const askMentor = async (q: string, ctx: string) => {
  try {
    const prompt = `Mentor ABF Academy Mali : ${q}. Contexte : ${ctx}`;
    return await callGemini(prompt);
  } catch (e: any) {
    return `⚠️ Diagnostic : ${e.message}`;
  }
};

export const analyzeForumPost = async (title: string, content: string, sector: string): Promise<ForumAiFeedback> => {
  try {
    const res = await callGemini(`Analyse JSON : ${title}`);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { status: 'PARTIEL', explanation: "IA indisponible", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };
  }
};

export const generateInterviewScenario = async (role: string, difficulty: number) => {
  try {
    const res = await callGemini(`Génère scénario : ${role}`);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
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
    return { analysis: "Erreur" };
  }
};

export const evaluateInterviewAnswer = async (question: string, answer: string, role: string) => {
  try {
    const res = await callGemini(`Évalue : ${answer}`);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { score: 0, feedback: "Erreur" };
  }
};

export const evaluateSimulationStep = async (sc: string, act: string) => {
  try {
    const res = await callGemini(`Évalue : ${act}`);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { feedback: "Erreur", score: 0 };
  }
};

export const checkRegulatoryCompliance = async (op: string, cl: string) => {
  try {
    const res = await callGemini(`Vérifie : ${op}`);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { riskLevel: "INCONNU" };
  }
};
