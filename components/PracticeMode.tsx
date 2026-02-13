import React, { useState, useRef, useEffect } from 'react';
import { Play, Trash2, Terminal, Code2, RefreshCw, Copy, Check, Loader2 } from 'lucide-react';
import { evaluateCode } from '../services/geminiService';

const LANGUAGES = [
  { id: 'python', name: 'Python 3', defaultCode: 'def solve():\n    print("Hello from ProphetAI!")\n    # Write your code here\n    \nsolve()' },
  { id: 'javascript', name: 'JavaScript (Node)', defaultCode: 'function solve() {\n    console.log("Hello from ProphetAI!");\n    // Write your code here\n}\n\nsolve();' },
  { id: 'cpp', name: 'C++', defaultCode: '#include <iostream>\n\nint main() {\n    std::cout << "Hello from ProphetAI!" << std::endl;\n    return 0;\n}' },
  { id: 'java', name: 'Java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from ProphetAI!");\n    }\n}' },
];

export const PracticeMode: React.FC = () => {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = LANGUAGES.find(l => l.id === e.target.value) || LANGUAGES[0];
    setLanguage(selected);
    setCode(selected.defaultCode);
    setOutput('');
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Running...');
    try {
        const result = await evaluateCode(code, language.name);
        setOutput(result);
    } catch (error) {
        setOutput('Error executing code.');
    } finally {
        setIsRunning(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setOutput('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(language.defaultCode);
    setOutput('');
  };

  // Handle Tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      
      const newValue = code.substring(0, start) + "    " + code.substring(end);
      setCode(newValue);
      
      // Need to set selection after render, using timeout is a simple trick
      setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-fade-in flex flex-col h-full sm:h-[calc(100vh-140px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Code2 className="text-blue-600" /> Practice Playground
            </h2>
            <p className="text-slate-500 text-sm hidden sm:block">Write, test, and debug your code snippets.</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-2 sm:gap-3">
             <select 
                value={language.id}
                onChange={handleLanguageChange}
                className="flex-1 sm:flex-none bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
            >
                {LANGUAGES.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                ))}
            </select>
            
            <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
            >
                {isRunning ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                <span className="hidden sm:inline">Run Code</span>
                <span className="sm:hidden">Run</span>
            </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-h-[500px] sm:min-h-0">
        {/* Editor Section */}
        <div className="flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700 h-[300px] sm:h-auto">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-slate-400 text-xs font-mono">main.{language.id === 'python' ? 'py' : language.id === 'cpp' ? 'cpp' : language.id === 'java' ? 'java' : 'js'}</span>
                <div className="flex gap-2">
                    <button onClick={handleReset} title="Reset Code" className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors">
                        <RefreshCw size={14} />
                    </button>
                    <button onClick={handleCopy} title="Copy Code" className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors">
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                    <button onClick={handleClear} title="Clear" className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-700 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
            
            <div className="flex-1 relative font-mono text-sm">
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full bg-[#1e293b] text-slate-300 p-4 outline-none resize-none leading-relaxed"
                    spellCheck={false}
                    placeholder="// Start coding here..."
                />
            </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col bg-[#0f172a] rounded-xl overflow-hidden shadow-lg border border-slate-800 h-[200px] sm:h-auto">
            <div className="flex items-center px-4 py-2 bg-slate-900 border-b border-slate-800">
                <Terminal size={16} className="text-slate-400 mr-2" />
                <span className="text-slate-400 text-xs font-mono">Terminal Output</span>
            </div>
            
            <div className="flex-1 p-4 font-mono text-sm overflow-auto text-slate-300">
                {output ? (
                    <pre className="whitespace-pre-wrap">{output}</pre>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <Play size={32} className="mb-2 opacity-50" />
                        <p>Click "Run Code" to see output</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
