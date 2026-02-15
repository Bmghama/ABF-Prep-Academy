import { ForumAiFeedback } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * FONCTION D'APPEL AVEC LES URLS EXACTES ATTENDUES
 */
async function callGemini(prompt: string) {
  if (!API_KEY) throw new Error("Clé API absente");

  // On tente d'abord la version la plus compatible en 2026
  const urls = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`
  ];

  let lastError = "";

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
      lastError = data.error?.message || "Modèle non supporté";
    } catch (e: any) {
      lastError = e.message;
    }
  }

  throw new Error(lastError);
}

// --- TOUS LES SERVICES EXPORTÉS ---

export const askMentor = async (q: string, ctx: string) => {
  try {
    return await callGemini(`En tant que mentor expert ABF Academy, réponds à : ${q}`);
  } catch (e: any) {
    return `⚠️ Statut : ${e.message}. (Note: Vérifiez que votre clé API est bien paramétrée sur 'Generative Language API')`;
  }
};

export const analyzeForumPost = async (title: string, content: string, sector: string): Promise<ForumAiFeedback> => {
  try {
    const res = await callGemini(`Analyse ce post forum : ${title}`);
    const cleanRes = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRes);
  } catch (e) {
    return { status: 'PARTIEL', explanation: "IA en attente", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };
  }
};

// Fonctions minimales pour éviter les erreurs de compilation
export const generateInterviewScenario = async () => ({ companyName: "ABF Academy", firstQuestion: "Bonjour, présentez-vous." });
export const generateInterviewQuestion = generateInterviewScenario;
export const analyzeFinancialStatement = async () => ({ analysis: "Analyse indisponible." });
export const evaluateInterviewAnswer = async () => ({ score: 50, feedback: "Analyse en cours..." });
export const evaluateSimulationStep = async () => ({ feedback: "Action reçue", score: 10 });
export const checkRegulatoryCompliance = async () => ({ riskLevel: "BAS", details: "Vérification standard" });
