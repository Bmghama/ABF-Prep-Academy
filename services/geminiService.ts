import { ForumAiFeedback } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Liste des endpoints du plus récent au plus compatible
const ENDPOINTS = [
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
  "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
];

async function callGemini(prompt: string) {
  if (!API_KEY) throw new Error("Clé API manquante dans Vercel");

  let lastError = "";

  for (const url of ENDPOINTS) {
    try {
      const response = await fetch(`${url}?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();

      if (response.ok && data.candidates) {
        return data.candidates[0].content.parts[0].text;
      }
      
      lastError = data.error?.message || "Erreur inconnue";
    } catch (e) {
      continue; // On tente l'URL suivante
    }
  }

  throw new Error(`Toutes les tentatives ont échoué. Cause : ${lastError}`);
}

// --- SERVICES ---
export const askMentor = async (q: string, ctx: string) => {
  try {
    return await callGemini(`Mentor ABF Academy Mali : ${q}`);
  } catch (e: any) {
    return `⚠️ Diagnostic Final : ${e.message}. Action : Vérifiez que l'API 'Generative Language' est bien activée sur votre clé.`;
  }
};

// Fonctions minimales pour le build
export const analyzeForumPost = async (t: string) => ({ status: 'PARTIEL' });
export const generateInterviewScenario = async () => ({ companyName: "ABF" });
export const generateInterviewQuestion = generateInterviewScenario;
export const analyzeFinancialStatement = async () => ({ analysis: "N/A" });
export const evaluateInterviewAnswer = async () => ({ score: 0 });
export const evaluateSimulationStep = async () => ({ score: 0 });
export const checkRegulatoryCompliance = async () => ({ riskLevel: "BAS" });
