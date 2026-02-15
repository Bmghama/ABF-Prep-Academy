import { GoogleGenAI } from "@google/generative-ai";
import { ForumAiFeedback } from "../types";

// 1. RÉCUPÉRATION DE LA CLÉ (Syntaxe Vite)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// 2. INITIALISATION SÉCURISÉE (Empêche l'écran noir si la clé est absente)
const genAI = API_KEY ? new GoogleGenAI(API_KEY) : null;

// Type definitions for simulation result
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
  expertAnalysis?: string;
  errors?: string[];
  idealSolution?: string;
  suggestion?: string;
}

// Helper pour obtenir le modèle sans crasher
const getAiModel = (modelName: string = "gemini-1.5-flash") => {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: modelName });
};

// --- SERVICES CORRIGÉS ---

export const analyzeForumPost = async (title: string, content: string, sector: string): Promise<ForumAiFeedback> => {
  const model = getAiModel();
  if (!model) return { status: 'PARTIEL', explanation: "IA en attente de configuration.", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };

  try {
    const prompt = `TU ES UN PROFESSEUR EXPERT ABF ACADEMY (MALI/UEMOA). Secteur: ${sector}. Publication: "${title} - ${content}". Analyse et réponds en JSON: {"status": "CORRECT", "isCorrect": true, "explanation": "...", "keyTerm": "...", "keyDefinition": "...", "practicalAdvice": "...", "suggestions": []}`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text.replace(/```json/g, '').replace(/```/g, ''));
  } catch (error) {
    return { status: 'PARTIEL', explanation: "Erreur de connexion IA", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };
  }
};

export const generateInterviewScenario = async (role: string, difficulty: number): Promise<any> => {
  const model = getAiModel();
  if (!model) return { companyName: "ABF Academy", scenarioContext: "Mode Démo", firstQuestion: "Pouvez-vous vous présenter ?" };

  try {
    const prompt = `Génère un scénario d'entretien pour ${role} (Difficulté ${difficulty}/5) au Mali. Format JSON: {"companyName": "...", "scenarioContext": "...", "clientSituation": "...", "simulatedDocuments": [], "firstQuestion": "..."}`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) {
    return { scenarioContext: "Entretien standard", firstQuestion: "Parlez-moi de votre parcours." };
  }
};

export const evaluateInterviewAnswer = async (question: string, answer: string, role: string, difficulty: number): Promise<SimulationResult> => {
  const model = getAiModel();
  const errorRes = { score: 5, isCorrect: false, feedback: "IA non configurée.", detailedExplanation: "Veuillez vérifier les clés API.", keyTermDefinition: "N/A", fieldAdvice: "N/A", isComplete: false };
  
  if (!model) return errorRes;

  try {
    const prompt = `Évalue cette réponse d'entretien: Q: "${question}", R: "${answer}". Poste: ${role}. Format JSON détaillé.`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { 
    return errorRes; 
  }
};

export const askMentor = async (question: string, userContext: string): Promise<string> => {
  const model = getAiModel();
  if (!model) return "Désolé, je ne peux pas répondre pour le moment (Clé API manquante).";

  try {
    const prompt = `Tu es le mentor ABF Academy. Contexte: ${userContext}. Réponds à: "${question}"`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) { return "Une erreur technique empêche la réponse."; }
};

export const evaluateSimulationStep = async (scenario: string, userAction: string, history: string, role: string): Promise<SimulationResult> => {
  const model = getAiModel();
  if (!model) return { feedback: "Action non analysée (IA OFF)", score: 0, isComplete: false, isCorrect: false, detailedExplanation: "N/A", keyTermDefinition: "N/A", fieldAdvice: "N/A" };

  try {
    const prompt = `Analyse l'action: "${userAction}" Scénario: ${scenario}. Format JSON.`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { feedback: "Erreur analyse", score: 0, isComplete: true, isCorrect: false, detailedExplanation: "N/A", keyTermDefinition: "N/A", fieldAdvice: "N/A" }; }
};

// Nouveaux services avec sécurité
export const checkRegulatoryCompliance = async (op: string, client: string) => {
  const model = getAiModel();
  if (!model) return { riskLevel: "INCONNU", recommendation: "IA non configurée." };
  try {
    const result = await model.generateContent(`Vérifie conformité LCB-FT UEMOA: ${op} pour ${client}. Format JSON.`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { riskLevel: "ERREUR", recommendation: "Impossible d'analyser." }; }
};
