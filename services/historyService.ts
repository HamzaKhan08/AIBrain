import { AnalysisResult, AnalysisHistoryItem } from '../types';

const HISTORY_KEY = 'aiBrain_history';

export const historyService = {
  saveAnalysis: (userId: string, result: AnalysisResult, fileCount: number): void => {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    
    // Auto-generate a title based on the first topic or generic
    const topTopic = result.trends && result.trends.length > 0 ? result.trends[0].topic : 'General';
    const title = `${topTopic} Analysis (${fileCount} Papers)`;

    const newItem: AnalysisHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      date: new Date().toISOString(),
      title,
      result
    };

    // Add to top of list
    history.unshift(newItem);
    
    // Limit to last 20 items to save space
    if (history.length > 20) {
        history.pop();
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },

  getUserHistory: (userId: string): AnalysisHistoryItem[] => {
    const history: AnalysisHistoryItem[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return history.filter(item => item.userId === userId);
  },

  deleteHistoryItem: (id: string): void => {
    const history: AnalysisHistoryItem[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const newHistory = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  },
  
  clearHistory: (userId: string): void => {
    const history: AnalysisHistoryItem[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const newHistory = history.filter(item => item.userId !== userId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  }
};