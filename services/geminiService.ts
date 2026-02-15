import * as GoogleGenerativeAI from "@google/generative-ai";
import { ForumAiFeedback } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// FONCTION DE RÉCUPÉRATION DE LA CLASSE (FORCE BRUTE)
const getGenAIClass = () => {
  const g: any = GoogleGenerativeAI;
  // On teste tous les chemins d'accès possibles dans le bundle JS
  return g.GoogleGenAI || (g.default && g.default.GoogleGenAI) || g.default;
};

const initAI = () => {
  if (!API_KEY) return null;
  try {
    const GenAIClass = getGenAIClass();
    if (!GenAIClass || typeof GenAIClass !== 'function') return null;
    return new GenAIClass(API_KEY);
  } catch (e) {
    return null;
  }
};

const genAI = initAI();

const getAiModel = (modelName: string = "gemini-1.5-flash") => {
  if (!genAI) return null;
  try {
    return (genAI as any).getGenerativeModel({ model: modelName });
  } catch (e) {
    return null;
  }
};

// --- SERVICES ---

export const askMentor = async (q: string, ctx: string) => {
  const model = getAiModel();
  if (!model) return "Erreur de chargement du module IA. Contactez l'administrateur.";
  
  try {
    const result = await model.generateContent(`En tant que mentor ABF Academy, réponds à : ${q}`);
    return result.response.text();
  } catch (e) {
    return "Connexion établie, mais l'IA n'a pas pu répondre. Vérifiez votre quota.";
  }
};

export const analyzeForumPost = async (title: string, content: string, sector: string): Promise<ForumAiFeedback> => {
  const model = getAiModel();
  const errorRes = { status: 'PARTIEL' as const, explanation: "IA indisponible", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };
  if (!model) return errorRes;
  try {
    const result = await model.generateContent(`Analyse : ${title}`);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, ''));
  } catch (e) { return errorRes; }
};

export const generateInterviewScenario = async (role: string, difficulty: number) => {
  const model = getAiModel();
  if (!model) return { companyName: "ABF Academy", firstQuestion: "Présentez-vous." };
  try {
    const result = await model.generateContent(`Génère entretien : ${role}`);
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
