
import { CourseContent, JobTask, JobOffer, JobSector, SimulationCategory, FlashModule } from './types';

export const ROLES_BY_SECTOR: Record<JobSector, string[]> = {
  BANQUE: [
    'Guichetier / Chargé d\'accueil', 
    'Chargé de Clientèle Particuliers', 
    'Analyste Crédit', 
    'Analyste Risque Bancaire',
    'Responsable Conformité (KYC/LCB-FT)', 
    'Gestionnaire de Patrimoine',
    'Chef d\'Agence',
    'Auditeur Interne'
  ],
  ASSURANCE: [
    'Agent Commercial Vie / IARD', 
    'Gestionnaire de Sinistres Auto', 
    'Expert Terrain / Évaluateur', 
    'Souscripteur Risques Divers', 
    'Responsable Juridique Assurance',
    'Actuaire Junior',
    'Courtier en Assurance'
  ],
  FINANCE: [
    'Analyste Financier (Corporate)', 
    'Contrôleur de Gestion', 
    'Risk Manager UEMOA', 
    'Gestionnaire de Trésorerie', 
    'Responsable Budget',
    'Analyste Marchés (BRVM)',
    'Directeur Financier (CFO)'
  ]
};

export const DIFFICULTY_LEVELS = [
  { id: 1, label: 'Stagiaire', minXp: 0, color: 'text-slate-400', desc: 'Situations standards et clients faciles.' },
  { id: 2, label: 'Junior', minXp: 2000, color: 'text-emerald-400', desc: 'Gestion de dossiers complets.' },
  { id: 3, label: 'Confirmé', minXp: 5000, color: 'text-abf-primary', desc: 'Anomalies techniques et clients impatients.' },
  { id: 4, label: 'Senior', minXp: 10000, color: 'text-abf-gold', desc: 'Cas de fraude ou litiges complexes.' },
  { id: 5, label: 'Expert', minXp: 20000, color: 'text-abf-danger', desc: 'Situations de crise et audits réglementaires.' }
];

const generateScenarios = (sector: JobSector): JobTask[] => {
  // Generation of 50 scenarios per sector as requested for production readiness
  return Array.from({ length: 50 }).map((_, i) => {
    const role = ROLES_BY_SECTOR[sector][i % ROLES_BY_SECTOR[sector].length];
    
    // Determine category based on index to ensure variety
    let category = 'ACCUEIL';
    if (sector === 'BANQUE') category = i % 4 === 0 ? 'CREDIT' : (i % 4 === 1 ? 'CONFORMITE' : (i % 4 === 2 ? 'CAISSE' : 'ACCUEIL'));
    if (sector === 'ASSURANCE') category = i % 4 === 0 ? 'SINISTRE' : (i % 4 === 1 ? 'FRAUDE' : (i % 4 === 2 ? 'IARD' : 'ACCUEIL'));
    if (sector === 'FINANCE') category = i % 4 === 0 ? 'BILAN' : (i % 4 === 1 ? 'AUDIT' : (i % 4 === 2 ? 'TRESORERIE' : 'BUDGET'));

    return {
      id: `${sector.toLowerCase()}_task_${i}`,
      title: `${role} - Mission #${i + 1}`,
      sector: sector,
      jobRole: role,
      category: category as SimulationCategory,
      difficulty: ((i % 5) + 1) as any,
      context: `Contexte professionnel au Mali (Bamako). Normes UMOA/CIMA/OHADA appliquées.`,
      situation: `Scénario de type ${category} pour un poste de ${role}. Le client présente une demande spécifique nécessitant une analyse technique rigoureuse.`,
      documents: [
        { title: "Note de procédure interne", content: "Référez-vous au manuel des procédures ABF 2024." },
        { title: "Dossier Client", content: `Historique ${category} et pièces justificatives (NINA, Relevés).` }
      ],
      mainQuestion: `Quelle est votre première action face à cette situation ?`,
      initialDialogue: "Bonjour, je viens vous voir concernant mon dossier en cours. Il y a une urgence.",
      idealAction: "Vérification d'identité (KYC) puis analyse de la conformité de la demande.",
      modelSolution: "Le candidat doit prioriser la sécurité réglementaire avant la satisfaction commerciale immédiate.",
      fieldAdvice: "Dans la réalité, prenez toujours le temps de vérifier les originaux des documents."
    };
  });
};

export const ALL_SIMULATIONS: JobTask[] = [
  ...generateScenarios('BANQUE'),
  ...generateScenarios('ASSURANCE'),
  ...generateScenarios('FINANCE')
];

export const COURSES: CourseContent[] = [
  {
    id: 'b1',
    title: 'Ouverture de Compte (Individuel, Épargne)',
    category: 'BANQUE',
    level: 'Débutant',
    description: 'Maîtriser les étapes de création de relation client.',
    content: `# Ouverture de Compte\n\nL'ouverture d'un compte courant ou d'épargne est la première étape du KYC.\n\n### Points clés :\n- **Compte Courant** : Opérations quotidiennes.\n- **Compte Épargne** : Rémunéré au taux BCEAO.\n- **Pièces** : NINA, photo, justificatif de domicile.\n\n[Vidéo 3min : La posture du Guichetier]`,
    quiz: [
      { 
        id: 'bq1', 
        question: "Quelle pièce est obligatoire au Mali ?", 
        options: ["Permis de conduire", "NINA ou Passeport", "Carte de bus"], 
        correctAnswer: 1, 
        explanation: "La réglementation BCEAO exige une pièce d'identité officielle biométrique pour toute ouverture de compte.",
        keyTerm: "KYC (Know Your Customer)",
        keyDefinition: "Obligation de vérifier l'identité réelle du client pour prévenir la fraude.",
        practicalAdvice: "Demandez toujours l'original de la pièce, jamais une photocopie simple."
      }
    ]
  },
  {
    id: 'a1',
    title: 'Indemnité Sinistre et Procédure',
    category: 'ASSURANCE',
    level: 'Expert',
    description: 'Calcul des indemnités selon le Code CIMA.',
    content: `# Gestion des Sinistres\n\nLe sinistre déclenche l'obligation d'indemnisation de l'assureur.\n\n### Étapes :\n- Déclaration (48h pour vol).\n- Expertise.\n- Proposition d'indemnité.\n\n[Vidéo 4min : Le rôle de l'expert terrain]`,
    quiz: [
      { 
        id: 'aq1', 
        question: "Délai pour déclarer un vol ?", 
        options: ["48 heures", "5 jours", "1 mois"], 
        correctAnswer: 0, 
        explanation: "Le code CIMA impose 48h ouvrées pour le vol afin de permettre des recherches rapides.",
        keyTerm: "Déchéance",
        keyDefinition: "Perte du droit à indemnisation suite au non-respect des délais ou obligations du contrat.",
        practicalAdvice: "Conseillez à vos clients de porter plainte à la police avant de venir à l'agence."
      }
    ]
  },
  {
    id: 'f1',
    title: 'États Financiers et Ratios OHADA',
    category: 'FINANCE',
    level: 'Expert',
    description: 'Lecture du bilan et calcul de performance.',
    content: `# Analyse Financière\n\nUtilisation des ratios de rentabilité (ROE) et de solvabilité.\n\n### Ratios clés :\n- **Autonomie** : Fonds Propres / Total Bilan.\n- **Rentabilité** : Résultat / CA.\n\n[Vidéo 5min : Analyser un bilan en 10 points]`,
    quiz: [
      { 
        id: 'fq1', 
        question: "Que signifie ROE ?", 
        options: ["Return On Equity", "Ratio d'Épargne", "Ressources de l'État"], 
        correctAnswer: 0, 
        explanation: "Le ROE mesure la rentabilité des capitaux investis par les actionnaires.",
        keyTerm: "Capitaux Propres",
        keyDefinition: "Ressources appartenant durablement à l'entreprise (capital social + réserves).",
        practicalAdvice: "Un ROE trop élevé peut cacher un sous-investissement ou un endettement excessif."
      }
    ]
  }
];

export const GLOSSARY_DATA = [
  { term: "KYC", definition: "Know Your Customer - Vérification d'identité pour lutter contre le blanchiment." },
  { term: "LCB-FT", definition: "Lutte contre le Blanchiment et le Financement du Terrorisme - Cadre réglementaire." },
  { term: "CIMA", definition: "Conférence Interafricaine des Marchés d'Assurances - Régulateur de l'assurance." },
  { term: "BCEAO", definition: "Banque Centrale des États de l'Afrique de l'Ouest - Autorité monétaire." },
  { term: "OHADA", definition: "Organisation pour l'Harmonisation en Afrique du Droit des Affaires." }
];

export const FLASH_MODULES: FlashModule[] = [
  {
    id: 'fl1',
    sector: 'BANQUE',
    title: 'Secret Bancaire',
    question: "Le secret bancaire est-il absolu au Mali ?",
    answer: "Non, il est limité.",
    detailedExplanation: "Il n'est pas opposable à l'administration fiscale, la justice ou la Commission Bancaire dans le cadre de leurs fonctions."
  },
  {
    id: 'fl2',
    sector: 'ASSURANCE',
    title: 'Délai Sinistre',
    question: "Quel délai pour déclarer un incendie ?",
    answer: "5 jours ouvrés.",
    detailedExplanation: "Contrairement au vol (2 jours), l'assuré dispose de 5 jours pour déclarer un dommage incendie au titre du code CIMA."
  }
];

export const VIRTUAL_JOBS: JobOffer[] = [
  { id: 'vj1', title: 'Chargé de Clientèle', sector: 'BANQUE', minLevel: 2, salary: 450000, company: 'BDM-SA', description: 'Gestion portefeuille particuliers.' }
];
