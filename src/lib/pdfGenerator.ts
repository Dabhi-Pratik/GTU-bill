import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { numberToWords, sanitizeText, formatDate } from './utils';

export interface TARow {
  date: string;
  from: string;
  to: string;
  distance: string;
  mode: string;
  class: string;
  fare: string;
  remark: string;
}

export interface BillData {
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
  taTotal: number;
  daDays: number;
  daRate: number;
  daTotal: number;
  honorariumDays: number;
  honorariumRate: number;
  honorariumTotal: number;
  totalStudents: number;
  accommodationDays: number;
  accommodationRate: number;
  accommodationTotal: number;
  grossTotal: number;
  railwayClass: string;
  vehicleNo: string;
  advanceReceived: number;
  remainingAmount: number;
  receiptNo: string;
  receiptDated: string;
  bankName: string;
  branchCode: string;
  acType: string;
  acNo: string;
  ifscCode: string;
  signerName: string;
}

function s(val: string | number | undefined | null): string {
  if (val === null || val === undefined) return '';
  return sanitizeText(String(val));
}

function n(val: number | undefined | null): string {
  if (!val || val === 0) return '';
  return String(val);
}

export async function generateGTUBillPDF(data: BillData): Promise<Uint8Array> {
  const response = await fetch('/templates/External_Examiner_Bill_Soft_Copy.pdf');
  if (!response.ok) throw new Error('Template PDF not found');
  const templateBytes = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(templateBytes);

  // Template fonts identified from content stream:
  //   F1 = BCDEEE+TimesNewRomanPS-BoldMT  (labels)
  //   F2 = BCDFEE+TimesNewRomanPSMT       (body text)
  // This pdf-lib build exposes TimesRomanBold (value "Times-Bold"), not TimesBold.
  // Both loads are wrapped with a Helvetica fallback so PDF generation never crashes
  // due to a missing font key.
  let timesRoman;
  let timesBold;
  try {
    timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    timesBold  = await pdfDoc.embedFont('Times-Bold' as StandardFonts);
  } catch {
    timesRoman = await pdfDoc.embedFont(StandardFonts.Helvetica);
    timesBold  = timesRoman;
  }

  const pages = pdfDoc.getPages();
  const page = pages[0];

  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);

  // Coordinates are in PDF points (origin = bottom-left, Y increases upward).
  // Extracted directly from the template's content stream — no scaling applied.
  // Default size 9 matches the template's body text size (/F2 9 Tf).
  function drawText(text: string, x: number, y: number, size = 9) {
    const clean = sanitizeText(text);
    if (!clean) return;
    page.drawText(clean, { x, y, size, font: timesRoman, color: black });
  }

  // ── PERSONAL INFORMATION ─────────────────────────────────────────────────
  // FULL NAME row  y=773.76 | DATE label at x=354.07
  drawText(s(data.fullName), 127, 773.76);
  drawText(s(data.date ? formatDate(data.date) : ''), 383, 773.76);

  // DESIGNATION row  y=761.50 | BASIC PAY label at x=353.11
  drawText(s(data.designation), 123, 761.50);
  drawText(s(data.basicPay), 436, 761.50);

  // NAME OF INSTITUTE row  y=748.18 (value starts after label ending ~x=207)
  const inst = s(data.instituteName);
  if (inst.length > 48) {
    drawText(inst.substring(0, 48), 210, 748.18, 7.5);
    drawText(inst.substring(48, 100), 57, 737.86, 7.5);
  } else {
    drawText(inst, 210, 748.18, 7.5);
  }

  // PAN NO / AADHAR NO row  y=727.54
  drawText(s(data.panNo), 92, 727.54);
  drawText(s(data.aadharNo), 375, 727.54);

  // PHONE NO / EMAIL ID row  y=717.22
  // "PHONE NO: " label at 9pt spans x=54–113; start fill after the label ends.
  drawText(s(data.phoneNo), 115, 717.22);
  drawText(s(data.email), 355, 717.22);

  // PURPOSE: semester  y=706.30  (value fits between "Semester " and ")")
  drawText(s(data.purposeSemester), 450, 706.30);

  // REFERENCE LETTER NO  y=695.98  (overwrites the "--------" placeholder)
  if (data.referenceLetterNo) {
    drawText(s(data.referenceLetterNo), 210, 695.98);
  }

  // ── TA TABLE ─────────────────────────────────────────────────────────────
  // Column x positions derived from extracted header positions.
  const TA_X = {
    date:    52,
    from:   120,
    to:     183,
    dist:   222,
    mode:   278,
    cls:    385,
    fare:   432,
    remark: 500,
  };
  // The template content stream has blank placeholders at exactly 2 Y positions:
  // y=637.78 (row 1) and y=605.62 (row 2), 32.16 pt apart — one row each.
  // Using these confirmed positions ensures each journey maps to its own row.
  const TA_ROW_Y = [637.78, 605.62];

  data.taRows.slice(0, 2).forEach((row, i) => {
    const y = TA_ROW_Y[i];
    drawText(s(row.date ? formatDate(row.date) : row.date), TA_X.date,   y, 7.5);
    drawText(s(row.from),     TA_X.from,   y, 7.5);
    drawText(s(row.to),       TA_X.to,     y, 7.5);
    drawText(s(row.distance), TA_X.dist,   y, 7.5);
    drawText(s(row.mode),     TA_X.mode,   y, 7.5);
    drawText(s(row.class),    TA_X.cls,    y, 7.5);
    drawText(s(row.fare),     TA_X.fare,   y, 7.5);
    drawText(s(row.remark),   TA_X.remark, y, 7.5);
  });

  // ── TOTALS ───────────────────────────────────────────────────────────────
  // Total Rs.(A)  — Total amount column (x≈455), y=583.75
  // Not in the rightmost column (x=481+) which is for other purposes.
  drawText(n(data.taTotal), 455, 583.75);

  // (B) DA  y=557.59 — label row doubles as data row
  drawText(n(data.daDays),  350, 557.59);
  drawText(n(data.daRate),  404, 557.59);
  drawText(n(data.daTotal), 455, 557.59);
  // Total Rs.(B) separate row  y=544.39
  drawText(n(data.daTotal), 455, 544.39);

  // (C) Honorarium  y=517.03
  drawText(n(data.honorariumDays),  350, 517.03);
  drawText(n(data.honorariumRate),  404, 517.03);
  drawText(n(data.honorariumTotal), 455, 517.03);
  // Replace template's "Total Students:" with "Students:" via white overlay.
  // "Total Students:" printed at x=491.14 in content stream (9pt bold, ~68px wide).
  // White rectangle must cover the full original text starting from x=491.
  page.drawRectangle({ x: 491, y: 514, width: 68, height: 11, color: white, borderWidth: 0 });
  page.drawText('Students:', { x: 491, y: 517.03, size: 9, font: timesBold, color: black });
  // Move value left from x=553 to x=535 to add padding before the right border.
  drawText(n(data.totalStudents), 535, 517.03);
  // Restore the horizontal table line connecting to the right border at x=560.28.
  // Original segment: 481.9 512.11 78.384 0.96 re (from x=481.9 to x=560.28 at y=512.11).
  page.drawLine({ start: { x: 481.9, y: 512.59 }, end: { x: 560.28, y: 512.59 }, thickness: 0.96, color: black });
  // Total Rs.(C)  y=503.71
  drawText(n(data.honorariumTotal), 455, 503.71);

  // (D) Accommodation  y=477.67
  drawText(n(data.accommodationDays),  350, 477.67);
  drawText(n(data.accommodationRate),  404, 477.67);
  drawText(n(data.accommodationTotal), 455, 477.67);
  // Total Rs.(D)  y=464.83
  drawText(n(data.accommodationTotal), 455, 464.83);

  // Gross Total (A)+(B)+(C)+(D)  y=451.99
  drawText(n(data.grossTotal), 455, 451.99);

  // ── DECLARATION ──────────────────────────────────────────────────────────
  // Railway class  y=424.61 (blank after "by Railway ")
  drawText(s(data.railwayClass), 241, 424.61);

  // Vehicle no  y=401.33 (blank after "vehicle No. is ")
  drawText(s(data.vehicleNo), 430, 401.33);

  // Advance received  y=352.13 (blank after "received Rs.")
  if (data.advanceReceived) {
    drawText(n(data.advanceReceived), 234, 352.13);
  }

  // Remaining amount / Receipt no / dated  y=341.81
  if (data.remainingAmount) {
    drawText(n(data.remainingAmount), 103, 341.81);
  }
  drawText(s(data.receiptNo), 252, 341.81);
  drawText(s(data.receiptDated ? formatDate(data.receiptDated) : data.receiptDated), 350, 341.81);

  // ── TOP SIGNATURE ────────────────────────────────────────────────────────
  // "Name:" label at x=400.99, y=286.61
  drawText(s(data.signerName || data.fullName), 433, 286.61);

  // ── PASSED FOR PAYMENT ───────────────────────────────────────────────────
  // y=265.13: "Total Rs. ___ (Rupees in words _____ only)"
  drawText(n(data.grossTotal), 176, 265.13);
  const wordsTotal = numberToWords(data.grossTotal);
  drawText(wordsTotal, 300, 265.13, 7);

  // ── RECEIPT SECTION ──────────────────────────────────────────────────────
  // Received Rs.  y=194.42
  drawText(n(data.grossTotal), 108, 194.42);
  const wordsReceipt = numberToWords(data.grossTotal);
  drawText(wordsReceipt, 277, 194.42, 7);

  // Bank details  y=144.02
  drawText(s(data.bankName),   133, 144.02);
  drawText(s(data.branchCode), 260, 144.02);
  drawText(s(data.acType),     506, 144.02);

  // A/c No & IFSC  y=132.14
  drawText(s(data.acNo),     153, 132.14);
  drawText(s(data.ifscCode), 343, 132.14);

  // ── BOTTOM SIGNATURE ─────────────────────────────────────────────────────
  // "Name:" label at x=382.03, y=88.68
  drawText(s(data.signerName || data.fullName), 412, 88.68);

  return await pdfDoc.save();
}

export function downloadPDF(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printPDF(bytes: Uint8Array) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 2000);
  };
}
