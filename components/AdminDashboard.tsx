
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, UserMinus, Shield, Activity, Trash2, XCircle, CheckCircle, Search, Cpu, Clock, Calendar, FileText, X, ChevronRight, Mail, Hash } from 'lucide-react';
import { User, AnalysisHistoryItem } from '../types';
import { historyService } from '../services/historyService';

interface AdminStats {
  totalUsers: number;
  activeSessions: number;
  deletionRequests: User[];
  allUsers: User[];
}

export const AdminDashboard: React.FC = () => {
  const { getAdminStats, adminDeleteUser, adminCancelDeletion, user: currentUser } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  
  // User Detail Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<AnalysisHistoryItem[]>([]);

  const fetchStats = async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load admin stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch history when a user is selected
  useEffect(() => {
    if (selectedUser) {
        const history = historyService.getUserHistory(selectedUser.id);
        setUserHistory(history);
    }
  }, [selectedUser]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(!confirm("Are you sure? This will permanently delete the user and all their data.")) return;
    setActionLoading(id);
    try {
        await adminDeleteUser(id);
        if (selectedUser?.id === id) setSelectedUser(null); // Close modal if open
        await fetchStats(); 
    } catch(err) {
        alert("Failed to delete user");
    } finally {
        setActionLoading(null);
    }
  };

  const handleCancel = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
        await adminCancelDeletion(id);
        if (selectedUser?.id === id) {
            // Update local modal state if open
            setSelectedUser(prev => prev ? {...prev, deletionRequested: false} : null);
        }
        await fetchStats();
    } catch(err) {
        alert("Action failed");
    } finally {
        setActionLoading(null);
    }
  };

  // Helper to format timestamps
  const formatDate = (isoStr?: string) => {
      if (!isoStr) return 'Never';
      const d = new Date(isoStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredUsers = stats?.allUsers.filter(u => 
      u.name.toLowerCase().includes(filter.toLowerCase()) || 
      u.email.toLowerCase().includes(filter.toLowerCase()) ||
      u.id.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Admin Dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="text-indigo-600" /> Admin Command Center
                </h1>
                <p className="text-slate-500">System metrics, user management, and compliance controls.</p>
            </div>
            <div className="flex items-center gap-4">
                 <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                    System Operational
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Total Registered Users</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.totalUsers}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Active Sessions</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.activeSessions}</h3>
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online (Simulated)
                        </p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Activity size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Deletion Requests</p>
                        <h3 className={`text-3xl font-bold mt-2 ${stats?.deletionRequests.length ? 'text-red-600' : 'text-slate-800'}`}>
                            {stats?.deletionRequests.length}
                        </h3>
                        {stats?.deletionRequests.length ? (
                            <p className="text-xs text-red-500 mt-1">Action Required</p>
                        ) : (
                            <p className="text-xs text-slate-400 mt-1">All clear</p>
                        )}
                    </div>
                    <div className={`p-3 rounded-lg ${stats?.deletionRequests.length ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                        <UserMinus size={24} />
                    </div>
                </div>
            </div>
        </div>

        {/* Master User Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users size={18} /> User Database
                </h3>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text"
                        placeholder="Search name, email, id..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">User Details</th>
                            <th className="px-6 py-4">Plan & Role</th>
                            <th className="px-6 py-4">AI Configuration</th>
                            <th className="px-6 py-4">Activity</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No users found matching "{filter}"
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr 
                                    key={user.id} 
                                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${user.deletionRequested ? 'bg-red-50/30' : ''}`}
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm transition-transform hover:scale-105 ${user.role === 'admin' ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 flex items-center gap-2">
                                                    {user.name}
                                                    {currentUser?.id === user.id && (
                                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">YOU</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {user.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`inline-flex self-start px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.plan === 'pro' ? 'bg-blue-100 text-blue-700' : user.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {user.plan}
                                            </span>
                                            <span className={`inline-flex self-start px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                                {user.role === 'user' ? 'Student' : user.role}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {user.aiProvider === 'local' ? (
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                    <Cpu size={14} className="text-slate-500" /> Local LLM
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div> Gemini Cloud
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                                             <div className="flex items-center gap-1.5" title="Last Login">
                                                <Clock size={12} /> {formatDate(user.lastActive)}
                                             </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.deletionRequested ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded border border-red-200">
                                                <UserMinus size={12} /> Deletion Requested
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                                <CheckCircle size={12} /> Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {user.role !== 'admin' && (
                                            <div className="flex justify-end gap-2">
                                                {user.deletionRequested && (
                                                    <button 
                                                        onClick={(e) => handleCancel(e, user.id)}
                                                        disabled={actionLoading === user.id}
                                                        className="px-2 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
                                                        title="Cancel Deletion Request"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={(e) => handleDelete(e, user.id)}
                                                    disabled={actionLoading === user.id}
                                                    className="px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded hover:bg-red-100 transition-colors flex items-center gap-1 ml-auto disabled:opacity-50"
                                                    title="Permanently Delete User"
                                                >
                                                    <Trash2 size={12} />
                                                    {actionLoading === user.id ? '...' : 'Delete'}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* User Detail Modal */}
        {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    {/* Modal Header */}
                    <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-start">
                        <div className="flex items-start gap-4">
                             <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg ${selectedUser.role === 'admin' ? 'bg-indigo-600' : 'bg-slate-500'}`}>
                                {selectedUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{selectedUser.name}</h2>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                    <Mail size={14} /> {selectedUser.email}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${selectedUser.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-50 text-green-700'}`}>
                                        {selectedUser.role === 'user' ? 'Student' : selectedUser.role}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                        {selectedUser.plan}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-full"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 overflow-y-auto">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">User ID</span>
                                <div className="flex items-center gap-2 text-sm text-slate-700 font-mono">
                                    <Hash size={14} /> {selectedUser.id}
                                </div>
                             </div>
                             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Last Active</span>
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Clock size={14} /> {formatDate(selectedUser.lastActive)}
                                </div>
                             </div>
                             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">AI Provider</span>
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Cpu size={14} /> 
                                    {selectedUser.aiProvider === 'local' ? 'Local LLM (Ollama)' : 'Google Gemini Cloud'}
                                </div>
                             </div>
                             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Account Status</span>
                                <div className="flex items-center gap-2 text-sm">
                                    {selectedUser.deletionRequested ? (
                                        <span className="text-red-600 font-bold flex items-center gap-1"><UserMinus size={14} /> Pending Deletion</span>
                                    ) : (
                                        <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={14} /> Active</span>
                                    )}
                                </div>
                             </div>
                        </div>

                        {/* Analysis History */}
                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-blue-600" /> User Data & Analysis History
                            </h3>
                            
                            {userHistory.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                    <p className="text-slate-400 text-sm">No analysis history found for this user.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {userHistory.map(item => (
                                        <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-slate-800 text-sm">{item.title}</p>
                                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                                        <span><Calendar size={12} className="inline mr-1" />{new Date(item.date).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span>{item.result.trends.length} Topics Analyzed</span>
                                                    </p>
                                                </div>
                                                <ChevronRight size={16} className="text-slate-300" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Modal Footer (Actions) */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                         {selectedUser.deletionRequested && (
                             <button 
                                onClick={(e) => handleCancel(e, selectedUser.id)}
                                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors text-sm"
                             >
                                Cancel Deletion Request
                             </button>
                         )}
                         {selectedUser.role !== 'admin' && (
                             <button 
                                onClick={(e) => handleDelete(e, selectedUser.id)}
                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                             >
                                <Trash2 size={16} /> Delete Account
                             </button>
                         )}
                         <button 
                            onClick={() => setSelectedUser(null)}
                            className="px-4 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors text-sm"
                         >
                            Close
                         </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
