
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Mail, Save, AlertCircle, CheckCircle, CreditCard, Trash2, ShieldAlert, Cpu, Server, Settings, Key, Activity, Zap, HelpCircle, Terminal, ExternalLink, Clock } from 'lucide-react';
import { PricingModal } from './PricingModal';
import { getAISettings, saveAISettings } from '../services/geminiService';
import { AISettings, AIProvider } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword, requestAccountDeletion, updateUserAIPreference } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [aiSettingsStatus, setAiSettingsStatus] = useState<'idle' | 'success'>('idle');
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [aiError, setAiError] = useState('');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLocalGuide, setShowLocalGuide] = useState(false);

  // AI Settings State
  const [aiSettings, setAiSettings] = useState<AISettings>({
      provider: 'gemini',
      localEndpoint: '',
      localModel: '',
      apiKey: ''
  });

  useEffect(() => {
    if (user) {
        setName(user.name);
        setEmail(user.email);
    }
    setAiSettings(getAISettings());
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus('loading');
    setErrorMessage('');
    try {
        await updateProfile(name, email);
        setProfileStatus('success');
        setTimeout(() => setProfileStatus('idle'), 3000);
    } catch (err: any) {
        setProfileStatus('error');
        setErrorMessage(err.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
        setPasswordStatus('error');
        setErrorMessage('New passwords do not match');
        return;
    }
    if (newPass.length < 6) {
        setPasswordStatus('error');
        setErrorMessage('Password must be at least 6 characters');
        return;
    }
    
    setPasswordStatus('loading');
    setErrorMessage('');
    try {
        await changePassword(currentPass, newPass);
        setPasswordStatus('success');
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        setTimeout(() => setPasswordStatus('idle'), 3000);
    } catch (err: any) {
        setPasswordStatus('error');
        setErrorMessage(err.message || 'Failed to change password');
    }
  };

  const handleSaveAISettings = async (e: React.FormEvent) => {
      e.preventDefault();
      saveAISettings(aiSettings);
      
      // Sync with user profile for admin visibility
      await updateUserAIPreference(aiSettings.provider);

      setAiSettingsStatus('success');
      setTimeout(() => setAiSettingsStatus('idle'), 3000);
  };

  const handleTestConnection = async () => {
      setTestConnectionStatus('testing');
      setAiError('');
      
      // Basic URL validation
      if (!aiSettings.localEndpoint.startsWith('http')) {
          setTestConnectionStatus('error');
          setAiError('Endpoint must start with http:// or https://');
          return;
      }

      try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (aiSettings.apiKey) {
              headers['Authorization'] = `Bearer ${aiSettings.apiKey}`;
          }

          const response = await fetch(aiSettings.localEndpoint, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                  model: aiSettings.localModel || 'llama3',
                  messages: [{ role: "user", content: "Are you online? Reply with 'Yes'." }],
                  max_tokens: 10,
                  stream: false
              })
          });
          
          if (response.ok) {
              const data = await response.json();
              if (data?.choices?.[0]?.message?.content) {
                  setTestConnectionStatus('success');
                  setTimeout(() => setTestConnectionStatus('idle'), 3000);
              } else {
                  setTestConnectionStatus('error');
                  setAiError('Connected, but received unexpected response format.');
              }
          } else {
              setTestConnectionStatus('error');
              setAiError(`Server Error: ${response.status}`);
          }
      } catch (error: any) {
          console.error(error);
          setTestConnectionStatus('error');
          setAiError(error.message || 'Failed to connect.');
      }
  };

  const handleDeleteRequest = async () => {
    setDeleteStatus('loading');
    try {
        await requestAccountDeletion();
        setDeleteStatus('success');
        setShowDeleteConfirm(false);
    } catch (error) {
        console.error(error);
        setDeleteStatus('idle');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      <h1 className="text-3xl font-bold text-slate-800">Account & AI Settings</h1>

      {/* Subscription Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-lg p-6 text-white overflow-hidden relative">
         <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500 rounded-full opacity-20 blur-xl"></div>
         
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                    <CreditCard size={20} className="text-blue-400" /> Current Plan: <span className="uppercase text-blue-400 tracking-wider">{user?.plan}</span>
                </h2>
                <p className="text-slate-400 text-sm">
                    {user?.plan === 'free' 
                        ? 'Upgrade to Pro for unlimited predictions and detailed solutions.' 
                        : 'You are enjoying full access to premium features.'}
                </p>
            </div>
            <button 
                onClick={() => setShowPricingModal(true)}
                className="bg-white text-slate-900 px-6 py-2.5 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-md"
            >
                {user?.plan === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Profile Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <User className="text-blue-600" size={20} /> Personal Information
            </h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>
                </div>
                
                <button
                    type="submit"
                    disabled={profileStatus === 'loading'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {profileStatus === 'loading' ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                </button>

                {profileStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                        <CheckCircle size={16} /> Profile updated successfully!
                    </div>
                )}
            </form>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Lock className="text-blue-600" size={20} /> Security
            </h2>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                    <input
                        type="password"
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <input
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                        required
                        minLength={6}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                    <input
                        type="password"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                        required
                        minLength={6}
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={passwordStatus === 'loading'}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {passwordStatus === 'loading' ? 'Updating...' : 'Update Password'}
                </button>

                {passwordStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                        <CheckCircle size={16} /> Password changed successfully!
                    </div>
                )}
                {passwordStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                        <AlertCircle size={16} /> {errorMessage}
                    </div>
                )}
            </form>
        </div>
      </div>

      {/* AI Configuration Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Cpu className="text-purple-600" size={20} /> AI Model Configuration
        </h2>
        <div className="bg-purple-50 p-4 rounded-lg mb-6 text-sm text-purple-800 border border-purple-100 flex items-start gap-3">
             <Zap className="flex-shrink-0 mt-0.5" size={18} />
             <p><strong>Power User Feature:</strong> Switch between Google's Gemini Cloud (Default) or your own Local LLM (e.g., Llama 3 via Ollama) for privacy and offline analysis.</p>
        </div>

        <form onSubmit={handleSaveAISettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                    onClick={() => setAiSettings({ ...aiSettings, provider: 'gemini' })}
                    className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-3 transition-all ${aiSettings.provider === 'gemini' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}
                >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${aiSettings.provider === 'gemini' ? 'border-purple-600' : 'border-slate-400'}`}>
                        {aiSettings.provider === 'gemini' && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Gemini Cloud</h3>
                        <p className="text-xs text-slate-500">Fast, High Accuracy, requires Internet.</p>
                    </div>
                </div>

                <div 
                    onClick={() => setAiSettings({ ...aiSettings, provider: 'local' })}
                    className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-3 transition-all ${aiSettings.provider === 'local' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}
                >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${aiSettings.provider === 'local' ? 'border-purple-600' : 'border-slate-400'}`}>
                        {aiSettings.provider === 'local' && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Local LLM</h3>
                        <p className="text-xs text-slate-500">Private, Custom Models (Ollama/LM Studio).</p>
                    </div>
                </div>
            </div>

            {aiSettings.provider === 'gemini' && (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <Key size={14} /> Gemini API Key
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="AIzaSy..."
                                value={aiSettings.apiKey || ''}
                                onChange={(e) => setAiSettings({...aiSettings, apiKey: e.target.value})}
                                className="w-full pl-4 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-100 focus:border-purple-500 font-mono text-sm"
                            />
                        </div>
                         <p className="text-xs text-slate-500 mt-1">
                            Leave empty to use the system default key (if configured). 
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline ml-1">Get an API key</a>
                        </p>
                    </div>
                </div>
            )}

            {aiSettings.provider === 'local' && (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in">
                    {/* Setup Guide Accordion */}
                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowLocalGuide(!showLocalGuide)}
                            className="w-full flex items-center justify-between p-4 bg-slate-100 hover:bg-slate-200 transition-colors text-left"
                        >
                            <span className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                                <HelpCircle size={16} className="text-blue-600" />
                                How to set up Local LLM (Ollama)
                            </span>
                            <span className="text-blue-600 text-xs font-medium">{showLocalGuide ? 'Hide Guide' : 'Show Guide'}</span>
                        </button>

                        {showLocalGuide && (
                            <div className="p-4 space-y-4 text-sm text-slate-600 border-t border-slate-200">
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-1">Step 1: Install Ollama</h4>
                                    <p className="mb-2">Download and install Ollama from the official website.</p>
                                    <a href="https://ollama.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium">
                                        Visit ollama.com <ExternalLink size={10} />
                                    </a>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-800 mb-1">Step 2: Pull a Model</h4>
                                    <p className="mb-2">Open your terminal and run the following command to download a model (e.g., Llama 3):</p>
                                    <div className="bg-slate-900 text-green-400 p-2 rounded-md font-mono text-xs flex items-center gap-2">
                                        <Terminal size={12} /> ollama pull llama3
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-800 mb-1 text-red-600 flex items-center gap-1"><AlertCircle size={12} /> Step 3: Enable CORS (Crucial)</h4>
                                    <p className="mb-2">By default, Ollama blocks web browser requests. You must enable CORS by setting the <code>OLLAMA_ORIGINS</code> environment variable.</p>
                                    
                                    <p className="text-xs font-semibold mt-2 mb-1">Mac / Linux:</p>
                                    <div className="bg-slate-900 text-slate-300 p-2 rounded-md font-mono text-xs overflow-x-auto whitespace-nowrap">
                                        OLLAMA_ORIGINS="*" ollama serve
                                    </div>

                                    <p className="text-xs font-semibold mt-2 mb-1">Windows (PowerShell):</p>
                                    <div className="bg-slate-900 text-slate-300 p-2 rounded-md font-mono text-xs overflow-x-auto whitespace-nowrap">
                                        $env:OLLAMA_ORIGINS="*"; ollama serve
                                    </div>
                                </div>
                                
                                <div className="bg-blue-50 p-3 rounded text-blue-800 text-xs">
                                    <strong>Note:</strong> You must restart Ollama after setting environment variables for changes to take effect.
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <Server size={14} /> Local Endpoint URL
                        </label>
                        <input
                            type="text"
                            placeholder="http://localhost:11434/v1/chat/completions"
                            value={aiSettings.localEndpoint}
                            onChange={(e) => setAiSettings({...aiSettings, localEndpoint: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-100 focus:border-purple-500 font-mono text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-1">Default for Ollama is <code>http://localhost:11434/v1/chat/completions</code></p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <Settings size={14} /> Model Name
                        </label>
                        <input
                            type="text"
                            placeholder="llama3"
                            value={aiSettings.localModel}
                            onChange={(e) => setAiSettings({...aiSettings, localModel: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-100 focus:border-purple-500 font-mono text-sm"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={testConnectionStatus === 'testing'}
                                className={`text-sm px-4 py-2 rounded border transition-colors flex items-center gap-2 ${
                                    testConnectionStatus === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
                                    testConnectionStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <Activity size={14} /> 
                                {testConnectionStatus === 'testing' ? 'Testing Connection...' : 
                                testConnectionStatus === 'success' ? 'Connection Successful' : 
                                testConnectionStatus === 'error' ? 'Connection Failed' : 'Test Connection'}
                            </button>
                        </div>
                        {testConnectionStatus === 'error' && aiError && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 flex items-start gap-2">
                                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> 
                                <span>{aiError}</span>
                            </div>
                        )}
                        {testConnectionStatus === 'success' && (
                             <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-100 flex items-start gap-2">
                                <CheckCircle size={14} className="mt-0.5 flex-shrink-0" /> 
                                <span>Successfully connected to {aiSettings.localModel || 'Local Model'}.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
                <Save size={18} /> Save AI Configuration
            </button>

            {aiSettingsStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle size={16} /> Configuration saved!
                </div>
            )}
        </form>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-xl p-6 bg-red-50/50">
        <h2 className="text-xl font-semibold text-red-700 mb-2 flex items-center gap-2">
            <ShieldAlert size={20} /> Danger Zone
        </h2>
        
        {user?.deletionRequested || deleteStatus === 'success' ? (
             <div className="bg-white p-4 rounded-lg border border-red-200 flex items-start gap-3">
                 <Clock className="text-red-500 mt-1" size={20} />
                 <div>
                     <h3 className="font-bold text-slate-800">Deletion Requested</h3>
                     <p className="text-sm text-slate-600 mt-1">
                         Your account is pending deletion by an administrator. This process is irreversible once completed. 
                         You will lose access to your data.
                     </p>
                 </div>
             </div>
        ) : (
            <>
                <p className="text-sm text-red-600 mb-6 max-w-2xl">
                    Requesting account deletion is a serious action. An administrator will review your request and permanently remove your data.
                </p>
                
                {!showDeleteConfirm ? (
                    <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-white border border-red-300 text-red-600 font-medium px-5 py-2.5 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={18} /> Request Account Deletion
                    </button>
                ) : (
                    <div className="bg-white p-4 rounded-lg border border-red-200 max-w-md">
                        <p className="font-bold text-slate-800 mb-2">Are you sure?</p>
                        <p className="text-xs text-slate-500 mb-4">This will flag your account for permanent deletion.</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={handleDeleteRequest}
                                disabled={deleteStatus === 'loading'}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm font-bold"
                            >
                                {deleteStatus === 'loading' ? 'Processing...' : 'Yes, Request Deletion'}
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="bg-slate-200 text-slate-700 px-4 py-2 rounded hover:bg-slate-300 transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </>
        )}
      </div>

      {/* Modals */}
      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />
    </div>
  );
};
