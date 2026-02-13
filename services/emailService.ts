
import emailjs from '@emailjs/browser';
import { User, PlanType } from '../types';

// CONFIGURATION: Replace these with your actual EmailJS credentials
// 1. Create account at https://www.emailjs.com/
// 2. Add Email Service (e.g., Gmail)
// 3. Create Email Template with variables {{to_email}}, {{otp_code}}, {{name}}
const SERVICE_ID = 'service_prophet_ai'; 
const TEMPLATE_ID_OTP = 'template_otp_auth'; 
const TEMPLATE_ID_UPGRADE = 'template_upgrade_conf'; 
const PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY'; // e.g. 'user_...'

export const emailService = {
  
  sendOTP: async (email: string, code: string): Promise<boolean> => {
    // Check if configured (Prevents crashing in demo mode)
    if (PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
        console.warn('⚠️ EmailJS not configured. Falling back to console simulation.');
        console.group('📧 [SIMULATION] Security Verification Email');
        console.log(`To: ${email}`);
        console.log(`Code: ${code}`);
        console.log('Action: Configure services/emailService.ts with real EmailJS keys to send actual emails.');
        console.groupEnd();
        return true;
    }

    try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID_OTP, {
            to_email: email,
            otp_code: code,
            company_name: "AIBrain"
        }, { publicKey: PUBLIC_KEY });
        return true;
    } catch (error) {
        console.error("EmailJS Error:", error);
        throw new Error("Failed to send verification code via email. Please try again.");
    }
  },

  sendUpgradeConfirmation: async (user: User, plan: PlanType, transactionId: string): Promise<boolean> => {
    const amount = plan === 'pro' ? '$9.00' : '$49.00';

    if (PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
        console.log(`[EmailService] Simulation: Sent upgrade email to ${user.email}`);
        return true;
    }

    try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID_UPGRADE, {
            to_email: user.email,
            to_name: user.name,
            plan_name: plan.toUpperCase(),
            transaction_id: transactionId,
            amount: amount,
            date: new Date().toLocaleString()
        }, { publicKey: PUBLIC_KEY });
        return true;
    } catch (error) {
        console.error("EmailJS Error:", error);
        return false;
    }
  }
};
