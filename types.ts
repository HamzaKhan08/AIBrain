
export enum QuestionType {
  THEORY = 'Theory',
  CODING = 'Coding',
  MCQ = 'MCQ',
  NUMERICAL = 'Numerical',
  CASE_STUDY = 'Case Study'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface TrendData {
  topic: string;
  count: number;
  avgDifficulty: number; // 1-10 scale
  yearsAppeared: string[];
}

export interface Prediction {
  id: string;
  question: string;
  subject: string;
  topic: string;
  type: QuestionType;
  difficulty: Difficulty;
  probability: number; // 0-100
  reasoning: string;
  tags: string[];
  expectedAnswer?: string; // Markdown content
}

export interface AnalysisResult {
  summary: string;
  trends: TrendData[];
  predictions: Prediction[];
  weakAreas: string[];
  // New Fields
  criticalTopics: string[];
  studyPlan: { step: string; description: string; duration: string }[];
}

export interface AnalysisHistoryItem {
  id: string;
  userId: string;
  date: string; // ISO string
  title: string; // Auto-generated based on content (e.g., "Computer Science - 5 Files")
  result: AnalysisResult;
}

export interface UploadedFile {
  name: string;
  type: string;
  data: string; // Base64
}

export type AnalysisStatus = 'idle' | 'analyzing' | 'complete' | 'error';

// Auth Types
export type PlanType = 'free' | 'pro' | 'enterprise';
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanType;
  role: UserRole;
  deletionRequested?: boolean;
  aiProvider?: 'gemini' | 'local';
  lastActive?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// AI Settings
export type AIProvider = 'gemini' | 'local';

export interface AISettings {
  provider: AIProvider;
  localEndpoint: string;
  localModel: string;
  apiKey?: string;
}
