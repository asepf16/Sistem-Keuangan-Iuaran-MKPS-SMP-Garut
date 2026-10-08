import { Pengaturan } from '../types';

interface PrintReportOptions {
  title: string;
  subtitle?: string;
  periodText?: string;
  settings: Pengaturan;
  printedBy: string;
  columns: string[];
  rows: (string | number)[][];
  summaryRows?: { label: string; value: string }[];
}

export function printReport(options: PrintReportOptions) {
  const { title, subtitle, periodText, settings, printedBy, columns, rows, summaryRows } = options;

  const now = new Date();
  const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(
    now.getMonth() + 1
  ).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - ${settings.namaOrganisasi}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: Arial, 'Helvetica Neue', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 20px;
      font-size: 11pt;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 15pt;
      font-weight: bold;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header h2 {
      margin: 4px 0;
      font-size: 13pt;
      font-weight: 600;
      color: #0284c7;
      text-transform: uppercase;
    }
    .header p {
      margin: 2px 0;
      font-size: 9pt;
      color: #64748b;
    }
    .report-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      font-size: 10pt;
    }
    .report-meta table td {
      padding: 2px 6px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 20px;
    }
    table.data-table th {
      background-color: #f1f5f9;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      padding: 7px 8px;
      font-size: 9pt;
      text-align: left;
    }
    table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      font-size: 9pt;
    }
    table.data-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .summary-box {
      float: right;
      width: 320px;
      margin-bottom: 30px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 10px;
      border-radius: 4px;
    }
    .summary-box table {
      width: 100%;
      font-size: 9.5pt;
    }
    .summary-box td {
      padding: 3px 0;
    }
    .summary-box td.val {
      text-align: right;
      font-weight: 600;
    }
    .clear { clear: both; }
    .signatures {
      margin-top: 40px;
      width: 100%;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .signature-box {
      width: 250px;
      text-align: center;
      font-size: 10pt;
    }
    .signature-space {
      height: 70px;
    }
    .signature-name {
      font-weight: bold;
      text-decoration: underline;
    }
    .footer-note {
      margin-top: 30px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 6px;
      font-size: 8pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${settings.namaOrganisasi}</h1>
    <h2>${settings.namaAplikasi}</h2>
    <p>${settings.alamat || ''} ${settings.kontak ? ' | ' + settings.kontak : ''}</p>
  </div>

  <div style="text-align: center; margin-bottom: 15px;">
    <h3 style="margin: 0; font-size: 12pt; text-transform: uppercase;">${title}</h3>
    ${subtitle ? `<p style="margin: 2px 0; font-size: 10pt; color: #475569;">${subtitle}</p>` : ''}
    ${periodText ? `<p style="margin: 2px 0; font-size: 9.5pt; font-weight: bold; color: #0284c7;">Periode: ${periodText}</p>` : ''}
  </div>

  <div class="report-meta">
    <div><strong>Dicetak oleh:</strong> ${printedBy}</div>
    <div><strong>Tanggal Cetak:</strong> ${dateFormatted}</div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        ${columns.map((c) => `<th>${c}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `
        <tr>
          ${row.map((cell) => `<td>${cell !== undefined && cell !== null ? cell : '-'}</td>`).join('')}
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  ${
    summaryRows && summaryRows.length > 0
      ? `
    <div class="summary-box">
      <table>
        ${summaryRows
          .map(
            (s) => `
          <tr>
            <td>${s.label}</td>
            <td class="val">${s.value}</td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
    <div class="clear"></div>
  `
      : ''
  }

  <div class="signatures">
    <div class="signature-box">
      <div>Mengetahui,</div>
      <div><strong>Ketua MKPS SMP Kab. Garut</strong></div>
      <div class="signature-space"></div>
      <div class="signature-name">${settings.namaKetua || 'Ketua MKPS'}</div>
      <div>NIP. .....................................</div>
    </div>
    <div class="signature-box">
      <div>Garut, ${dateFormatted.split(' ')[0]}</div>
      <div><strong>Bendahara MKPS SMP Kab. Garut</strong></div>
      <div class="signature-space"></div>
      <div class="signature-name">${settings.namaBendahara || 'Bendahara MKPS'}</div>
      <div>NIP. .....................................</div>
    </div>
  </div>

  <div class="footer-note">
    <span>Dokumen ini dicetak secara otomatis melalui Sistem Keuangan Iuran MKPS SMP Garut.</span>
    <span>Halaman 1/1</span>
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
