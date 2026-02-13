
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Brain, ArrowRight, Lock, Mail, User, Loader2, Eye, EyeOff, Shield, AlertTriangle, Send } from 'lucide-react';
import { APP_NAME } from '../constants';
import { UserRole } from '../types';

export const AuthPage: React.FC = () => {
  const { login, register, sendVerificationOTP } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('user');
  
  // Verification State (Used for BOTH Students and Admins now)
  const [verificationStep, setVerificationStep] = useState<'details' | 'otp'>('details');
  const [otpCode, setOtpCode] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const resetForm = () => {
      setFormData({ name: '', email: '', password: '' });
      setError('');
      setVerificationStep('details');
      setOtpCode('');
  };

  const handleRoleSwitch = (newRole: UserRole) => {
      setRole(newRole);
      resetForm();
  };

  const handleModeSwitch = () => {
      setIsLogin(!isLogin);
      resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login Flow (Strict Role Check happens in service)
        await login(formData.email, formData.password, role);
      } else {
        // Registration Flow (Step 1 or Step 2)
        
        if (verificationStep === 'details') {
            // STEP 1: Validate & Send OTP
            if (!formData.email || !formData.password || !formData.name) {
                throw new Error('Please fill in all details.');
            }
            
            // Send OTP (Backend checks if email is allowed for Admin role)
            await sendVerificationOTP(formData.email, role);
            setVerificationStep('otp');
        } else {
            // STEP 2: Verify OTP & Register
            if (otpCode.length !== 6) {
                throw new Error('Please enter a valid 6-digit code.');
            }
            await register(formData.name, formData.email, formData.password, role, otpCode);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all duration-300 my-auto">
          {/* Header */}
          <div className={`p-6 sm:p-8 text-center text-white transition-colors duration-300 ${role === 'admin' ? 'bg-gradient-to-r from-indigo-800 to-slate-900' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
            <div className="mx-auto w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-lg">
              {role === 'admin' ? <Shield size={28} /> : <Brain size={28} />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{APP_NAME}</h1>
            <p className="text-blue-100 text-sm mt-2 font-medium">
              {role === 'admin' ? 'Administrative Access Console' : 'AI-Powered Exam Preparation'}
            </p>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 text-center sm:text-left">
              {isLogin ? 'Secure Login' : 'Create Account'}
            </h2>

            {/* Role Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                <button
                    type="button"
                    onClick={() => handleRoleSwitch('user')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${role === 'user' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Student Portal
                </button>
                <button
                    type="button"
                    onClick={() => handleRoleSwitch('admin')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${role === 'admin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Admin Console
                </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {!isLogin && verificationStep === 'otp' ? (
                // Step 2: OTP Verification (Both Roles)
                <div className="space-y-6 animate-fade-in">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Mail size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Verify Email Address</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            We sent a secure code to <strong>{formData.email}</strong>. 
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">Enter 6-Digit Code</label>
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            className="w-full text-center text-2xl tracking-widest py-3 rounded-xl border border-blue-200 bg-blue-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-blue-200 font-mono"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || otpCode.length !== 6}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <>Complete Registration <Shield size={18} /></>}
                    </button>
                    
                    <button 
                        onClick={() => setVerificationStep('details')}
                        className="w-full text-slate-400 text-sm hover:text-slate-600"
                    >
                        Back to details
                    </button>
                </div>
            ) : (
                // Step 1: Details Form (Login or Signup Start)
                <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                    <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                        <User className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                        type="text"
                        required
                        placeholder={role === 'admin' ? 'Admin Name' : 'John Doe'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative group">
                    <Mail className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    </div>
                    {role === 'admin' && !isLogin && (
                        <p className="text-[10px] text-indigo-600 mt-1 font-medium pl-1">
                            * Must use an authorized organization email (e.g. contains "admin" or "@prophetai.com")
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative group">
                    <Lock className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    </div>
                </div>

                {!isLogin && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2 text-xs text-blue-800">
                        <Shield size={14} className="mt-0.5 flex-shrink-0" />
                        <p>For your security, you must verify your email address via OTP in the next step.</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all mt-8 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${
                        role === 'admin' 
                            ? 'bg-gradient-to-r from-indigo-700 to-slate-800 hover:from-indigo-800 hover:to-slate-900 shadow-indigo-500/30' 
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30'
                    }`}
                >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : (
                    <>
                        {isLogin 
                            ? (role === 'admin' ? 'Access Console' : 'Sign In') 
                            : 'Verify Email & Create Account'
                        } 
                        {role === 'admin' && !isLogin ? <Send size={18} /> : <ArrowRight size={18} strokeWidth={2.5} />}
                    </>
                    )}
                </button>
                </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  onClick={handleModeSwitch}
                  className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer / Credits */}
      <div className="w-full p-4 text-center text-slate-400 text-xs bg-slate-50">
        &copy; {new Date().getFullYear()} {APP_NAME} Inc. Secure Access.
      </div>
    </div>
  );
};
