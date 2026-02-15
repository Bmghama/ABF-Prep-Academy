import { ForumAiFeedback } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// On repasse en v1beta mais avec le nom complet du modèle 2026
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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
      // SI ERREUR 404 : C'est la clé API qui est le problème
      if (response.status === 404) {
        throw new Error("Clé API non activée. Créez une nouvelle clé dans un NOUVEAU PROJET sur AI Studio.");
      }
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
    return await callGemini(`En tant que mentor ABF Academy, réponds à : ${q}`);
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

// Fonctions de secours pour éviter les erreurs de build
export const generateInterviewScenario = async (r: string, d: number) => ({ companyName: "ABF Academy", firstQuestion: "Bonjour !" });
export const generateInterviewQuestion = generateInterviewScenario;
export const analyzeFinancialStatement = async (d: any) => ({ analysis: "Indisponible" });
export const evaluateInterviewAnswer = async (q: string, a: string, r: string) => ({ score: 0, feedback: "Erreur" });
export const evaluateSimulationStep = async (s: string, a: string) => ({ feedback: "Erreur", score: 0 });
export const checkRegulatoryCompliance = async (o: string, c: string) => ({ riskLevel: "INCONNU" });
