import * as GoogleGenerativeAI from "@google/generative-ai";
import { ForumAiFeedback } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * LOGIQUE D'INITIALISATION SÉCURISÉE
 * Cette syntaxe règle l'erreur "GoogleGenAI is not exported" sur Vercel
 */
const getGenAIInstance = () => {
  if (!API_KEY) return null;
  
  // On récupère le module brut
  const moduleRaw: any = GoogleGenerativeAI;
  
  // On cherche la classe à tous les endroits possibles (Standard ou ESM Default)
  const GenAIClass = moduleRaw.GoogleGenAI || (moduleRaw.default && moduleRaw.default.GoogleGenAI);
  
  if (!GenAIClass) {
    console.error("Classe GoogleGenAI introuvable dans le module");
    return null;
  }
  
  return new GenAIClass(API_KEY);
};

const genAI = getGenAIInstance();

interface SimulationResult {
  feedback: string;
  score: number;
  followUpQuestion?: string;
  clientReaction?: string;
  isComplete: boolean;
  isCorrect: boolean;
  detailedExplanation: string;
  keyTermDefinition: string;
  fieldAdvice: string;
}

const getAiModel = (modelName: string = "gemini-1.5-flash") => {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: modelName });
};

// --- SERVICES EXPORTÉS ---

export const analyzeForumPost = async (title: string, content: string, sector: string): Promise<ForumAiFeedback> => {
  const model = getAiModel();
  if (!model) return { status: 'PARTIEL', explanation: "IA non configurée (Clé manquante)", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };
  try {
    const prompt = `Analyse ce post forum ABF Academy. Secteur: ${sector}. Titre: ${title}. Contenu: ${content}. Réponds uniquement en JSON.`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { 
    return { status: 'PARTIEL', explanation: "Erreur technique IA", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] }; 
  }
};

export const generateInterviewScenario = async (role: string, difficulty: number) => {
  const model = getAiModel();
  if (!model) return { companyName: "ABF Academy", firstQuestion: "Pouvez-vous vous présenter ?" };
  try {
    const result = await model.generateContent(`Génère un scénario d'entretien pour le poste de ${role} (difficulté ${difficulty}) au Mali.`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { firstQuestion: "Parlez-moi de votre parcours." }; }
};

// ALIAS POUR LA COMPATIBILITÉ AVEC APP.TSX
export const generateInterviewQuestion = generateInterviewScenario;

export const analyzeFinancialStatement = async (data: any) => {
  const model = getAiModel();
  if (!model) return { analysis: "Analyse indisponible (Mode démo)." };
  try {
    const result = await model.generateContent(`Analyse ces données financières: ${JSON.stringify(data)}`);
    return { analysis: result.response.text() };
  } catch (e) { return { analysis: "Erreur lors de l'analyse." }; }
};

export const evaluateInterviewAnswer = async (question: string, answer: string, role: string) => {
  const model = getAiModel();
  if (!model) return { score: 0, feedback: "IA non connectée." };
  try {
    const result = await model.generateContent(`Évalue cette réponse pour le poste ${role}: "${answer}"`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { score: 0, feedback: "Échec de l'évaluation." }; }
};

export const askMentor = async (q: string, ctx: string) => {
  const model = getAiModel();
  if (!model) return "Je suis le mentor ABF, mais mon intelligence est en attente de configuration (Clé API).";
  try {
    const result = await model.generateContent(`En tant que mentor ABF Academy, réponds à : ${q} (Contexte : ${ctx})`);
    return result.response.text();
  } catch (e) { return "Désolé, une erreur technique m'empêche de répondre."; }
};

export const evaluateSimulationStep = async (sc: string, act: string) => {
  const model = getAiModel();
  if (!model) return { feedback: "Mode hors-ligne", score: 0 };
  try {
    const result = await model.generateContent(`Évalue cette action dans la simulation: ${act}`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { feedback: "Erreur d'analyse", score: 0 }; }
};

export const checkRegulatoryCompliance = async (op: string, cl: string) => {
  const model = getAiModel();
  if (!model) return { riskLevel: "INCONNU" };
  try {
    const result = await model.generateContent(`Vérifie la conformité LCB-FT pour: ${op}`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { riskLevel: "ERREUR" }; }
};
