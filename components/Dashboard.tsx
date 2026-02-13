import React from 'react';
import { AnalysisResult } from '../types';
import { Target, TrendingUp, AlertTriangle, Lightbulb, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

interface DashboardProps {
  data: AnalysisResult;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const sortedTrends = [...data.trends].sort((a, b) => b.count - a.count);
  
  // Extract all unique years found in data for the Matrix
  const allYears: string[] = Array.from(new Set(data.trends.flatMap(t => t.yearsAppeared) as string[])).sort();
  // Get top 10 topics for the matrix to leverage full width
  const matrixTopics = sortedTrends.slice(0, 10);

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      
      {/* 1. Executive Summary & Critical Alerts */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <h2 className="text-2xl font-bold mb-3 flex items-center gap-2 relative z-10">
            <Lightbulb className="text-yellow-400" /> AI Insights Summary
        </h2>
        <p className="text-indigo-100 leading-relaxed text-lg relative z-10 max-w-4xl">
          {data.summary}
        </p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
             {/* Critical Topic Card */}
             <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                <h4 className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle size={12} className="text-red-400" /> Highest Priority
                </h4>
                <div className="flex flex-wrap gap-2">
                    {data.criticalTopics && data.criticalTopics.slice(0, 3).map((topic, i) => (
                        <span key={i} className="bg-red-500/20 text-red-100 px-2 py-1 rounded text-sm font-medium border border-red-500/30">
                            {topic}
                        </span>
                    ))}
                     {(!data.criticalTopics || data.criticalTopics.length === 0) && <span className="text-sm">General Review</span>}
                </div>
             </div>

             {/* Weak Areas Card */}
             <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                <h4 className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Target size={12} className="text-orange-400" /> Recommended Focus
                </h4>
                <div className="flex flex-wrap gap-2">
                    {data.weakAreas && data.weakAreas.slice(0, 3).map((area, i) => (
                        <span key={i} className="bg-orange-500/20 text-orange-100 px-2 py-1 rounded text-sm font-medium border border-orange-500/30">
                            {area}
                        </span>
                    ))}
                    {(!data.weakAreas || data.weakAreas.length === 0) && <span className="text-sm">Standard Revision</span>}
                </div>
             </div>

             {/* Stats Card */}
             <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-indigo-200 text-sm">Prediction Confidence</span>
                    <span className="text-green-300 font-bold">High</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-400 h-full w-[85%]"></div>
                </div>
                <div className="mt-2 text-xs text-indigo-300">
                    Based on {data.trends.length} analyzed topics
                </div>
             </div>
        </div>
      </div>

      {/* Stacked Layout for Full Width Cards */}
      <div className="flex flex-col gap-8">
        
        {/* 2. Topic Recurrence Matrix */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-600" /> Topic Recurrence Matrix
                    </h3>
                    <p className="text-xs text-slate-500">Visual history of top topics across uploaded years</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div> High Freq</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-slate-200 rounded-full"></div> Not Asked</span>
                </div>
             </div>
             
             <div className="overflow-x-auto relative">
                 <table className="w-full text-sm text-left border-collapse">
                     <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                         <tr>
                             <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium whitespace-nowrap sticky left-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Topic / Concept</th>
                             {allYears.map(year => (
                                 <th key={year} className="px-3 py-3 sm:px-4 sm:py-4 text-center whitespace-nowrap border-b border-slate-200">{year.replace(/[^0-9]/g, '')}</th>
                             ))}
                             <th className="px-3 py-3 sm:px-4 sm:py-4 text-center whitespace-nowrap border-b border-slate-200 bg-slate-50/50">Frequency</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {matrixTopics.map((item, idx) => (
                             <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                 <td className="px-4 py-3 sm:px-6 sm:py-4 font-medium text-slate-700 flex flex-col sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 transition-colors">
                                     <span className="truncate max-w-[150px] sm:max-w-xs block" title={item.topic}>{item.topic}</span>
                                     <span className="text-[10px] text-slate-400 font-normal mt-0.5">Avg Diff: {item.avgDifficulty}/10</span>
                                 </td>
                                 {allYears.map(year => {
                                     const appeared = item.yearsAppeared.some(y => y.includes(year));
                                     return (
                                         <td key={year} className="px-3 py-3 sm:px-4 sm:py-4 text-center">
                                             {appeared ? (
                                                 <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto ring-4 ring-blue-50">
                                                     <CheckCircle2 size={14} strokeWidth={3} />
                                                 </div>
                                             ) : (
                                                 <div className="w-1.5 h-1.5 bg-slate-200 rounded-full mx-auto"></div>
                                             )}
                                         </td>
                                     );
                                 })}
                                 <td className="px-3 py-3 sm:px-4 sm:py-4 text-center font-bold text-slate-700 bg-slate-50/30">
                                     {item.count}
                                 </td>
                             </tr>
                         ))}
                         {matrixTopics.length === 0 && (
                             <tr>
                                 <td colSpan={allYears.length + 2} className="px-6 py-8 text-center text-slate-500 italic">
                                     Not enough yearly data to generate a matrix. Ensure file names contain years (e.g., "Paper_2022").
                                 </td>
                             </tr>
                         )}
                     </tbody>
                 </table>
             </div>
             {matrixTopics.length < sortedTrends.length && (
                 <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-center">
                     <span className="text-xs text-slate-400">Showing top 10 of {sortedTrends.length} analyzed topics</span>
                 </div>
             )}
        </div>

        {/* 3. AI Study Strategy */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
             <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp size={18} className="text-green-600" /> Strategic Study Roadmap
                </h3>
                <p className="text-xs text-slate-500">AI-generated step-by-step preparation guide based on pattern analysis</p>
             </div>
             
             <div className="p-6 md:p-10">
                 <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                     {data.studyPlan && data.studyPlan.map((step, idx) => (
                         <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                             {/* Icon Marker */}
                             <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 group-[.is-active]:bg-blue-600 group-[.is-active]:text-white text-slate-500 shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-auto md:relative z-10 transition-transform group-hover:scale-110">
                                 <span className="font-bold text-sm">{idx + 1}</span>
                             </div>
                             
                             {/* Content Card */}
                             <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-xl border border-slate-200 shadow-sm ml-14 md:ml-0 hover:shadow-md transition-shadow">
                                 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                     <h4 className="font-bold text-slate-800 text-base">{step.step}</h4>
                                     <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 self-start sm:self-auto whitespace-nowrap">
                                         {step.duration}
                                     </span>
                                 </div>
                                 <p className="text-sm text-slate-600 leading-relaxed">
                                     {step.description}
                                 </p>
                             </div>
                         </div>
                     ))}
                     
                     {(!data.studyPlan || data.studyPlan.length === 0) && (
                         <div className="text-center p-4 text-slate-500 italic">
                             AI could not generate a detailed study plan. Upload more data.
                         </div>
                     )}
                 </div>
                 
                 <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                     <p className="text-slate-400 text-sm italic mb-4">
                        "Success is the sum of small efforts, repeated day in and day out."
                     </p>
                     <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors inline-flex items-center gap-2">
                         Download Study Plan PDF <ArrowRight size={14} />
                     </button>
                 </div>
             </div>
        </div>
      </div>
      
    </div>
  );
};