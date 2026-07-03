import { useState, useEffect } from 'react';
import {
  User, Building2, CreditCard, MapPin, Calculator, Banknote,
  Download, Printer, Save, Plus, Trash2, AlertCircle, CheckCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { numberToWords } from '../lib/utils';
import { generateGTUBillPDF, downloadPDF, printPDF } from '../lib/pdfGenerator';
import type { TARow, BillData } from '../lib/pdfGenerator';

const emptyTA = (): TARow => ({
  date: '', from: '', to: '', distance: '', mode: '', class: '', fare: '', remark: '',
});

interface FormState {
  fullName: string;
  date: string;
  designation: string;
  basicPay: string;
  instituteName: string;
  panNo: string;
  aadharNo: string;
  phoneNo: string;
  email: string;
  purposeSemester: string;
  referenceLetterNo: string;
  taRows: TARow[];
  daDays: string;
  daRate: string;
  honorariumDays: string;
  honorariumRate: string;
  totalStudents: string;
  accommodationDays: string;
  accommodationRate: string;
  railwayClass: string;
  vehicleNo: string;
  advanceReceived: string;
  remainingAmount: string;
  receiptNo: string;
  receiptDated: string;
  bankName: string;
  branchCode: string;
  acType: string;
  acNo: string;
  ifscCode: string;
  signerName: string;
}

const SECTION_CLASS = 'bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-5';
const LABEL_CLASS = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide';
const INPUT_CLASS = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';
const INPUT_SM = 'w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';

export default function GenerateBill() {
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>({
    fullName: '', date: new Date().toISOString().split('T')[0],
    designation: '', basicPay: '', instituteName: '',
    panNo: '', aadharNo: '', phoneNo: '', email: '',
    purposeSemester: '', referenceLetterNo: '',
    taRows: [emptyTA()],
    daDays: '', daRate: '', honorariumDays: '', honorariumRate: '',
    totalStudents: '', accommodationDays: '', accommodationRate: '',
    railwayClass: '', vehicleNo: '',
    advanceReceived: '', remainingAmount: '', receiptNo: '', receiptDated: '',
    bankName: '', branchCode: '', acType: 'SB', acNo: '', ifscCode: '',
    signerName: '',
  });

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Load profile defaults
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setForm(prev => ({
          ...prev,
          fullName: data.full_name || prev.fullName,
          designation: data.designation || prev.designation,
          basicPay: data.basic_pay || prev.basicPay,
          instituteName: data.institute_name || prev.instituteName,
          panNo: data.pan_no || prev.panNo,
          aadharNo: data.aadhar_no || prev.aadharNo,
          phoneNo: data.phone_no || prev.phoneNo,
          email: data.email || prev.email,
          bankName: data.bank_name || prev.bankName,
          branchCode: data.branch_code || prev.branchCode,
          acType: data.ac_type || prev.acType,
          acNo: data.ac_no || prev.acNo,
          ifscCode: data.ifsc_code || prev.ifscCode,
          signerName: data.full_name || prev.signerName,
        }));
      }
    });
  }, [user]);

  // Calculations
  const taTotal = form.taRows.reduce((sum, row) => sum + (parseFloat(row.fare) || 0), 0);
  const daTotal = (parseFloat(form.daDays) || 0) * (parseFloat(form.daRate) || 0);
  const honorariumTotal = (parseFloat(form.honorariumDays) || 0) * (parseFloat(form.honorariumRate) || 0);
  const accommodationTotal = (parseFloat(form.accommodationDays) || 0) * (parseFloat(form.accommodationRate) || 0);
  const grossTotal = taTotal + daTotal + honorariumTotal + accommodationTotal;

  const set = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const setTA = (index: number, field: keyof TARow, value: string) =>
    setForm(prev => {
      const rows = [...prev.taRows];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, taRows: rows };
    });

  const addTA = () => setForm(prev => ({ ...prev, taRows: [...prev.taRows, emptyTA()] }));
  const removeTA = (i: number) => setForm(prev => ({ ...prev, taRows: prev.taRows.filter((_, idx) => idx !== i) }));

  function buildBillData(): BillData {
    return {
      fullName: form.fullName,
      date: form.date,
      designation: form.designation,
      basicPay: form.basicPay,
      instituteName: form.instituteName,
      panNo: form.panNo,
      aadharNo: form.aadharNo,
      phoneNo: form.phoneNo,
      email: form.email,
      purposeSemester: form.purposeSemester,
      referenceLetterNo: form.referenceLetterNo,
      taRows: form.taRows,
      taTotal,
      daDays: parseFloat(form.daDays) || 0,
      daRate: parseFloat(form.daRate) || 0,
      daTotal,
      honorariumDays: parseFloat(form.honorariumDays) || 0,
      honorariumRate: parseFloat(form.honorariumRate) || 0,
      honorariumTotal,
      totalStudents: parseInt(form.totalStudents) || 0,
      accommodationDays: parseFloat(form.accommodationDays) || 0,
      accommodationRate: parseFloat(form.accommodationRate) || 0,
      accommodationTotal,
      grossTotal,
      railwayClass: form.railwayClass,
      vehicleNo: form.vehicleNo,
      advanceReceived: parseFloat(form.advanceReceived) || 0,
      remainingAmount: parseFloat(form.remainingAmount) || 0,
      receiptNo: form.receiptNo,
      receiptDated: form.receiptDated,
      bankName: form.bankName,
      branchCode: form.branchCode,
      acType: form.acType,
      acNo: form.acNo,
      ifscCode: form.ifscCode,
      signerName: form.signerName || form.fullName,
    };
  }

  async function saveBill() {
    setSaving(true);
    setStatus(null);
    const billData = buildBillData();
    const { error } = await supabase.from('bills').insert({
      full_name: billData.fullName,
      bill_date: billData.date,
      designation: billData.designation,
      basic_pay: billData.basicPay,
      institute_name: billData.instituteName,
      pan_no: billData.panNo,
      aadhar_no: billData.aadharNo,
      phone_no: billData.phoneNo,
      email: billData.email,
      purpose_semester: billData.purposeSemester,
      reference_letter_no: billData.referenceLetterNo,
      ta_rows: billData.taRows,
      ta_total: billData.taTotal,
      da_days: billData.daDays,
      da_rate: billData.daRate,
      da_total: billData.daTotal,
      honorarium_days: billData.honorariumDays,
      honorarium_rate: billData.honorariumRate,
      honorarium_total: billData.honorariumTotal,
      total_students: billData.totalStudents,
      accommodation_days: billData.accommodationDays,
      accommodation_rate: billData.accommodationRate,
      accommodation_total: billData.accommodationTotal,
      gross_total: billData.grossTotal,
      railway_class: billData.railwayClass,
      vehicle_no: billData.vehicleNo,
      advance_received: billData.advanceReceived,
      remaining_amount: billData.remainingAmount,
      receipt_no: billData.receiptNo,
      receipt_dated: billData.receiptDated,
      bank_name: billData.bankName,
      branch_code: billData.branchCode,
      ac_type: billData.acType,
      ac_no: billData.acNo,
      ifsc_code: billData.ifscCode,
    });
    setSaving(false);
    if (error) setStatus({ type: 'error', msg: 'Failed to save: ' + error.message });
    else setStatus({ type: 'success', msg: 'Bill saved successfully.' });
  }

  async function handleDownload() {
    if (!form.fullName) { setStatus({ type: 'error', msg: 'Please enter the examiner full name.' }); return; }
    setGenerating(true);
    setStatus(null);
    try {
      const bytes = await generateGTUBillPDF(buildBillData());
      const fname = `GTU_Bill_${(form.fullName || 'Examiner').replace(/\s+/g, '_')}_${form.date || 'bill'}.pdf`;
      downloadPDF(bytes, fname);
      await saveBill();
    } catch (err: unknown) {
      setStatus({ type: 'error', msg: 'PDF generation failed: ' + (err instanceof Error ? err.message : String(err)) });
    }
    setGenerating(false);
  }

  async function handlePrint() {
    if (!form.fullName) { setStatus({ type: 'error', msg: 'Please enter the examiner full name.' }); return; }
    setGenerating(true);
    setStatus(null);
    try {
      const bytes = await generateGTUBillPDF(buildBillData());
      printPDF(bytes);
    } catch (err: unknown) {
      setStatus({ type: 'error', msg: 'Print failed: ' + (err instanceof Error ? err.message : String(err)) });
    }
    setGenerating(false);
  }

  const amountDisplay = (v: number) => v > 0 ? `₹${v.toLocaleString('en-IN')}` : '—';

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Generate Bill</h1>
          <p className="text-slate-500 text-sm">GTU External Examiner Bill</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={saveBill}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg transition"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handlePrint}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg transition"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            {generating ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 mb-5 text-sm ${
          status.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {status.msg}
        </div>
      )}

      {/* ── PERSONAL INFORMATION ── */}
      <div className={SECTION_CLASS}>
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-slate-800">Personal Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS}>Full Name</label>
            <input className={INPUT_CLASS} value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="e.g. Dr. Ramesh Patel" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Date</label>
            <input type="date" className={INPUT_CLASS} value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Designation</label>
            <select className={INPUT_CLASS} value={form.designation} onChange={e => set('designation', e.target.value)}>
              <option value="">Select Designation</option>
              <option>Professor</option>
              <option>Associate Professor</option>
              <option>Assistant Professor</option>
              <option>Lecturer</option>
              <option>Head of Department</option>
              <option>Principal</option>
              <option>External Examiner</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Basic Pay (Old)</label>
            <input className={INPUT_CLASS} value={form.basicPay} onChange={e => set('basicPay', e.target.value)} placeholder="e.g. 15600" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Signer Name (for signature)</label>
            <input className={INPUT_CLASS} value={form.signerName} onChange={e => set('signerName', e.target.value)} placeholder="Name on signature" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={LABEL_CLASS}>Name of Institute &amp; Address</label>
            <textarea className={INPUT_CLASS + ' resize-none'} rows={2} value={form.instituteName} onChange={e => set('instituteName', e.target.value)} placeholder="Full institute name and address" />
          </div>
        </div>
      </div>

      {/* ── IDENTIFICATION ── */}
      <div className={SECTION_CLASS}>
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-slate-800">Identification &amp; Contact</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={LABEL_CLASS}>PAN No</label>
            <input className={INPUT_CLASS} value={form.panNo} onChange={e => set('panNo', e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Aadhar No</label>
            <input className={INPUT_CLASS} value={form.aadharNo} onChange={e => set('aadharNo', e.target.value)} placeholder="1234 5678 9012" maxLength={14} />
          </div>
          <div className="lg:col-span-2">
            <label className={LABEL_CLASS}>Phone No</label>
            <input className={INPUT_CLASS} value={form.phoneNo} onChange={e => set('phoneNo', e.target.value)} placeholder="9876543210" />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS}>Email ID</label>
            <input type="email" className={INPUT_CLASS} value={form.email} onChange={e => set('email', e.target.value)} placeholder="examiner@institute.edu" />
          </div>
          <div>
            <label className={LABEL_CLASS}>B.E. Semester</label>
            <input className={INPUT_CLASS} value={form.purposeSemester} onChange={e => set('purposeSemester', e.target.value)} placeholder="e.g. 8" maxLength={2} />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS}>Reference Letter No. (if any)</label>
            <input className={INPUT_CLASS} value={form.referenceLetterNo} onChange={e => set('referenceLetterNo', e.target.value)} placeholder="GTU/REF/2024/001" />
          </div>
        </div>
      </div>

      {/* ── TA ── */}
      <div className={SECTION_CLASS}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-800">(A) Travelling Allowance (T.A.)</h2>
          </div>
          <button onClick={addTA} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50 rounded-lg">
                {['Date', 'From', 'To', 'Dist (km)', 'Mode', 'Class', 'Fare (₹)', 'Remark', ''].map(h => (
                  <th key={h} className="text-left px-2 py-2 font-semibold text-slate-600 first:rounded-l-lg last:rounded-r-lg">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.taRows.map((row, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="px-1 py-1.5"><input type="date" className={INPUT_SM} value={row.date} onChange={e => setTA(i, 'date', e.target.value)} /></td>
                  <td className="px-1 py-1.5"><input className={INPUT_SM} value={row.from} onChange={e => setTA(i, 'from', e.target.value)} placeholder="City" /></td>
                  <td className="px-1 py-1.5"><input className={INPUT_SM} value={row.to} onChange={e => setTA(i, 'to', e.target.value)} placeholder="City" /></td>
                  <td className="px-1 py-1.5"><input type="number" className={INPUT_SM} value={row.distance} onChange={e => setTA(i, 'distance', e.target.value)} placeholder="0" /></td>
                  <td className="px-1 py-1.5">
                    <select className={INPUT_SM} value={row.mode} onChange={e => setTA(i, 'mode', e.target.value)}>
                      <option value="">Select</option>
                      <option>Bus</option>
                      <option>Car</option>
                      <option>Rail</option>
                      <option>Air</option>
                      <option>Own Car</option>
                    </select>
                  </td>
                  <td className="px-1 py-1.5">
                    <select className={INPUT_SM} value={row.class} onChange={e => setTA(i, 'class', e.target.value)}>
                      <option value="">Select</option>
                      <option>Ordinary</option>
                      <option>Economy</option>
                      <option>AC</option>
                      <option>Luxury</option>
                      <option>Local</option>
                    </select>
                  </td>
                  <td className="px-1 py-1.5"><input type="number" className={INPUT_SM} value={row.fare} onChange={e => setTA(i, 'fare', e.target.value)} placeholder="0" /></td>
                  <td className="px-1 py-1.5"><input className={INPUT_SM} value={row.remark} onChange={e => setTA(i, 'remark', e.target.value)} placeholder="Note" /></td>
                  <td className="px-1 py-1.5">
                    {form.taRows.length > 1 && (
                      <button onClick={() => removeTA(i)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-3">
          <span className="text-sm font-semibold text-slate-700">Total (A): <span className="text-blue-700">{amountDisplay(taTotal)}</span></span>
        </div>
      </div>

      {/* ── DA ── */}
      <div className={SECTION_CLASS}>
        <div className="flex items-center gap-2 mb-5">
          <Calculator className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-slate-800">(B) Daily Allowance (D.A.)</h2>
          <span className="text-xs text-slate-400">If applicable</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLASS}>No. of Days</label>
            <input type="number" className={INPUT_CLASS} value={form.daDays} onChange={e => set('daDays', e.target.value)} placeholder="0" min="0" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Rate / Day (₹)</label>
            <input type="number" className={INPUT_CLASS} value={form.daRate} onChange={e => set('daRate', e.target.value)} placeholder="0" min="0" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Total (₹)</label>
            <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-semibold text-slate-700">{amountDisplay(daTotal)}</div>
          </div>
        </div>
      </div>

      {/* ── HONORARIUM ── */}
      <div className={SECTION_CLASS}>
        <div className="flex items-center gap-2 mb-5">
          <Calculator className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-slate-800">(C) Honorarium</h2>
          <span className="text-xs text-slate-400">If prior approval taken &amp; applicable</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={LABEL_CLASS}>No. of Days</label>
            <input type="number" className={INPUT_CLASS} value={form.honorariumDays} onChange={e => set('honorariumDays', e.target.value)} placeholder="0" min="0" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Rate / Day (₹)</label>
            <input type="number" className={INPUT_CLASS} value={form.honorariumRate} onChange={e => set('honorariumRate', e.target.value)} placeholder="0" min="0" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Total Students</label>
            <input type="number" className={INPUT_CLASS} value={form.totalStudents} onChange={e => set('totalStudents', e.target.value)} placeholder="0" min="0" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Total (₹)</label>
            <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-semibold text-slate-700">{amountDisplay(honorariumTotal)}</div>
          </div>
        </div>
      </div>

      {/* ── ACCOMMODATION ── */}
      <div className={SECTION_CLASS}>
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-slate-800">(D) Accommodation</h2>
          <span className="text-xs text-slate-400">If applicable</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLASS}>No. of Days</label>
            <input type="number" className={INPUT_CLASS} value={form.accommodationDays} onChange={e => set('accommodationDays', e.target.value)} placeholder="0" min="0" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Rate / Day (₹)</label>
            <input type="number" className={INPUT_CLASS} value={form.accommodationRate} onChange={e => set('accommodationRate', e.target.value)} placeholder="0" min="0" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Total (₹)</label>
            <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-semibold text-slate-700">{amountDisplay(accommodationTotal)}</div>
          </div>
        </div>
      </div>

      {/* ── GRAND TOTAL ── */}
      <div className="bg-blue-600 rounded-2xl p-5 mb-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-blue-200 text-sm font-medium">Gross Total (A)+(B)+(C)+(D)</p>
            <p className="text-3xl font-bold mt-1">₹{grossTotal.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">Amount in Words</p>
            <p className="text-white text-sm font-semibold mt-0.5 max-w-xs">{numberToWords(grossTotal)}</p>
          </div>
        </div>
      </div>

      {/* ── DECLARATION ── */}
      <div className={SECTION_CLASS}>
        <div className="flex items-center gap-2 mb-5">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-slate-800">Declaration Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Railway Class / Bus Type</label>
            <input className={INPUT_CLASS} value={form.railwayClass} onChange={e => set('railwayClass', e.target.value)} placeholder="e.g. Sleeper / Ordinary" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Own Car Vehicle No.</label>
            <input className={INPUT_CLASS} value={form.vehicleNo} onChange={e => set('vehicleNo', e.target.value.toUpperCase())} placeholder="e.g. GJ01AB1234" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Advance Received (₹)</label>
            <input type="number" className={INPUT_CLASS} value={form.advanceReceived} onChange={e => set('advanceReceived', e.target.value)} placeholder="0" min="0" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Remaining Amount Deposited (₹)</label>
            <input type="number" className={INPUT_CLASS} value={form.remainingAmount} onChange={e => set('remainingAmount', e.target.value)} placeholder="0" min="0" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Receipt No.</label>
            <input className={INPUT_CLASS} value={form.receiptNo} onChange={e => set('receiptNo', e.target.value)} placeholder="Receipt number" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Receipt Dated</label>
            <input type="date" className={INPUT_CLASS} value={form.receiptDated} onChange={e => set('receiptDated', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── BANK DETAILS ── */}
      <div className={SECTION_CLASS}>
        <div className="flex items-center gap-2 mb-5">
          <Banknote className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-slate-800">Bank Details (Electronic Fund Transfer)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLASS}>Bank Name</label>
            <input className={INPUT_CLASS} value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="e.g. State Bank of India" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Branch Code</label>
            <input className={INPUT_CLASS} value={form.branchCode} onChange={e => set('branchCode', e.target.value)} placeholder="Branch code" />
          </div>
          <div>
            <label className={LABEL_CLASS}>A/C Type</label>
            <select className={INPUT_CLASS} value={form.acType} onChange={e => set('acType', e.target.value)}>
              <option value="SB">SB (Savings)</option>
              <option value="CB">CB (Current)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS}>A/C No. (Full Digits)</label>
            <input className={INPUT_CLASS} value={form.acNo} onChange={e => set('acNo', e.target.value)} placeholder="Full account number" />
          </div>
          <div>
            <label className={LABEL_CLASS}>IFSC Code</label>
            <input className={INPUT_CLASS} value={form.ifscCode} onChange={e => set('ifscCode', e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" maxLength={11} />
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex flex-wrap gap-3 justify-end">
        <button
          onClick={handlePrint}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white text-sm font-semibold rounded-lg transition"
        >
          <Printer className="w-4 h-4" />
          Print PDF
        </button>
        <button
          onClick={handleDownload}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition shadow-sm"
        >
          <Download className="w-4 h-4" />
          {generating ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
}
