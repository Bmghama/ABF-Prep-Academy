
export enum ViewState {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  COURSE_CATALOG = 'COURSE_CATALOG',
  COURSE_READER = 'COURSE_READER',
  COURSE_QUIZ = 'COURSE_QUIZ',
  SIMULATION_HUB = 'SIMULATION_HUB',
  SIMULATION_RUNNER = 'SIMULATION_RUNNER',
  INTERVIEW_PREP = 'INTERVIEW_PREP',
  CV_BUILDER = 'CV_BUILDER',
  LEADERBOARD = 'LEADERBOARD',
  TOOLS_HUB = 'TOOLS_HUB',
  GLOSSARY = 'GLOSSARY',
  SALARY_SIM = 'SALARY_SIM',
  VIRTUAL_WORKPLACE = 'VIRTUAL_WORKPLACE',
  CERTIFICATE_VIEW = 'CERTIFICATE_VIEW',
  COMPLIANCE_CENTER = 'COMPLIANCE_CENTER',
  BILAN_ANALYZER = 'BILAN_ANALYZER',
  FLASH_REVISION = 'FLASH_REVISION',
  FORUM = 'FORUM'
}

export type JobSector = 'BANQUE' | 'ASSURANCE' | 'FINANCE';
export type EmploymentStatus = 'CHÔMAGE' | 'STAGIAIRE' | 'CDI' | 'CADRE' | 'DIRECTEUR';
export type SimulationCategory = 'SINISTRE' | 'CREDIT' | 'BILAN' | 'ACCUEIL' | 'CAISSE' | 'AUDIT' | 'FRAUDE' | 'CONFORMITE';

export interface ForumPost {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  sector: JobSector;
  createdAt: number;
  aiFeedback?: ForumAiFeedback;
  replies: ForumReply[];
}

export interface ForumReply {
  id: string;
  userName: string;
  content: string;
  createdAt: number;
  isAi: boolean;
}

export interface ForumAiFeedback {
  isCorrect?: boolean;
  status: 'CORRECT' | 'INCORRECT' | 'PARTIEL';
  explanation: string;
  keyTerm: string;
  keyDefinition: string;
  practicalAdvice: string;
  suggestions: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  isPremium: boolean;
  xp: number;
  level: number;
  jobTitle: string;
  currentSector?: JobSector;
  employmentStatus: EmploymentStatus;
  virtualWallet: number;
  virtualSalary: number;
  rankIndex: number;
  badges: string[];
  createdAt: number;
  lastActive: number;
  careerStats: {
    technicalScore: number;
    stressManagement: number;
    tasksCompleted: number;
    interviewsPassed: number;
    complianceScore: number;
    customerScore: number;
    promotionsEarned: number;
  };
  certificates: Certificate[];
  unlockedCourses: string[];
  inventory: any[];
  forumReputation: number;
}

export interface Certificate {
  id: string;
  userId: string;
  userName: string;
  sector: JobSector | 'GENERAL';
  issueDate: number;
  serialNumber: string;
  verificationUrl: string;
}

export interface JobTask {
  id: string;
  title: string;
  sector: JobSector;
  jobRole: string;
  category: SimulationCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  context: string;
  situation: string;
  documents: { title: string; content: string }[];
  mainQuestion: string;
  initialDialogue: string;
  idealAction: string;
  modelSolution: string;
  fieldAdvice: string;
}

export interface CourseContent {
  id: string;
  title: string;
  category: JobSector;
  level: string;
  description: string;
  content: string;
  quiz?: QuizQuestion[];
  progress?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  keyTerm?: string;
  keyDefinition?: string;
  practicalAdvice?: string;
}

export interface FlashModule {
  id: string;
  title: string;
  sector: JobSector;
  question: string;
  answer: string;
  detailedExplanation: string;
}

export interface JobOffer {
  id: string;
  title: string;
  sector: JobSector;
  minLevel: number;
  salary: number;
  company: string;
  description: string;
}
