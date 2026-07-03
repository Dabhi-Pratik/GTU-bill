import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Banknote, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const LABEL = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide';
const INPUT = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';
const SECTION = 'bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-5';

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: '', designation: '', basic_pay: '', institute_name: '',
    pan_no: '', aadhar_no: '', phone_no: '', email: '',
    bank_name: '', branch_code: '', ac_type: 'SB', ac_no: '', ifsc_code: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setForm({
          full_name: data.full_name || '',
          designation: data.designation || '',
          basic_pay: data.basic_pay || '',
          institute_name: data.institute_name || '',
          pan_no: data.pan_no || '',
          aadhar_no: data.aadhar_no || '',
          phone_no: data.phone_no || '',
          email: data.email || user.email || '',
          bank_name: data.bank_name || '',
          branch_code: data.branch_code || '',
          ac_type: data.ac_type || 'SB',
          ac_no: data.ac_no || '',
          ifsc_code: data.ifsc_code || '',
        });
      } else {
        setForm(prev => ({ ...prev, email: user.email || '' }));
      }
      setLoading(false);
    });
  }, [user]);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setStatus(null);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...form, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) setStatus({ type: 'error', msg: 'Failed to save: ' + error.message });
    else setStatus({ type: 'success', msg: 'Profile saved successfully! These details will auto-fill on new bills.' });
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-7">
        <div className="bg-blue-100 p-2 rounded-xl">
          <SettingsIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Settings</h1>
          <p className="text-slate-500 text-sm">Profile defaults auto-fill on new bills</p>
        </div>
      </div>

      {status && (
        <div className={`flex items-start gap-2 rounded-lg px-4 py-3 mb-5 text-sm ${
          status.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <span>{status.msg}</span>
        </div>
      )}

      <form onSubmit={save}>
        {/* Personal */}
        <div className={SECTION}>
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Personal Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={LABEL}>Full Name</label>
              <input className={INPUT} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Dr. Ramesh Patel" />
            </div>
            <div>
              <label className={LABEL}>Designation</label>
              <input className={INPUT} value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="Professor" />
            </div>
            <div>
              <label className={LABEL}>Basic Pay (Old)</label>
              <input className={INPUT} value={form.basic_pay} onChange={e => set('basic_pay', e.target.value)} placeholder="15600" />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Institute Name &amp; Address</label>
              <textarea className={INPUT + ' resize-none'} rows={2} value={form.institute_name} onChange={e => set('institute_name', e.target.value)} placeholder="Full institute name and address" />
            </div>
          </div>
        </div>

        {/* Identification */}
        <div className={SECTION}>
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Identification &amp; Contact</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>PAN No</label>
              <input className={INPUT} value={form.pan_no} onChange={e => set('pan_no', e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
            </div>
            <div>
              <label className={LABEL}>Aadhar No</label>
              <input className={INPUT} value={form.aadhar_no} onChange={e => set('aadhar_no', e.target.value)} placeholder="1234 5678 9012" maxLength={14} />
            </div>
            <div>
              <label className={LABEL}>Phone No</label>
              <input className={INPUT} value={form.phone_no} onChange={e => set('phone_no', e.target.value)} placeholder="9876543210" />
            </div>
            <div>
              <label className={LABEL}>Email ID</label>
              <input type="email" className={INPUT} value={form.email} onChange={e => set('email', e.target.value)} placeholder="examiner@institute.edu" />
            </div>
          </div>
        </div>

        {/* Bank */}
        <div className={SECTION}>
          <div className="flex items-center gap-2 mb-5">
            <Banknote className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Bank Details</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>Bank Name</label>
              <input className={INPUT} value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="State Bank of India" />
            </div>
            <div>
              <label className={LABEL}>Branch Code</label>
              <input className={INPUT} value={form.branch_code} onChange={e => set('branch_code', e.target.value)} placeholder="Branch code" />
            </div>
            <div>
              <label className={LABEL}>A/C Type</label>
              <select className={INPUT} value={form.ac_type} onChange={e => set('ac_type', e.target.value)}>
                <option value="SB">SB (Savings)</option>
                <option value="CB">CB (Current)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>A/C No. (Full Digits)</label>
              <input className={INPUT} value={form.ac_no} onChange={e => set('ac_no', e.target.value)} placeholder="Full account number" />
            </div>
            <div>
              <label className={LABEL}>IFSC Code</label>
              <input className={INPUT} value={form.ifsc_code} onChange={e => set('ifsc_code', e.target.value.toUpperCase())} placeholder="SBIN0001234" maxLength={11} />
            </div>
          </div>
        </div>

        {/* Account */}
        <div className={SECTION}>
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Account</h2>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{user?.email}</p>
              <p className="text-xs text-slate-500">Registered email address</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
