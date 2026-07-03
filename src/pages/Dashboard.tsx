import { useEffect, useState } from 'react';
import { FilePlus, History, FileText, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

interface Stats {
  totalBills: number;
  thisMonth: number;
  totalAmount: number;
  recentBills: Array<{ id: string; full_name: string; gross_total: number; created_at: string }>;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalBills: 0, thisMonth: 0, totalAmount: 0, recentBills: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('bills')
        .select('id, full_name, gross_total, created_at')
        .order('created_at', { ascending: false });

      if (data) {
        const now = new Date();
        const thisMonth = data.filter(b => {
          const d = new Date(b.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        setStats({
          totalBills: data.length,
          thisMonth: thisMonth.length,
          totalAmount: data.reduce((s, b) => s + (b.gross_total || 0), 0),
          recentBills: data.slice(0, 5),
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: 'Total Bills', value: stats.totalBills, icon: FileText, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: 'This Month', value: stats.thisMonth, icon: Calendar, color: 'bg-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Total Amount', value: `₹${stats.totalAmount.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'bg-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800">Welcome back!</h1>
        <p className="text-slate-500 text-sm mt-0.5">{user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">{card.label}</span>
                <div className={`${card.bg} p-2 rounded-lg`}>
                  <Icon className={`w-4 h-4`} style={{ color: card.color.replace('bg-', '').includes('blue') ? '#3b82f6' : card.color.includes('emerald') ? '#10b981' : '#f59e0b' }} />
                </div>
              </div>
              {loading ? (
                <div className="h-7 bg-slate-100 rounded animate-pulse w-20" />
              ) : (
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
        <button
          onClick={() => onNavigate('generate')}
          className="group bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-6 text-left transition-all shadow-sm hover:shadow-md hover:shadow-blue-600/20"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-xl p-3">
              <FilePlus className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-base">Generate New Bill</p>
              <p className="text-blue-200 text-sm">Create a new examiner bill</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('bills')}
          className="group bg-white hover:bg-slate-50 text-slate-800 rounded-2xl p-6 text-left transition-all shadow-sm border border-slate-200 hover:border-slate-300"
        >
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 rounded-xl p-3">
              <History className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="font-semibold text-base">Previous Bills</p>
              <p className="text-slate-500 text-sm">View and download past bills</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Bills */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Bills</h2>
          <button onClick={() => onNavigate('bills')} className="text-blue-600 text-sm hover:text-blue-700 font-medium">
            View all
          </button>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : stats.recentBills.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No bills generated yet.</p>
            <button
              onClick={() => onNavigate('generate')}
              className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              Generate your first bill
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {stats.recentBills.map(bill => (
              <div key={bill.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition">
                <div>
                  <p className="text-sm font-medium text-slate-800">{bill.full_name || 'Unnamed Examiner'}</p>
                  <p className="text-xs text-slate-400">{new Date(bill.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <p className="text-sm font-semibold text-slate-700">₹{(bill.gross_total || 0).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
