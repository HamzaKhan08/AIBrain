import React, { useEffect, useState } from 'react';
import { historyService } from '../services/historyService';
import { AnalysisHistoryItem, AnalysisResult } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Calendar, ChevronRight, Trash2, FileBarChart, AlertCircle } from 'lucide-react';

interface HistoryPageProps {
  onLoadAnalysis: (result: AnalysisResult) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onLoadAnalysis }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);

  useEffect(() => {
    if (user) {
      setHistory(historyService.getUserHistory(user.id));
    }
  }, [user]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    historyService.deleteHistoryItem(id);
    if (user) {
      setHistory(historyService.getUserHistory(user.id));
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all history? This cannot be undone.')) {
        if (user) {
            historyService.clearHistory(user.id);
            setHistory([]);
        }
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (history.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <Clock className="text-slate-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No History Found</h3>
            <p className="text-slate-500 max-w-sm">
                You haven't performed any analyses yet. Upload exam papers to get started and they will appear here.
            </p>
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Clock className="text-blue-600" /> Analysis History
            </h2>
            <p className="text-slate-500 text-sm">Review your past exam predictions and reports.</p>
        </div>
        <button 
            onClick={handleClearAll}
            className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
            <Trash2 size={16} /> Clear All
        </button>
      </div>

      <div className="grid gap-4">
        {history.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onLoadAnalysis(item.result)}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <FileBarChart size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {item.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <Calendar size={14} /> {formatDate(item.date)}
                            </span>
                            <span className="flex items-center gap-1">
                                <AlertCircle size={14} className="text-orange-500" /> 
                                {item.result.predictions.length} Predictions
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2 pr-12">
                            {item.result.summary}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end h-full justify-between gap-4">
                     <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                        title="Delete this record"
                    >
                        <Trash2 size={18} />
                    </button>
                    <ChevronRight className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};