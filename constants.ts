import { LucideIcon, FileText, BarChart2, Brain, Code, BookOpen, History } from 'lucide-react';

export const APP_NAME = "AIBrain";

export const NAV_ITEMS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'upload', label: 'Upload & Parse', icon: FileText },
  { id: 'dashboard', label: 'Trend Analysis', icon: BarChart2 },
  { id: 'predictions', label: 'Predictions', icon: Brain },
  { id: 'practice', label: 'Practice Mode', icon: Code },
  { id: 'history', label: 'History & Reports', icon: History },
];

export const MOCK_ANALYSIS_DATA = {
  summary: "Based on the last 5 years of data, the focus has shifted towards Applied AI and Distributed Systems. Core theoretical concepts in Data Structures remain a staple.",
  trends: [
    { topic: "Dynamic Programming", count: 12, avgDifficulty: 8, yearsAppeared: ["2019", "2021", "2022", "2023"] },
    { topic: "Graph Theory", count: 8, avgDifficulty: 7, yearsAppeared: ["2020", "2022", "2023"] },
    { topic: "System Design", count: 15, avgDifficulty: 6, yearsAppeared: ["2019", "2020", "2021", "2022", "2023"] },
    { topic: "Sorting Algos", count: 5, avgDifficulty: 3, yearsAppeared: ["2019", "2021"] },
  ],
  predictions: [],
  weakAreas: ["Graph Algorithms", "Concurrency Control"]
};