import * as GoogleGenerativeAI from "@google/generative-ai";
import { ForumAiFeedback } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Utilisation d'une syntaxe que Vite ne peut pas contester au build
const GenAIClass = (GoogleGenerativeAI as any).GoogleGenAI || (GoogleGenerativeAI as any).default;
const genAI = API_KEY && GenAIClass ? new GenAIClass(API_KEY) : null;

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

// --- TOUS LES SERVICES EXPORTÉS POUR APP.TSX ---

export const analyzeForumPost = async (title: string, content: string, sector: string): Promise<ForumAiFeedback> => {
  const model = getAiModel();
  if (!model) return { status: 'PARTIEL', explanation: "IA non configurée", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };
  try {
    const result = await model.generateContent(`Analyse: ${title} ${content}`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { status: 'PARTIEL', explanation: "Erreur", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] }; }
};

export const generateInterviewScenario = async (role: string, difficulty: number) => {
  const model = getAiModel();
  if (!model) return { companyName: "ABF Academy", firstQuestion: "Présentez-vous." };
  try {
    const result = await model.generateContent(`Génère entretien pour ${role}`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { firstQuestion: "Parlez-moi de vous." }; }
};

// ON AJOUTE LES FONCTIONS QUE APP.TSX RÉCLAME
export const generateInterviewQuestion = generateInterviewScenario;

export const analyzeFinancialStatement = async (data: any) => {
  const model = getAiModel();
  if (!model) return { analysis: "Analyse indisponible en mode démo." };
  try {
    const result = await model.generateContent(`Analyse ces chiffres: ${JSON.stringify(data)}`);
    return { analysis: result.response.text() };
  } catch (e) { return { analysis: "Erreur d'analyse." }; }
};

export const evaluateInterviewAnswer = async (question: string, answer: string, role: string) => {
  const model = getAiModel();
  if (!model) return { score: 0, feedback: "IA OFF" };
  try {
    const result = await model.generateContent(`Évalue: ${answer}`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { score: 0, feedback: "Erreur" }; }
};

export const askMentor = async (q: string, ctx: string) => {
  const model = getAiModel();
  if (!model) return "IA en attente.";
  try {
    const result = await model.generateContent(q);
    return result.response.text();
  } catch (e) { return "Erreur technique."; }
};

export const evaluateSimulationStep = async (sc: string, act: string) => {
  const model = getAiModel();
  if (!model) return { feedback: "IA OFF", score: 0 };
  try {
    const result = await model.generateContent(`Action: ${act}`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { feedback: "Erreur", score: 0 }; }
};

export const checkRegulatoryCompliance = async (op: string, cl: string) => {
  const model = getAiModel();
  if (!model) return { riskLevel: "INCONNU" };
  try {
    const result = await model.generateContent(`Vérifie: ${op}`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return { riskLevel: "ERREUR" }; }
};
