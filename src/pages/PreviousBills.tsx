import { useEffect, useState } from 'react';
import {
  History, Download, Printer, Trash2, FileText, Search, RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateGTUBillPDF, downloadPDF, printPDF } from '../lib/pdfGenerator';
import type { TARow } from '../lib/pdfGenerator';

interface Bill {
  id: string;
  full_name: string;
  designation: string;
  institute_name: string;
  bill_date: string;
  gross_total: number;
  purpose_semester: string;
  created_at: string;
  ta_rows: TARow[];
  ta_total: number;
  da_days: number; da_rate: number; da_total: number;
  honorarium_days: number; honorarium_rate: number; honorarium_total: number; total_students: number;
  accommodation_days: number; accommodation_rate: number; accommodation_total: number;
  pan_no: string; aadhar_no: string; phone_no: string; email: string;
  basic_pay: string; reference_letter_no: string;
  railway_class: string; vehicle_no: string;
  advance_received: number; remaining_amount: number; receipt_no: string; receipt_dated: string;
  bank_name: string; branch_code: string; ac_type: string; ac_no: string; ifsc_code: string;
}

export default function PreviousBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false });
    setBills((data as Bill[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = bills.filter(b =>
    !search ||
    b.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.institute_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.designation?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDownload(bill: Bill) {
    setGenerating(bill.id);
    try {
      const bytes = await generateGTUBillPDF({
        fullName: bill.full_name,
        date: bill.bill_date,
        designation: bill.designation,
        basicPay: bill.basic_pay,
        instituteName: bill.institute_name,
        panNo: bill.pan_no,
        aadharNo: bill.aadhar_no,
        phoneNo: bill.phone_no,
        email: bill.email,
        purposeSemester: bill.purpose_semester,
        referenceLetterNo: bill.reference_letter_no,
        taRows: bill.ta_rows || [],
        taTotal: bill.ta_total,
        daDays: bill.da_days, daRate: bill.da_rate, daTotal: bill.da_total,
        honorariumDays: bill.honorarium_days, honorariumRate: bill.honorarium_rate,
        honorariumTotal: bill.honorarium_total, totalStudents: bill.total_students,
        accommodationDays: bill.accommodation_days, accommodationRate: bill.accommodation_rate,
        accommodationTotal: bill.accommodation_total,
        grossTotal: bill.gross_total,
        railwayClass: bill.railway_class, vehicleNo: bill.vehicle_no,
        advanceReceived: bill.advance_received, remainingAmount: bill.remaining_amount,
        receiptNo: bill.receipt_no, receiptDated: bill.receipt_dated,
        bankName: bill.bank_name, branchCode: bill.branch_code,
        acType: bill.ac_type, acNo: bill.ac_no, ifscCode: bill.ifsc_code,
        signerName: bill.full_name,
      });
      const fname = `GTU_Bill_${(bill.full_name || 'Examiner').replace(/\s+/g, '_')}_${bill.bill_date || 'bill'}.pdf`;
      downloadPDF(bytes, fname);
    } catch (err) {
      console.error(err);
    }
    setGenerating(null);
  }

  async function handlePrint(bill: Bill) {
    setGenerating(bill.id);
    try {
      const bytes = await generateGTUBillPDF({
        fullName: bill.full_name, date: bill.bill_date, designation: bill.designation,
        basicPay: bill.basic_pay, instituteName: bill.institute_name,
        panNo: bill.pan_no, aadharNo: bill.aadhar_no, phoneNo: bill.phone_no, email: bill.email,
        purposeSemester: bill.purpose_semester, referenceLetterNo: bill.reference_letter_no,
        taRows: bill.ta_rows || [], taTotal: bill.ta_total,
        daDays: bill.da_days, daRate: bill.da_rate, daTotal: bill.da_total,
        honorariumDays: bill.honorarium_days, honorariumRate: bill.honorarium_rate,
        honorariumTotal: bill.honorarium_total, totalStudents: bill.total_students,
        accommodationDays: bill.accommodation_days, accommodationRate: bill.accommodation_rate,
        accommodationTotal: bill.accommodation_total, grossTotal: bill.gross_total,
        railwayClass: bill.railway_class, vehicleNo: bill.vehicle_no,
        advanceReceived: bill.advance_received, remainingAmount: bill.remaining_amount,
        receiptNo: bill.receipt_no, receiptDated: bill.receipt_dated,
        bankName: bill.bank_name, branchCode: bill.branch_code,
        acType: bill.ac_type, acNo: bill.ac_no, ifscCode: bill.ifsc_code,
        signerName: bill.full_name,
      });
      printPDF(bytes);
    } catch (err) {
      console.error(err);
    }
    setGenerating(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this bill permanently?')) return;
    setDeleting(id);
    await supabase.from('bills').delete().eq('id', id);
    setBills(prev => prev.filter(b => b.id !== id));
    setDeleting(null);
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-xl">
            <History className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Previous Bills</h1>
            <p className="text-slate-500 text-sm">{bills.length} bill{bills.length !== 1 ? 's' : ''} generated</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Search by name, institute, or designation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">{search ? 'No bills match your search.' : 'No bills generated yet.'}</p>
          <p className="text-slate-400 text-sm mt-1">Bills you generate will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(bill => (
            <div key={bill.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-slate-800 text-sm">{bill.full_name || 'Unnamed Examiner'}</h3>
                    {bill.purpose_semester && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        B.E. Sem {bill.purpose_semester}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs truncate">{bill.designation}{bill.institute_name ? ` · ${bill.institute_name}` : ''}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-slate-400">
                      {bill.bill_date ? new Date(bill.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Saved {new Date(bill.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-slate-800">₹{(bill.gross_total || 0).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-400">Gross Total</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50 flex-wrap">
                <button
                  onClick={() => handlePrint(bill)}
                  disabled={generating === bill.id}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={() => handleDownload(bill)}
                  disabled={generating === bill.id}
                  className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {generating === bill.id ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={() => handleDelete(bill.id)}
                  disabled={deleting === bill.id}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting === bill.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
