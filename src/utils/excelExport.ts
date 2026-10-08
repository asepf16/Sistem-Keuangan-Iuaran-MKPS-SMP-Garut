import * as XLSX from 'xlsx';

/**
 * Export generic array of data objects to an Excel (.xlsx) file
 */
export function exportToExcel(data: Record<string, any>[], fileName: string, sheetName = 'Data') {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor ke Excel');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
