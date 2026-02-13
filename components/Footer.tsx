import React from 'react';
import { APP_NAME } from '../constants';
import { Brain, Heart, Shield, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white">
                <Brain size={16} />
              </div>
              <span className="font-bold text-lg text-slate-800">{APP_NAME}</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Empowering students with AI-driven insights for smarter exam preparation.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Success Stories</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} {APP_NAME} Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 hover:text-slate-600 cursor-pointer"><Shield size={14} /> Secure</span>
            <span className="flex items-center gap-1 hover:text-slate-600 cursor-pointer"><Mail size={14} /> Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
};