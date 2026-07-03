import { useState } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  FilePlus,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'generate', label: 'Generate Bill', icon: FilePlus },
  { id: 'bills', label: 'Previous Bills', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const active = currentPage === item.id;
    const Icon = item.icon;
    return (
      <button
        onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
        }`}
      >
        <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
        <span className="flex-1 text-left">{item.label}</span>
        {active && <ChevronRight className="w-4 h-4 opacity-70" />}
      </button>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700/50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight">GTU Bill</p>
          <p className="text-slate-400 text-xs leading-tight truncate">External Examiner</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => <NavLink key={item.id} item={item} />)}
      </nav>

      {/* User & Logout */}
      <div className="px-3 pb-4 border-t border-slate-700/50 pt-4 space-y-2">
        <div className="px-4 py-2 bg-slate-800 rounded-xl">
          <p className="text-slate-400 text-xs">Signed in as</p>
          <p className="text-slate-200 text-xs font-medium truncate">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 flex-shrink-0">
            <Sidebar />
          </div>
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-700/50">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-slate-400 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <span className="text-white font-semibold text-sm">GTU Bill System</span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
