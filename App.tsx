
import React, { useState } from 'react';
import { UploadedFile, AnalysisResult, AnalysisStatus } from './types';
import { APP_NAME, NAV_ITEMS } from './constants';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { PredictionList } from './components/PredictionList';
import { analyzeDocuments } from './services/geminiService';
import { historyService } from './services/historyService';
import { Brain, Sparkles, Loader2, LogOut, LayoutGrid, Shield } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { ProfilePage } from './components/ProfilePage';
import { PracticeMode } from './components/PracticeMode';
import { HistoryPage } from './components/HistoryPage';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';

const MainApp: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setStatus('analyzing');
    try {
      const data = await analyzeDocuments(files);
      setResult(data);
      setStatus('complete');
      setActiveTab('dashboard');
      
      if (user) {
        historyService.saveAnalysis(user.id, data, files.length);
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const handleLoadHistory = (historyResult: AnalysisResult) => {
    setResult(historyResult);
    setStatus('complete');
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    if (status === 'analyzing') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 px-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
            <div className="bg-white p-4 rounded-full shadow-lg relative z-10">
                <Loader2 size={48} className="text-blue-600 animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">Analyzing Exam Patterns...</h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto">Extracting questions, identifying trends, and calculating probabilities.</p>
            <p className="text-xs text-slate-400 mt-4">Powered by Gemini 3 Flash</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'upload':
        return (
          <div className="flex flex-col items-center space-y-8 py-4 sm:py-10">
            <div className="text-center max-w-2xl px-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Predict Your Next Exam</h1>
                <p className="text-base sm:text-lg text-slate-600">
                    Upload previous year question papers. AI will analyze trends, finding missing patterns and predicting likely questions for this year.
                </p>
            </div>
            
            <div className="w-full px-4">
                <FileUpload files={files} setFiles={setFiles} />
            </div>
            
            <button
              onClick={handleAnalyze}
              disabled={files.length === 0}
              className={`
                group relative px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 shadow-xl mx-4
                ${files.length > 0 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 hover:shadow-2xl' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
              `}
            >
              <span className="flex items-center gap-2">
                Start Analysis <Sparkles size={20} className={files.length > 0 ? "animate-pulse" : ""} />
              </span>
            </button>
            
            {status === 'error' && (
                <div className="mx-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
                    Analysis failed. Please check your API key or file format and try again.
                </div>
            )}
          </div>
        );
      case 'dashboard':
        return result ? <Dashboard data={result} /> : null;
      case 'predictions':
        return result ? <PredictionList predictions={result.predictions} /> : null;
      case 'practice':
        return <PracticeMode />;
      case 'history':
        return <HistoryPage onLoadAnalysis={handleLoadHistory} />;
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return isAdmin ? <AdminDashboard /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      default:
        return (
            <div className="text-center py-20">
                <LayoutGrid size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-400">Module Coming Soon</h3>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 fixed top-0 w-full z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
            <Brain className="text-white" size={18} />
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">{APP_NAME}</span>
        </div>
        
        <button 
            onClick={() => setActiveTab('profile')}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border border-white shadow-sm flex items-center justify-center text-white font-medium text-sm"
        >
            {user?.name.charAt(0).toUpperCase()}
        </button>
      </header>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex w-20 lg:w-64 bg-white border-r border-slate-200 flex-col fixed h-full z-20">
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Brain className="text-white" size={24} />
          </div>
          <span className="hidden lg:block ml-3 font-bold text-xl text-slate-800 tracking-tight">{APP_NAME}</span>
        </div>

        <nav className="flex-1 py-8 flex flex-col gap-2 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const isDisabled = (!result && (item.id === 'dashboard' || item.id === 'predictions'));
            
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && setActiveTab(item.id)}
                disabled={isDisabled}
                className={`
                  flex items-center p-3 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : isDisabled 
                        ? 'opacity-50 cursor-not-allowed text-slate-400' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
                title={item.label}
              >
                <item.icon size={22} className={`lg:mr-3 ${isActive ? 'text-blue-600' : ''}`} />
                <span className="hidden lg:block">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 hidden lg:block" />}
              </button>
            );
          })}

          {isAdmin && (
            <button
                onClick={() => setActiveTab('admin')}
                className={`
                  flex items-center p-3 rounded-lg transition-all duration-200 group
                  ${activeTab === 'admin' 
                    ? 'bg-indigo-50 text-indigo-700 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <Shield size={22} className={`lg:mr-3 ${activeTab === 'admin' ? 'text-indigo-600' : ''}`} />
                <span className="hidden lg:block">Admin Panel</span>
                {activeTab === 'admin' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 hidden lg:block" />}
              </button>
          )}

        </nav>

        <div className="p-4 border-t border-slate-100 hidden lg:block">
            <button 
                onClick={logout}
                className="flex items-center gap-3 w-full p-2 mb-4 text-slate-600 hover:text-red-600 transition-colors"
            >
                <LogOut size={18} />
                <span className="text-sm font-medium">Sign Out</span>
            </button>

            {user?.plan === 'free' && (
                <div 
                    onClick={() => setActiveTab('profile')}
                    className="bg-slate-900 rounded-xl p-4 text-white relative overflow-hidden cursor-pointer hover:bg-slate-800 transition-colors"
                >
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-500 rounded-full opacity-20 blur-xl"></div>
                    <h4 className="font-semibold text-sm mb-1">Upgrade to Pro</h4>
                    <p className="text-xs text-slate-400 mb-3">Get access to Gemini 3.0.</p>
                    <span className="text-xs font-medium text-blue-300">View Plans &rarr;</span>
                </div>
            )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center h-16 px-2 z-30 pb-safe shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
         {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const isDisabled = (!result && (item.id === 'dashboard' || item.id === 'predictions'));
            
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && setActiveTab(item.id)}
                disabled={isDisabled}
                className={`
                  flex flex-col items-center justify-center w-full h-full p-1
                  ${isActive ? 'text-blue-600' : isDisabled ? 'text-slate-300' : 'text-slate-500'}
                `}
              >
                <item.icon size={24} className={isActive ? 'mb-1' : ''} />
                {isActive && <span className="text-[10px] font-medium">{item.label}</span>}
              </button>
            );
          })}
          {isAdmin && (
             <button
                onClick={() => setActiveTab('admin')}
                className={`
                  flex flex-col items-center justify-center w-full h-full p-1
                  ${activeTab === 'admin' ? 'text-indigo-600' : 'text-slate-500'}
                `}
              >
                <Shield size={24} className={activeTab === 'admin' ? 'mb-1' : ''} />
                {activeTab === 'admin' && <span className="text-[10px] font-medium">Admin</span>}
              </button>
          )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full md:ml-20 lg:ml-64 mt-16 md:mt-0 mb-16 md:mb-0 transition-all duration-300 flex flex-col min-h-screen">
        <div className="p-4 sm:p-6 lg:p-10 flex-1">
            <header className="hidden md:flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {activeTab === 'profile' ? 'User Profile' : activeTab === 'admin' ? 'Administration' : NAV_ITEMS.find(n => n.id === activeTab)?.label}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {activeTab === 'profile' ? 'Manage your account details' : activeTab === 'admin' ? 'Platform management' : activeTab === 'upload' ? 'Prepare your data for analysis' : 'AI-driven insights'}
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    {result && status === 'complete' && activeTab !== 'upload' && activeTab !== 'profile' && activeTab !== 'practice' && activeTab !== 'admin' && (
                        <button 
                            onClick={() => { setFiles([]); setResult(null); setStatus('idle'); setActiveTab('upload'); }}
                            className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors"
                        >
                            Start New Analysis
                        </button>
                    )}
                    
                    <div 
                        onClick={() => setActiveTab('profile')}
                        className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group"
                    >
                        <div className="text-right hidden lg:block">
                            <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{user?.name}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">{user?.plan}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white shadow-sm flex items-center justify-center text-white font-medium text-lg group-hover:scale-105 transition-transform relative">
                            {user?.name.charAt(0).toUpperCase()}
                            {user?.role === 'admin' && (
                                <div className="absolute -bottom-1 -right-1 bg-indigo-500 border border-white w-4 h-4 rounded-full flex items-center justify-center" title="Admin">
                                    <Shield size={10} className="text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto h-full">
                {renderContent()}
            </div>
        </div>
        
        <Footer />
      </main>
    </div>
  );
};

// Root Component handling Auth Logic
const App: React.FC = () => {
    return (
        <AuthProvider>
            <AuthWrapper />
        </AuthProvider>
    );
};

const AuthWrapper: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
                <Loader2 className="text-blue-600 animate-spin" size={40} />
            </div>
        );
    }

    return isAuthenticated ? <MainApp /> : <AuthPage />;
};

export default App;
