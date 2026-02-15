import * as GoogleGenerativeAI from "@google/generative-ai";
import { ForumAiFeedback } from "../types";

// Force la lecture de la clé
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const getGenAIInstance = () => {
  // --- DIAGNOSTIC EN CONSOLE (F12) ---
  console.log("=== DIAGNOSTIC IA ABF ===");
  console.log("Clé détectée ?", !!API_KEY);
  
  if (!API_KEY) {
    console.error("ERREUR : La clé VITE_GEMINI_API_KEY est introuvable.");
    return null;
  }
  
  try {
    const moduleRaw: any = GoogleGenerativeAI;
    const GenAIClass = moduleRaw.GoogleGenAI || (moduleRaw.default && moduleRaw.default.GoogleGenAI);
    
    if (!GenAIClass) {
      console.error("ERREUR : Bibliothèque Google mal chargée.");
      return null;
    }
    
    return new GenAIClass(API_KEY);
  } catch (err) {
    console.error("ERREUR d'initialisation :", err);
    return null;
  }
};

const genAI = getGenAIInstance();

// Helper pour le modèle
const getAiModel = (modelName: string = "gemini-1.5-flash") => {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: modelName });
};

// --- SERVICES EXPORTÉS ---

export const askMentor = async (q: string, ctx: string) => {
  const model = getAiModel();
  if (!model) {
    // Ce message sera dynamique pour t'aider
    const cause = !API_KEY ? "(Clé absente sur Vercel)" : "(Erreur bibliothèque)";
    return `Je suis le mentor ABF, mais mon intelligence est en attente ${cause}.`;
  }
  try {
    const result = await model.generateContent(`Réponds en tant que mentor expert ABF Academy : ${q}`);
    return result.response.text();
  } catch (e) { 
    console.error("Erreur appel Gemini:", e);
    return "Désolé, j'ai une erreur technique de connexion."; 
  }
};

// ... (Garde tes autres fonctions exports en dessous, elles sont correctes)
export const analyzeForumPost = async (title: string, content: string, sector: string): Promise<ForumAiFeedback> => {
  const model = getAiModel();
  if (!model) return { status: 'PARTIEL', explanation: "IA non configurée", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };
  try {
    const result = await model.generateContent(`Analyse : ${title}`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { status: 'PARTIEL', explanation: "Erreur", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] }; }
};
export const generateInterviewScenario = async (role: string, difficulty: number) => {
  const model = getAiModel();
  if (!model) return { companyName: "ABF Academy", firstQuestion: "Présentez-vous." };
  try {
    const result = await model.generateContent(`Génère un entretien : ${role}`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { firstQuestion: "Parlez-moi de vous." }; }
};
export const generateInterviewQuestion = generateInterviewScenario;
export const analyzeFinancialStatement = async (data: any) => {
  const model = getAiModel();
  if (!model) return { analysis: "IA OFF" };
  try {
    const result = await model.generateContent(`Analyse : ${JSON.stringify(data)}`);
    return { analysis: result.response.text() };
  } catch (e) { return { analysis: "Erreur" }; }
};
export const evaluateInterviewAnswer = async (question: string, answer: string, role: string) => {
  const model = getAiModel();
  if (!model) return { score: 0, feedback: "IA OFF" };
  try {
    const result = await model.generateContent(`Évalue : ${answer}`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { score: 0, feedback: "Erreur" }; }
};
export const evaluateSimulationStep = async (sc: string, act: string) => {
  const model = getAiModel();
  if (!model) return { feedback: "IA OFF", score: 0 };
  try {
    const result = await model.generateContent(`Action : ${act}`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { feedback: "Erreur", score: 0 }; }
};
export const checkRegulatoryCompliance = async (op: string, cl: string) => {
  const model = getAiModel();
  if (!model) return { riskLevel: "INCONNU" };
  try {
    const result = await model.generateContent(`Vérifie : ${op}`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { riskLevel: "ERREUR" }; }
};
