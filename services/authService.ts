
import { User, AuthResponse, PlanType, AIProvider, UserRole } from '../types';
import { emailService } from './emailService';

// Key for storing 'database' of users in localStorage for demo purposes
const USERS_DB_KEY = 'aiBrain_users_db';
const HISTORY_DB_KEY = 'aiBrain_history';
const TOKEN_KEY = 'aiBrain_auth_token';
const USER_KEY = 'aiBrain_user_info';
const PENDING_CODES_KEY = 'aiBrain_pending_codes';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  // Login
  login: async (email: string, password: string, role: UserRole): Promise<AuthResponse> => {
    await delay(800); // Simulate API latency

    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const userIndex = users.findIndex((u: any) => u.email === email && u.password === password);

    if (userIndex === -1) {
      throw new Error('Invalid email or password');
    }

    const user = users[userIndex];

    // Security Check: Strict Role Enforcement
    if (user.role !== role) {
        if (role === 'admin') {
            throw new Error('Access Denied: This account is not authorized for the Admin Console.');
        } else {
            throw new Error('This is an administrative account. Please log in via the Admin Portal.');
        }
    }
    
    // Update last active
    const now = new Date().toISOString();
    users[userIndex].lastActive = now;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    // Generate a fake JWT token
    const token = `fake-jwt-token-${user.id}-${Date.now()}`;
    
    const userInfo: User = { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        plan: user.plan || 'free',
        role: user.role || 'user',
        deletionRequested: user.deletionRequested || false,
        aiProvider: user.aiProvider || 'gemini',
        lastActive: now
    };

    // Persist session
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));

    return { user: userInfo, token };
  },

  // 1. Generate and Send OTP
  sendVerificationOTP: async (email: string, role: UserRole): Promise<boolean> => {
    await delay(600);
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    if (users.find((u: any) => u.email === email)) {
        throw new Error('An account with this email already exists.');
    }

    // Security Policy: Admin Domain Check
    if (role === 'admin') {
        const lowerEmail = email.toLowerCase();
        // Updated Policy: Allow local testing with gmail, standard admin emails, and aiBrain.edu
        const isAdminEmail = 
            lowerEmail.includes('admin') || 
            lowerEmail.endsWith('@aiBrain.com') ||
            lowerEmail.endsWith('@aiBrain.edu') ||
            lowerEmail.endsWith('@gmail.com'); // Allowed for testing
            
        if (!isAdminEmail) {
            throw new Error("Unauthorized Email. Admin access is restricted to organization domains (@aiBrain.edu, @aiBrain.com) or authorized test accounts (@gmail.com).");
        }
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in temporary storage
    const pendingCodes = JSON.parse(localStorage.getItem(PENDING_CODES_KEY) || '{}');
    pendingCodes[email] = code;
    localStorage.setItem(PENDING_CODES_KEY, JSON.stringify(pendingCodes));

    // Send via Email Service
    await emailService.sendOTP(email, code);

    return true;
  },

  // Register
  register: async (name: string, email: string, password: string, role: UserRole, verificationCode: string): Promise<AuthResponse> => {
    await delay(800);

    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    
    if (users.find((u: any) => u.email === email)) {
      throw new Error('User already exists');
    }

    // 1. Verify OTP (The "Secret Key" is this dynamic code)
    if (!verificationCode) {
        throw new Error('Verification code is required.');
    }

    const pendingCodes = JSON.parse(localStorage.getItem(PENDING_CODES_KEY) || '{}');
    const validCode = pendingCodes[email];

    if (!validCode || validCode !== verificationCode) {
        throw new Error('Invalid or expired verification code.');
    }

    // Clean up used code
    delete pendingCodes[email];
    localStorage.setItem(PENDING_CODES_KEY, JSON.stringify(pendingCodes));

    const now = new Date().toISOString();
    const newUser = { 
        id: Math.random().toString(36).substr(2, 9), 
        name, 
        email, 
        password,
        plan: role === 'admin' ? 'enterprise' : 'free', // Admins get enterprise features by default
        role, 
        deletionRequested: false,
        aiProvider: 'gemini',
        lastActive: now
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    // Auto login after register
    const token = `fake-jwt-token-${newUser.id}-${Date.now()}`;
    const userInfo: User = { 
        id: newUser.id, 
        name: newUser.name, 
        email: newUser.email,
        plan: newUser.plan as PlanType,
        role: newUser.role as UserRole,
        deletionRequested: false,
        aiProvider: 'gemini',
        lastActive: now
    };

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));

    return { user: userInfo, token };
  },

  // Update Profile
  updateProfile: async (id: string, name: string, email: string): Promise<User> => {
    await delay(600);
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const userIndex = users.findIndex((u: any) => u.id === id);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Update in DB
    users[userIndex].name = name;
    users[userIndex].email = email;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    // Update current session
    const currentUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    const updatedUser = { ...currentUser, name, email };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

    return updatedUser;
  },

  // Update AI Preference
  updateAIPreference: async (id: string, provider: AIProvider): Promise<void> => {
    // No delay needed for this background sync usually, but keeping consistency
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const userIndex = users.findIndex((u: any) => u.id === id);

    if (userIndex !== -1) {
        users[userIndex].aiProvider = provider;
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

        // Update Session if it matches
        const currentUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
        if (currentUser.id === id) {
             currentUser.aiProvider = provider;
             localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        }
    }
  },

  // Upgrade Plan
  upgradePlan: async (id: string, plan: PlanType): Promise<User> => {
    await delay(1500); // Simulate payment processing time
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const userIndex = users.findIndex((u: any) => u.id === id);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Update in DB
    users[userIndex].plan = plan;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    // Update current session
    const currentUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    const updatedUser = { ...currentUser, plan };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

    return updatedUser;
  },

  // Change Password
  changePassword: async (id: string, currentPass: string, newPass: string): Promise<void> => {
    await delay(600);
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const user = users.find((u: any) => u.id === id);

    if (!user) throw new Error('User not found');
    if (user.password !== currentPass) throw new Error('Incorrect current password');

    user.password = newPass;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  },

  // User Request Deletion (Soft Delete Flag)
  requestAccountDeletion: async (id: string): Promise<User> => {
    await delay(800);
    
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const userIndex = users.findIndex((u: any) => u.id === id);

    if (userIndex === -1) throw new Error('User not found');

    // Mark as requested
    users[userIndex].deletionRequested = true;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    // Update Session
    const currentUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    const updatedUser = { ...currentUser, deletionRequested: true };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

    return updatedUser;
  },

  // Admin: Permanent Delete
  adminDeleteUser: async (id: string): Promise<void> => {
    await delay(500);

    // 1. Remove from Users DB
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const newUsers = users.filter((u: any) => u.id !== id);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(newUsers));

    // 2. Remove from History DB (Cascade Delete)
    const history = JSON.parse(localStorage.getItem(HISTORY_DB_KEY) || '[]');
    const newHistory = history.filter((item: any) => item.userId !== id);
    localStorage.setItem(HISTORY_DB_KEY, JSON.stringify(newHistory));
  },

  // Admin: Cancel Deletion Request (Optional feature, logic similar to request but setting false)
  adminCancelDeletion: async (id: string): Promise<void> => {
     const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
     const userIndex = users.findIndex((u: any) => u.id === id);
     if (userIndex !== -1) {
        users[userIndex].deletionRequested = false;
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
     }
  },

  // Admin: Get Full Dashboard Stats
  getAdminStats: async () => {
    await delay(400);
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    
    // Filter out password for security even in mock
    const allUsers = users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        plan: u.plan,
        role: u.role,
        deletionRequested: u.deletionRequested || false,
        aiProvider: u.aiProvider || 'gemini',
        lastActive: u.lastActive || new Date().toISOString()
    }));

    const totalUsers = allUsers.length;
    // Simple logic for active sessions: users active in last hour (simulated)
    // For demo, just random number
    const activeSessions = Math.floor(Math.random() * 5) + 1;
    const deletionRequests = allUsers.filter((u: any) => u.deletionRequested);

    return {
        totalUsers,
        activeSessions,
        deletionRequests,
        allUsers // Sending full list for the table
    };
  },

  // Logout
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Get current user from storage
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};
