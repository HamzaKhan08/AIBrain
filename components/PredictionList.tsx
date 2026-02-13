import React, { useState } from 'react';
import { Prediction, QuestionType, Difficulty } from '../types';
import { ChevronDown, ChevronUp, Brain, Code, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';
import { generateSolution } from '../services/geminiService';

interface PredictionListProps {
  predictions: Prediction[];
}

export const PredictionList: React.FC<PredictionListProps> = ({ predictions }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingSolution, setLoadingSolution] = useState<string | null>(null);
  const [solutions, setSolutions] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleGetSolution = async (e: React.MouseEvent, prediction: Prediction) => {
    e.stopPropagation();
    if (solutions[prediction.id]) {
        toggleExpand(prediction.id);
        return;
    }
    
    setLoadingSolution(prediction.id);
    try {
        const sol = await generateSolution(prediction.question);
        setSolutions(prev => ({ ...prev, [prediction.id]: sol }));
        if (expandedId !== prediction.id) {
            setExpandedId(prediction.id);
        }
    } catch (err) {
        console.error(err);
    } finally {
        setLoadingSolution(null);
    }
  };

  const getConfidenceColor = (prob: number) => {
    if (prob >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (prob >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getTypeIcon = (type: QuestionType) => {
    switch (type) {
        case QuestionType.CODING: return <Code size={16} />;
        case QuestionType.THEORY: return <BookOpen size={16} />;
        default: return <Brain size={16} />;
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <h2 className="text-2xl font-bold text-slate-800">Predicted Questions</h2>
        <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {predictions.length} High Probability Items
        </span>
      </div>

      {predictions.map((pred) => (
        <div 
            key={pred.id} 
            className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${expandedId === pred.id ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
        >
            {/* Card Header */}
            <div 
                className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row items-start gap-4"
                onClick={() => toggleExpand(pred.id)}
            >
                <div className="flex w-full sm:w-auto items-start gap-4">
                    {/* Probability Badge */}
                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg border flex-shrink-0 ${getConfidenceColor(pred.probability)}`}>
                        <span className="text-lg font-bold">{pred.probability}%</span>
                        <span className="text-[10px] uppercase font-bold tracking-wide">Prob</span>
                    </div>
                    
                    {/* Mobile Only Title (if needed) or keep unified flow */}
                    <div className="sm:hidden flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                             <span className="text-xs text-slate-400 font-medium px-2 py-0.5 border border-slate-100 rounded">
                                {pred.subject}
                            </span>
                             {pred.difficulty === Difficulty.HARD && (
                                <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                                    <AlertTriangle size={12} /> Hard
                                </span>
                            )}
                        </div>
                        <h3 className="text-base font-medium text-slate-800 leading-snug line-clamp-2">
                            {pred.question}
                        </h3>
                    </div>
                </div>

                <div className="hidden sm:block flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded text-slate-600 bg-slate-100 uppercase tracking-wide`}>
                            {getTypeIcon(pred.type)} {pred.type}
                        </span>
                        <span className="text-xs text-slate-400 font-medium px-2 py-0.5 border border-slate-100 rounded">
                            {pred.subject} / {pred.topic}
                        </span>
                        {pred.difficulty === Difficulty.HARD && (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                                <AlertTriangle size={12} /> Hard
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 leading-snug">
                        {pred.question}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                        <Brain size={14} className="text-purple-500 flex-shrink-0" /> 
                        <span className="italic line-clamp-1">AI Reasoning: {pred.reasoning}</span>
                    </p>
                </div>
                
                {/* Mobile: Show minimal footer info if expanded/collapsed or just button */}
                <div className="flex w-full sm:w-auto justify-between sm:flex-col sm:items-end gap-2 mt-2 sm:mt-0">
                     <div className="sm:hidden flex items-center gap-1 text-xs text-slate-500">
                         <Brain size={14} className="text-purple-500" />
                         <span>AI Analysis</span>
                     </div>
                     <button 
                        onClick={(e) => handleGetSolution(e, pred)}
                        disabled={loadingSolution === pred.id}
                        className="flex-1 sm:flex-none justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loadingSolution === pred.id ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            solutions[pred.id] ? <CheckCircle size={16} /> : <Code size={16} />
                        )}
                        {solutions[pred.id] ? 'View' : 'Solve'}
                    </button>
                    <div className="hidden sm:block">
                        {expandedId === pred.id ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {expandedId === pred.id && (
                <div className="bg-slate-50 border-t border-slate-100 p-4 sm:p-6 animate-fade-in">
                    {/* Mobile reasoning detail */}
                    <div className="sm:hidden mb-4 text-sm text-slate-600 italic bg-white p-3 rounded border border-slate-100">
                        <strong>Reasoning:</strong> {pred.reasoning}
                    </div>

                    <div className="prose prose-sm max-w-none prose-blue">
                        <h4 className="text-slate-700 font-semibold mb-2">Detailed Solution & Explanation</h4>
                        {solutions[pred.id] ? (
                            <div className="bg-white p-4 rounded-lg border border-slate-200 font-mono text-sm whitespace-pre-wrap text-slate-700 overflow-x-auto">
                                {solutions[pred.id]}
                            </div>
                        ) : (
                            <div className="text-slate-500 italic">
                                Click "Solve" to generate a comprehensive answer for this question using the Gemini 3 Pro model.
                            </div>
                        )}
                    </div>
                    
                    {pred.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {pred.tags.map(tag => (
                                <span key={tag} className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      ))}
    </div>
  );
};