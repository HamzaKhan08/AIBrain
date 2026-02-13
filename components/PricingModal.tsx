import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, Lock, Loader2, Sparkles, Smartphone, QrCode, ArrowRight, Mail, AlertCircle } from 'lucide-react';
import { PlanType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { paymentService } from '../services/paymentService';
import { emailService } from '../services/emailService';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentMethod = 'card' | 'upi' | 'qr';

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { user, upgradePlan } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [txnId, setTxnId] = useState('');

  // Payment Form State
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [upiId, setUpiId] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
        setStep('select');
        setLoading(false);
        setError(null);
        setPaymentMethod('card');
        setCardNum('');
        setExpiry('');
        setCvc('');
        setUpiId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Process Payment via Payment Service
      const amount = selectedPlan === 'pro' ? 9 : 49;
      
      const result = await paymentService.processPayment({
          method: paymentMethod,
          amount,
          cardNumber: cardNum,
          expiry,
          cvc,
          upiId: paymentMethod === 'upi' ? upiId : undefined
      });

      setTxnId(result.transactionId);

      // 2. Upgrade User Plan (Database/Auth update)
      await upgradePlan(selectedPlan);

      // 3. Send Confirmation Email
      if (user) {
          await emailService.sendUpgradeConfirmation(user, selectedPlan, result.transactionId);
      }

      setStep('success');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentContent = () => {
    switch (paymentMethod) {
        case 'card':
            return (
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleUpgrade(); }}>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Card Number</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="0000 0000 0000 0000"
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={cardNum}
                                onChange={(e) => {
                                    let v = e.target.value.replace(/\D/g, '').substring(0, 16);
                                    v = v.match(/.{1,4}/g)?.join(' ') || v;
                                    setCardNum(v);
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Expiry Date</label>
                            <input 
                                type="text" 
                                placeholder="MM/YY"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                maxLength={5}
                                value={expiry}
                                onChange={e => {
                                     let v = e.target.value.replace(/\D/g, '');
                                     if(v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
                                     setExpiry(v);
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">CVC</label>
                            <input 
                                type="text" 
                                placeholder="123"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                maxLength={3}
                                value={cvc}
                                onChange={e => setCvc(e.target.value.replace(/\D/g, ''))}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Lock size={18} /> Pay {selectedPlan === 'pro' ? '$9.00' : '$49.00'}</>}
                    </button>
                </form>
            );
        case 'upi':
            return (
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleUpgrade(); }}>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">UPI ID / VPA</label>
                        <div className="relative">
                            <Smartphone className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="username@upi"
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                required
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Compatible with GPay, PhonePe, Paytm, BHIM</p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                         {loading ? <Loader2 className="animate-spin" size={20} /> : <>Verify & Pay {selectedPlan === 'pro' ? '$9.00' : '$49.00'} <ArrowRight size={18} /></>}
                    </button>
                </form>
            );
        case 'qr':
            return (
                <div className="text-center space-y-6">
                    <div className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-300 inline-block relative group">
                        {/* Placeholder QR Code */}
                        <div className="w-48 h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                             <QrCode size={120} className="text-slate-800" />
                             {loading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-blue-600" size={40} />
                                </div>
                             )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full">
                            UPI / GPay
                        </div>
                    </div>
                    
                    <div>
                        <p className="font-semibold text-slate-800">Scan to Pay {selectedPlan === 'pro' ? '$9.00' : '$49.00'}</p>
                        <p className="text-sm text-slate-500 mt-1">Open any UPI app to scan and pay</p>
                    </div>

                    <button 
                        onClick={handleUpgrade} 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                         {loading ? <Loader2 className="animate-spin" size={20} /> : "I've Completed Payment"}
                    </button>
                </div>
            );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            {step === 'select' ? 'Choose Your Plan' : step === 'payment' ? 'Secure Payment' : 'Upgrade Successful'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-8">
          
          {/* Step 1: Plan Selection */}
          {step === 'select' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <div className={`border rounded-xl p-6 relative ${user?.plan === 'free' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'}`}>
                <h3 className="text-xl font-bold text-slate-800">Starter</h3>
                <div className="mt-2 mb-6">
                  <span className="text-3xl font-bold text-slate-900">$0</span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-green-500" /> 5 Analysis / month</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-green-500" /> Basic Predictions</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-green-500" /> Community Support</li>
                </ul>
                <button disabled className="w-full py-2.5 rounded-lg bg-slate-200 text-slate-500 font-medium text-sm">
                  {user?.plan === 'free' ? 'Current Plan' : 'Downgrade'}
                </button>
              </div>

              {/* Pro Plan */}
              <div 
                className={`border-2 rounded-xl p-6 relative transform transition-all cursor-pointer ${selectedPlan === 'pro' ? 'border-blue-600 shadow-xl scale-105 z-10' : 'border-slate-200 hover:border-blue-300'}`}
                onClick={() => setSelectedPlan('pro')}
              >
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
                <h3 className="text-xl font-bold text-slate-800">Pro Student</h3>
                <div className="mt-2 mb-6">
                  <span className="text-3xl font-bold text-slate-900">$9</span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-green-500" /> Unlimited Analysis</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-green-500" /> Gemini 3.0 Pro Reasoning</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-green-500" /> Detailed Solutions</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-green-500" /> Priority Support</li>
                </ul>
                {user?.plan === 'pro' ? (
                   <button disabled className="w-full py-2.5 rounded-lg bg-green-100 text-green-700 font-medium text-sm flex items-center justify-center gap-2">
                     <Check size={16} /> Current Plan
                   </button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setSelectedPlan('pro'); setStep('payment'); }} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm">
                    Upgrade to Pro
                  </button>
                )}
              </div>

              {/* Enterprise Plan */}
              <div 
                className={`border rounded-xl p-6 relative cursor-pointer ${selectedPlan === 'enterprise' ? 'border-purple-500 bg-purple-50/30' : 'border-slate-200 hover:border-purple-300'}`}
                onClick={() => setSelectedPlan('enterprise')}
              >
                <h3 className="text-xl font-bold text-slate-800">Institution</h3>
                <div className="mt-2 mb-6">
                  <span className="text-3xl font-bold text-slate-900">$49</span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-green-500" /> Everything in Pro</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-green-500" /> Multiple User Seats</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-green-500" /> Custom Integrations</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><Check size={16} className="text-green-500" /> Dedicated Account Manager</li>
                </ul>
                {user?.plan === 'enterprise' ? (
                   <button disabled className="w-full py-2.5 rounded-lg bg-green-100 text-green-700 font-medium text-sm flex items-center justify-center gap-2">
                     <Check size={16} /> Current Plan
                   </button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setSelectedPlan('enterprise'); setStep('payment'); }} className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm">
                    Contact Sales
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Payment Mockup */}
          {step === 'payment' && (
            <div className="max-w-md mx-auto">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <Sparkles className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-semibold text-blue-800 text-sm">Upgrading to {selectedPlan === 'pro' ? 'Pro' : 'Institution'} Plan</h4>
                        <p className="text-xs text-blue-600 mt-1">Total due today: <strong>{selectedPlan === 'pro' ? '$9.00' : '$49.00'}</strong></p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2 animate-fade-in">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Payment Methods Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button 
                        onClick={() => { setPaymentMethod('card'); setError(null); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <CreditCard size={16} /> Card
                    </button>
                    <button 
                        onClick={() => { setPaymentMethod('upi'); setError(null); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${paymentMethod === 'upi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Smartphone size={16} /> UPI
                    </button>
                    <button 
                        onClick={() => { setPaymentMethod('qr'); setError(null); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${paymentMethod === 'qr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <QrCode size={16} /> Scan QR
                    </button>
                </div>

                {/* Payment Content */}
                <div className="min-h-[300px]">
                    {renderPaymentContent()}
                </div>

                <div className="mt-6 flex flex-col items-center gap-3">
                    <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                        <Lock size={10} /> 256-bit SSL Encrypted Payment
                    </p>
                    <button onClick={() => setStep('select')} className="text-sm text-slate-500 hover:text-slate-800 underline">
                        Back to Plans
                    </button>
                </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Upgrade Successful!</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                    Your account has been upgraded to the <strong>{selectedPlan === 'pro' ? 'Pro' : 'Institution'}</strong> plan.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-sm mx-auto mb-8 text-left space-y-2">
                    <div className="flex items-center gap-3 text-slate-700">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <Mail size={16} />
                        </div>
                        <div>
                             <p className="text-sm font-semibold">Confirmation Email Sent</p>
                             <p className="text-xs text-slate-500">Receipt sent to {user?.email}</p>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 my-2"></div>
                    <p className="text-xs text-slate-400 font-mono">Txn ID: {txnId}</p>
                </div>

                <button 
                    onClick={onClose}
                    className="bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};