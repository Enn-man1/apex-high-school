// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── School branding ───────────────────────────────────────
const SCHOOL_NAME    = 'Apex High School';
const SCHOOL_ADDRESS = '123 Education Lane, Abuja, Nigeria';
const SCHOOL_EMAIL   = 'info@apexhighschool.edu.ng';
const SCHOOL_PHONE   = '+234 800 123 4567';
const SCHOOL_MOTTO   = 'Excellence · Integrity · Innovation';
const PRIMARY_COLOR  = [13, 27, 62];    // #0D1B3E navy
const ACCENT_COLOR   = [245, 166, 35];  // #F5A623 gold

// ── Helper: draw header on every page ───────────────────
const drawHeader = (doc, title, subtitle = '') => {
  const pageW = doc.internal.pageSize.getWidth();

  // Navy header background
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageW, 42, 'F');

  // Gold accent bar
  doc.setFillColor(...ACCENT_COLOR);
  doc.rect(0, 42, pageW, 3, 'F');

  // School name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(SCHOOL_NAME, 14, 16);

  // Motto
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 230);
  doc.text(SCHOOL_MOTTO, 14, 23);

  // Contact info on right
  doc.setFontSize(7.5);
  doc.setTextColor(180, 195, 220);
  doc.text(SCHOOL_ADDRESS, pageW - 14, 12, { align: 'right' });
  doc.text(SCHOOL_EMAIL,   pageW - 14, 18, { align: 'right' });
  doc.text(SCHOOL_PHONE,   pageW - 14, 24, { align: 'right' });

  // Document title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), 14, 36);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 210, 230);
    doc.text(subtitle, 14, 41);
  }

  return 52; // y position after header
};

// ── Helper: draw footer ──────────────────────────────────
const drawFooter = (doc) => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(...ACCENT_COLOR);
    doc.setLineWidth(0.5);
    doc.line(14, pageH - 18, pageW - 14, pageH - 18);

    // Footer text
    doc.setFontSize(7.5);
    doc.setTextColor(150, 160, 180);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${SCHOOL_NAME} · Generated on ${new Date().toLocaleDateString('en-NG', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`,
      14, pageH - 10
    );
    doc.text(`Page ${i} of ${pages}`, pageW - 14, pageH - 10, { align: 'right' });
  }
};

// ── Helper: info box ─────────────────────────────────────
const drawInfoBox = (doc, items, startY) => {
  const pageW = doc.internal.pageSize.getWidth();
  const cols  = 2;
  const colW  = (pageW - 28) / cols;
  const rowH  = 9;
  let x = 14, y = startY;

  // Box background
  doc.setFillColor(245, 247, 252);
  doc.roundedRect(14, y - 6, pageW - 28, Math.ceil(items.length / cols) * rowH + 8, 3, 3, 'F');

  doc.setFontSize(9);
  items.forEach((item, i) => {
    if (i > 0 && i % cols === 0) {
      y += rowH;
      x  = 14;
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`${item.label}:`, x + 4, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 80, 110);
    doc.text(String(item.value || '—'), x + colW * 0.45, y);

    x += colW;
  });

  return y + rowH + 4;
};

// ── GENERATE RESULT SLIP — TABULAR ───────────────────────
export const generateResultPDF = (student, grades, term = 'Third Term 2025') => {
  const doc   = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  let y = drawHeader(doc, 'Student Result Slip', term);

  const SUBJECTS   = ['Mathematics','English Language','Biology','Chemistry','Physics','History','Geography','Economics'];
  const EXAM_TYPES = ['CA1','CA2','Mid-Term','Exam','Final'];

  const avgScore = grades.length
    ? Math.round(grades.reduce((s,g) => s+Number(g.score||0),0)/grades.length)
    : 0;

  const getGrade  = s => s>=80?'A':s>=70?'B':s>=60?'C':s>=50?'D':'F';
  const getRemark = s => s>=80?'Excellent':s>=70?'Very Good':s>=60?'Good':s>=50?'Pass':'Fail';
  const getColor  = s => s>=80?[39,174,96]:s>=70?[67,97,238]:s>=60?[32,201,151]:s>=50?[245,166,35]:[230,57,70];

  // Student info box
  y = drawInfoBox(doc, [
    { label:'Student Name',   value:student.name        },
    { label:'Admission No',   value:student.admissionNo },
    { label:'Class',          value:student.className   },
    { label:'Term',           value:term                },
    { label:'Academic Year',  value:'2024/2025'         },
    { label:'Date Printed',   value:new Date().toLocaleDateString('en-NG') },
  ], y);

  y += 6;

  // Build subject map
  const bySubject = {};
  grades.forEach(g => {
    if (!bySubject[g.subject]) bySubject[g.subject] = {};
    bySubject[g.subject][g.examType] = Number(g.score || 0);
  });

  // Build table rows
  const activeSubjects = SUBJECTS.filter(sub => bySubject[sub]);
  const tableHead = [['#','Subject', ...EXAM_TYPES, 'Average','Grade','Remark']];
  const tableBody = activeSubjects.map((sub, i) => {
    const scores = EXAM_TYPES.map(et => bySubject[sub]?.[et] || null);
    const filled = scores.filter(v => v !== null && v > 0);
    const avg    = filled.length ? Math.round(filled.reduce((a,b)=>a+b,0)/filled.length) : null;
    return [
      i + 1,
      sub,
      ...scores.map(v => v !== null ? v : '—'),
      avg !== null ? `${avg}%` : '—',
      avg !== null ? getGrade(avg)  : '—',
      avg !== null ? getRemark(avg) : '—',
    ];
  });

  // Overall row
  tableBody.push([
    '', 'OVERALL AVERAGE',
    ...EXAM_TYPES.map(() => ''),
    `${avgScore}%`,
    getGrade(avgScore),
    getRemark(avgScore),
  ]);

  autoTable(doc, {
    startY:   y,
    head:     tableHead,
    body:     tableBody,
    theme:    'grid',
    headStyles: {
      fillColor:   PRIMARY_COLOR,
      textColor:   [255,255,255],
      fontSize:    9,
      fontStyle:   'bold',
      cellPadding: 4,
      halign:      'center',
    },
    bodyStyles: {
      fontSize:    9,
      cellPadding: 4,
      textColor:   [40,55,80],
      halign:      'center',
    },
    columnStyles: {
      0: { cellWidth:8,  halign:'center' },
      1: { cellWidth:42, halign:'left',  fontStyle:'bold' },
      2: { cellWidth:18 },
      3: { cellWidth:18 },
      4: { cellWidth:20 },
      5: { cellWidth:18 },
      6: { cellWidth:18 },
      7: { cellWidth:20, fontStyle:'bold' },
      8: { cellWidth:16, fontStyle:'bold' },
      9: { cellWidth:24 },
    },
    alternateRowStyles: { fillColor:[245,247,252] },
    didParseCell: (data) => {
      // Color grade column
      if (data.column.index === 8 && data.section==='body') {
        const g = data.cell.text[0];
        data.cell.styles.textColor = g==='A'?[39,174,96]:g==='B'?[67,97,238]:g==='C'?[32,201,151]:g==='D'?[245,166,35]:g==='F'?[230,57,70]:[40,55,80];
        data.cell.styles.fontStyle = 'bold';
      }
      // Color score cells
      if (data.column.index >= 2 && data.column.index <= 6 && data.section==='body') {
        const val = Number(data.cell.text[0]);
        if (!isNaN(val) && data.cell.text[0] !== '—') {
          data.cell.styles.textColor = getColor(val);
          data.cell.styles.fontStyle = 'bold';
        }
      }
      // Overall row style
      if (data.row.index === activeSubjects.length && data.section==='body') {
        data.cell.styles.fillColor  = PRIMARY_COLOR;
        data.cell.styles.textColor  = [255,255,255];
        data.cell.styles.fontStyle  = 'bold';
      }
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  // Summary box
  doc.setFillColor(...PRIMARY_COLOR);
  doc.roundedRect(14, y, pageW-28, 22, 3, 3, 'F');
  [
    { label:'Overall Average', value:`${avgScore}%`,         x:22  },
    { label:'Overall Grade',   value:getGrade(avgScore),     x:90  },
    { label:'Remark',          value:getRemark(avgScore),    x:140 },
    { label:'Subjects Taken',  value:`${activeSubjects.length}`, x:200 },
  ].forEach(item => {
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(180,200,230);
    doc.text(item.label, item.x, y+9);
    doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(245,166,35);
    doc.text(item.value, item.x, y+18);
  });

  drawFooter(doc);
  doc.save(`${student.name}_Result_${term.replace(/\s+/g,'_')}.pdf`);
};

// ── GENERATE FEE RECEIPT ─────────────────────────────────
export const generateFeeReceiptPDF = (fee, student) => {
  const doc   = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  let y = drawHeader(doc, 'School Fee Receipt', `Receipt No: AHS-${Date.now().toString().slice(-8)}`);

  // PAID watermark
  if (fee.status === 'paid') {
    doc.setTextColor(39, 174, 96);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.setGState(doc.GState({ opacity: 0.08 }));
    doc.text('PAID', pageW / 2, 180, { align: 'center', angle: 35 });
    doc.setGState(doc.GState({ opacity: 1 }));
  }

  // Receipt details box
  y = drawInfoBox(doc, [
    { label: 'Receipt No',   value: `AHS-${Date.now().toString().slice(-8)}` },
    { label: 'Date Issued',  value: new Date().toLocaleDateString('en-NG', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) },
    { label: 'Student Name', value: fee.studentName || student?.name || '—' },
    { label: 'Class',        value: fee.className   || student?.className || '—' },
    { label: 'Admission No', value: student?.admissionNo || '—' },
    { label: 'Term',         value: fee.term || '—' },
  ], y);

  y += 8;

  // Payment details title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('PAYMENT DETAILS', 14, y);
  y += 6;

  // Payment table
  autoTable(doc, {
    startY: y,
    head:   [['Description', 'Fee Type', 'Amount (₦)', 'Status']],
    body:   [[
      fee.description || `${fee.feeType} Payment`,
      fee.feeType || '—',
      Number(fee.amount || 0).toLocaleString(),
      fee.status === 'paid' ? 'PAID' : 'PENDING',
    ]],
    theme: 'grid',
    headStyles: {
      fillColor:   PRIMARY_COLOR,
      textColor:   [255, 255, 255],
      fontSize:    9,
      fontStyle:   'bold',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize:    10,
      cellPadding: 6,
      textColor:   [40, 55, 80],
    },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 30, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.column.index === 3 && data.section === 'body') {
        const status = data.cell.text[0];
        data.cell.styles.textColor  = status === 'PAID' ? [39, 174, 96] : [230, 57, 70];
        data.cell.styles.fontStyle  = 'bold';
      }
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  // Total box
  doc.setFillColor(...PRIMARY_COLOR);
  doc.roundedRect(pageW - 90, y, 76, 22, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 230);
  doc.text('TOTAL AMOUNT PAID', pageW - 86, y + 8);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 166, 35);
  doc.text(`₦${Number(fee.amount || 0).toLocaleString()}`, pageW - 86, y + 18);

  y += 32;

  // Payment method & transaction info
  if (fee.paidDate || fee.txRef || fee.paymentMethod) {
    doc.setFillColor(240, 250, 244);
    doc.roundedRect(14, y, pageW - 28, 22, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(39, 174, 96);
    doc.text('✓  PAYMENT CONFIRMED', 20, y + 9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 100, 80);
    const details = [
      fee.paidDate     && `Date: ${fee.paidDate}`,
      fee.paymentMethod && `Method: ${fee.paymentMethod}`,
      fee.txRef        && `Ref: ${fee.txRef}`,
    ].filter(Boolean).join('   ·   ');
    doc.text(details, 20, y + 17);
    y += 30;
  }

  // Official stamp area
  y += 8;
  doc.setFillColor(248, 249, 253);
  doc.roundedRect(14, y, pageW - 28, 36, 3, 3, 'F');
  doc.setDrawColor(...ACCENT_COLOR);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, pageW - 28, 36, 3, 3, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Received By (Accounts):', 22, y + 10);
  doc.text('Date:', pageW / 2 + 10, y + 10);
  doc.setDrawColor(180, 190, 210);
  doc.setLineWidth(0.3);
  doc.line(22, y + 22, 22 + 70, y + 22);
  doc.line(pageW / 2 + 20, y + 22, pageW - 22, y + 22);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 160, 180);
  doc.text(
    'This receipt is an official document of Apex High School. Please keep it for your records.',
    pageW / 2, y + 32, { align: 'center' }
  );

  drawFooter(doc);
  doc.save(`Fee_Receipt_${fee.studentName?.replace(/\s+/g,'_')}_${fee.feeType?.replace(/\s+/g,'_')}.pdf`);
};

// ── GENERATE REPORT CARD — TABULAR ───────────────────────
export const generateReportCard = (student, grades, attendance, term='Third Term 2025') => {
  const doc   = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  let y = drawHeader(doc, 'Student Report Card', term);

  const SUBJECTS   = ['Mathematics','English Language','Biology','Chemistry','Physics','History','Geography','Economics'];
  const EXAM_TYPES = ['CA1','CA2','Mid-Term','Exam','Final'];

  const avgScore = grades.length
    ? Math.round(grades.reduce((s,g)=>s+Number(g.score||0),0)/grades.length)
    : 0;

  const attRate = attendance?.length
    ? Math.round((attendance.filter(a=>a.status==='present').length/attendance.length)*100)
    : 0;

  const getGrade  = s => s>=80?'A':s>=70?'B':s>=60?'C':s>=50?'D':'F';
  const getRemark = s => s>=80?'Excellent':s>=70?'Very Good':s>=60?'Good':s>=50?'Pass':'Fail';
  const getColor  = s => s>=80?[39,174,96]:s>=70?[67,97,238]:s>=60?[32,201,151]:s>=50?[245,166,35]:[230,57,70];

  // Student info
  y = drawInfoBox(doc, [
    { label:'Student Name',    value:student.name        },
    { label:'Admission No',    value:student.admissionNo },
    { label:'Class',           value:student.className   },
    { label:'Term',            value:term                },
    { label:'Attendance Rate', value:`${attRate}%`       },
    { label:'Date Printed',    value:new Date().toLocaleDateString('en-NG') },
  ], y);

  y += 6;

  // Build subject map
  const bySubject = {};
  grades.forEach(g => {
    if (!bySubject[g.subject]) bySubject[g.subject] = {};
    bySubject[g.subject][g.examType] = Number(g.score || 0);
  });

  const activeSubjects = SUBJECTS.filter(sub => bySubject[sub]);

  // Table
  const tableHead = [['#', 'Subject', ...EXAM_TYPES, 'Average', 'Grade', 'Remark']];
  const tableBody = activeSubjects.map((sub, i) => {
    const scores = EXAM_TYPES.map(et => bySubject[sub]?.[et] || null);
    const filled = scores.filter(v => v !== null && v > 0);
    const avg    = filled.length ? Math.round(filled.reduce((a,b)=>a+b,0)/filled.length) : null;
    return [
      i + 1,
      sub,
      ...scores.map(v => v !== null ? v : '—'),
      avg !== null ? `${avg}%` : '—',
      avg !== null ? getGrade(avg)  : '—',
      avg !== null ? getRemark(avg) : '—',
    ];
  });

  tableBody.push([
    '', 'OVERALL AVERAGE',
    ...EXAM_TYPES.map(() => ''),
    `${avgScore}%`,
    getGrade(avgScore),
    getRemark(avgScore),
  ]);

  autoTable(doc, {
    startY:   y,
    head:     tableHead,
    body:     tableBody,
    theme:    'grid',
    headStyles: {
      fillColor:   PRIMARY_COLOR,
      textColor:   [255,255,255],
      fontSize:    9,
      fontStyle:   'bold',
      cellPadding: 4,
      halign:      'center',
    },
    bodyStyles: {
      fontSize:    9,
      cellPadding: 4,
      textColor:   [40,55,80],
      halign:      'center',
    },
    columnStyles: {
      0: { cellWidth:8,  halign:'center' },
      1: { cellWidth:42, halign:'left', fontStyle:'bold' },
      2: { cellWidth:18 },
      3: { cellWidth:18 },
      4: { cellWidth:20 },
      5: { cellWidth:18 },
      6: { cellWidth:18 },
      7: { cellWidth:20, fontStyle:'bold' },
      8: { cellWidth:16, fontStyle:'bold' },
      9: { cellWidth:24 },
    },
    alternateRowStyles: { fillColor:[245,247,252] },
    didParseCell: (data) => {
      if (data.column.index===8 && data.section==='body') {
        const g = data.cell.text[0];
        data.cell.styles.textColor = g==='A'?[39,174,96]:g==='B'?[67,97,238]:g==='C'?[32,201,151]:g==='D'?[245,166,35]:g==='F'?[230,57,70]:[40,55,80];
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.column.index>=2 && data.column.index<=6 && data.section==='body') {
        const val = Number(data.cell.text[0]);
        if (!isNaN(val) && data.cell.text[0]!=='—') {
          data.cell.styles.textColor = getColor(val);
          data.cell.styles.fontStyle = 'bold';
        }
      }
      if (data.row.index===activeSubjects.length && data.section==='body') {
        data.cell.styles.fillColor = PRIMARY_COLOR;
        data.cell.styles.textColor = [255,255,255];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  // Summary + attendance
  doc.setFillColor(...PRIMARY_COLOR);
  doc.roundedRect(14, y, pageW-28, 22, 3, 3, 'F');
  [
    { label:'Overall Average', value:`${avgScore}%`,         x:22  },
    { label:'Grade',           value:getGrade(avgScore),     x:90  },
    { label:'Remark',          value:getRemark(avgScore),    x:140 },
    { label:'Attendance Rate', value:`${attRate}%`,          x:200 },
    { label:'Subjects Taken',  value:`${activeSubjects.length}`, x:240 },
  ].forEach(item => {
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(180,200,230);
    doc.text(item.label, item.x, y+9);
    doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(245,166,35);
    doc.text(item.value, item.x, y+18);
  });

  drawFooter(doc);
  doc.save(`${student.name}_Report_Card_${term.replace(/\s+/g,'_')}.pdf`);
};