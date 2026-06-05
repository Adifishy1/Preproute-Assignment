import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface Props { children: React.ReactNode; }

const AppLayout: React.FC<Props> = ({ children }) => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-white/8 bg-surface-1 fixed h-full z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display font-700 text-lg tracking-tight text-white">Preproute</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/8">
          <div className="glass-sm px-3 py-2.5 mb-2">
            <p className="text-xs text-white/40 mb-0.5">Logged in as</p>
            <p className="text-sm font-medium text-white truncate">{user?.userId || 'Admin'}</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full justify-start text-sm text-red-400 hover:bg-red-500/10 hover:text-red-400">
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
