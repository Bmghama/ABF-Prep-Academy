
import { GoogleGenAI } from "@google/genai";
import { ForumAiFeedback } from "../types";

// Always use named parameter for apiKey and get it from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

// Analyze forum posts for technical accuracy
export const analyzeForumPost = async (title: string, content: string, sector: string): Promise<ForumAiFeedback> => {
  try {
    const prompt = `
      TU ES UN PROFESSEUR EXPERT ABF ACADEMY (MALI/UEMOA).
      Secteur: ${sector}
      Publication: "${title} - ${content}"

      TÂCHE: Analyse la technicité de ce post. S'il s'agit d'une affirmation, vérifie-la. S'il s'agit d'une question, prépare une réponse structurée.
      
      FORMAT JSON ATTENDU:
      {
        "status": "CORRECT" | "INCORRECT" | "PARTIEL",
        "isCorrect": boolean,
        "explanation": "Explication pédagogique détaillée basée sur les normes BCEAO/CIMA/OHADA",
        "keyTerm": "Terme technique central",
        "keyDefinition": "Définition précise du terme au Mali",
        "practicalAdvice": "Conseil terrain pour un futur professionnel",
        "suggestions": ["Amélioration 1", "Amélioration 2"]
      }
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { status: 'PARTIEL', explanation: "Erreur IA", keyTerm: "N/A", keyDefinition: "N/A", practicalAdvice: "N/A", suggestions: [] };
  }
};

// Start a new interview session with a dynamic scenario
export const generateInterviewScenario = async (role: string, difficulty: number): Promise<any> => {
  try {
    const prompt = `
      TU ES UN MOTEUR DE SCÉNARIOS RH POUR ABF ACADEMY (Mali).
      Génère un SCÉNARIO D'ENTRETIEN RÉALISTE pour le poste de : ${role}.
      DIFFICULTÉ : ${difficulty}/5.
      
      INSTRUCTIONS : 
      - Crée un contexte d'entreprise malien (ex: Banque, Compagnie d'Assurance).
      - Définis une situation client ou un dossier spécifique à traiter.
      - Liste 2-3 documents virtuels simulés.
      
      FORMAT JSON ATTENDU:
      {
        "companyName": "Nom de l'entreprise fictive",
        "scenarioContext": "Contexte détaillé de l'entretien",
        "clientSituation": "Le problème ou le dossier du jour",
        "simulatedDocuments": ["Document 1", "Document 2"],
        "firstQuestion": "La première question du recruteur"
      }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { scenarioContext: "Entretien standard", firstQuestion: "Pouvez-vous vous présenter ?" };
  }
};

// Evaluate interview answers
export const evaluateInterviewAnswer = async (question: string, answer: string, role: string, difficulty: number): Promise<SimulationResult> => {
  try {
    const prompt = `
      TU ES UN RECRUTEUR RH SENIOR ET UN PROFESSEUR ABF ACADEMY (BANQUE/ASSURANCE).
      DIFFICULTÉ DU POSTE : ${difficulty}/5.
      
      Question posée : "${question}"
      Réponse du candidat : "${answer}"
      Poste visé : ${role}
      
      Évalue la réponse selon la technique (normes UEMOA/CIMA) et la posture RH.
      
      RETOURNE UN JSON :
      { 
        "score": 0-10, 
        "isCorrect": boolean,
        "feedback": "Analyse du recruteur sur votre posture", 
        "detailedExplanation": "Pourquoi cette réponse fonctionne ou échoue techniquement",
        "keyTermDefinition": "NOM DU TERME : Définition technique liée au poste (BCEAO/CIMA)",
        "fieldAdvice": "Comment un expert malien répondrait concrètement",
        "suggestion": "Conseil d'amélioration",
        "isComplete": boolean
      }
    `;
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-pro-preview', 
      contents: [{ parts: [{ text: prompt }] }], 
      config: { responseMimeType: "application/json" } 
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { 
    return { score: 5, isCorrect: false, feedback: "Analyse indisponible.", detailedExplanation: "Erreur IA", keyTermDefinition: "N/A", fieldAdvice: "Soyez précis.", isComplete: false }; 
  }
};

// Generate next interview question
export const generateInterviewQuestion = async (role: string, history: any[], difficulty: number) => {
  try {
    const prompt = `
      TU ES LE RECRUTEUR.
      Poste : ${role}. Difficulté : ${difficulty}/5.
      Historique : ${JSON.stringify(history)}
      
      Génère la PROCHAINE question technique ou comportementale de l'entretien.
      RETOURNE UNIQUEMENT LE TEXTE DE LA QUESTION.
    `;
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: [{ parts: [{ text: prompt }] }] 
    });
    return response.text || "Quelles sont vos motivations ?";
  } catch (e) { return "Parlez-moi de votre parcours."; }
};

// Ask the AI mentor for help
export const askMentor = async (question: string, userContext: string): Promise<string> => {
  try {
    const prompt = `
      TU ES LE PROFESSEUR DE ABF ACADEMY (MALI/UEMOA).
      CONTEXTE ÉTUDIANT: ${userContext}
      QUESTION: "${question}"
      
      RÉPONDS AVEC RIGUEUR TECHNIQUE (BCEAO, CIMA, OHADA).
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text || "Erreur de réponse.";
  } catch (e) { return "Une erreur technique empêche la réponse."; }
};

// Evaluate general simulation
export const evaluateSimulationStep = async (scenario: string, userAction: string, history: string, role: string): Promise<SimulationResult> => {
  try {
    const prompt = `TU ES UN SUPERVISEUR TECHNIQUE. Analyse l'action : "${userAction}" pour le rôle ${role} dans ce scénario: ${scenario}.
    RETOURNE UN JSON : { "isCorrect": boolean, "feedback": "...", "detailedExplanation": "...", "keyTermDefinition": "...", "fieldAdvice": "...", "score": 0-100, "isComplete": boolean }`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { return { feedback: "Erreur", score: 0, isComplete: true, isCorrect: false, detailedExplanation: "N/A", keyTermDefinition: "N/A", fieldAdvice: "N/A" }; }
};

// --- NOUVEAUX SERVICES ---

// Analyse de conformité LCB-FT
export const checkRegulatoryCompliance = async (operationDescription: string, clientType: string): Promise<any> => {
  try {
    const prompt = `
      TU ES UN OFFICIER DE CONFORMITÉ (COMPLIANCE OFFICER) EXPERT UMOA.
      TACHE : Vérifier la conformité d'une opération bancaire.
      
      CLIENT : ${clientType}
      OPÉRATION : ${operationDescription}
      
      RÉFÉRENCE : Loi uniforme relative à la lutte contre le blanchiment de capitaux (LCB-FT) dans les États de l'UEMOA.
      
      RETOURNE UN JSON :
      {
        "riskLevel": "FAIBLE" | "MOYEN" | "ÉLEVÉ" | "CRITIQUE",
        "isSuspicious": boolean,
        "flags": ["Anomalie 1", "Anomalie 2"],
        "requiredDocuments": ["Doc 1", "Doc 2"],
        "recommendation": "Action à entreprendre (ex: Déclaration de Soupçon)",
        "bceaoReference": "Article de loi ou directive BCEAO applicable"
      }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { return { riskLevel: "INCONNU", recommendation: "Erreur d'analyse IA." }; }
};

// Analyse Bilan Financier
export const analyzeFinancialStatement = async (data: { actif: number, passif: number, capitaux: number, resultat: number }): Promise<any> => {
  try {
    const prompt = `
      TU ES UN ANALYSTE FINANCIER CERTIFIÉ OHADA.
      DONNÉES : 
      - Total Actif : ${data.actif}
      - Total Passif : ${data.passif}
      - Capitaux Propres : ${data.capitaux}
      - Résultat Net : ${data.resultat}
      
      TACHE : Calculer les ratios et interpréter la santé financière.
      
      RETOURNE UN JSON :
      {
        "roe": "Valeur %",
        "solvency": "Valeur %",
        "healthStatus": "SAINE" | "FRAGILE" | "EN DANGER",
        "analysis": "Analyse textuelle détaillée (Liquidité, Solvabilité, Rentabilité)",
        "strengths": ["Force 1"],
        "weaknesses": ["Faiblesse 1"],
        "recommendation": "Conseil stratégique pour le DAF"
      }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { return { analysis: "Erreur d'analyse." }; }
};
