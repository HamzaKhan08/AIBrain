
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PlanType, AIProvider, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, verificationCode: string) => Promise<void>;
  sendVerificationOTP: (email: string, role: UserRole) => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
  updateUserAIPreference: (provider: AIProvider) => Promise<void>;
  upgradePlan: (plan: PlanType) => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<void>;
  requestAccountDeletion: () => Promise<void>;
  adminDeleteUser: (id: string) => Promise<void>;
  adminCancelDeletion: (id: string) => Promise<void>;
  getAdminStats: () => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for existing session on mount
    const currentUser = authService.getCurrentUser();
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      const response = await authService.login(email, password, role);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole, verificationCode: string) => {
    try {
      const response = await authService.register(name, email, password, role, verificationCode);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const sendVerificationOTP = async (email: string, role: UserRole) => {
    await authService.sendVerificationOTP(email, role);
  }

  const updateProfile = async (name: string, email: string) => {
    if (!user) return;
    try {
        const updatedUser = await authService.updateProfile(user.id, name, email);
        setUser(updatedUser);
    } catch (error) {
        throw error;
    }
  };

  const updateUserAIPreference = async (provider: AIProvider) => {
    if (!user) return;
    try {
        await authService.updateAIPreference(user.id, provider);
        // Update local state
        setUser({ ...user, aiProvider: provider });
    } catch (error) {
        console.error("Failed to sync AI preference", error);
    }
  };

  const upgradePlan = async (plan: PlanType) => {
    if (!user) return;
    try {
        const updatedUser = await authService.upgradePlan(user.id, plan);
        setUser(updatedUser);
    } catch (error) {
        throw error;
    }
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!user) return;
    try {
        await authService.changePassword(user.id, currentPass, newPass);
    } catch (error) {
        throw error;
    }
  };

  const requestAccountDeletion = async () => {
    if (!user) return;
    try {
        const updatedUser = await authService.requestAccountDeletion(user.id);
        setUser(updatedUser);
    } catch (error) {
        throw error;
    }
  };

  // Admin Methods
  const adminDeleteUser = async (id: string) => {
    await authService.adminDeleteUser(id);
  };
  
  const adminCancelDeletion = async (id: string) => {
    await authService.adminCancelDeletion(id);
  }

  const getAdminStats = async () => {
    return await authService.getAdminStats();
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        isAdmin: user?.role === 'admin',
        login, 
        register, 
        sendVerificationOTP,
        updateProfile, 
        updateUserAIPreference,
        upgradePlan, 
        changePassword, 
        requestAccountDeletion,
        adminDeleteUser,
        adminCancelDeletion,
        getAdminStats,
        logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
