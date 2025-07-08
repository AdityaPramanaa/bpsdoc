import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface SearchResultRow {
  _sheetName: string;
  _rowIndex: number;
  [key: string]: any;
}

export const downloadSearchResultsAsExcel = (
  searchResults: SearchResultRow[],
  searchQuery: string,
  documentName: string
) => {
  if (searchResults.length === 0) return;

  // Prepare data for Excel
  const excelData = searchResults.map((row, index) => {
    const { _sheetName, _rowIndex, ...cleanRow } = row;
    return {
      'No.': index + 1,
      'Source Sheet': _sheetName,
      'Original Row': _rowIndex,
      ...cleanRow
    };
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better formatting
  const columnWidths = Object.keys(excelData[0] || {}).map(key => ({
    wch: Math.max(key.length, 15) // Minimum width of 15 characters
  }));
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  const sheetName = `Search Results - ${searchQuery}`;
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Search_Results_${searchQuery}_${documentName}_${timestamp}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, filename);
};

export const downloadSearchResultsAsPDF = (
  searchResults: SearchResultRow[],
  searchQuery: string,
  documentName: string
) => {
  if (searchResults.length === 0) return;

  // Create PDF document
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better table display

  // Add title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Search Results Report', 14, 20);

  // Add search details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Search Query: "${searchQuery}"`, 14, 30);
  doc.text(`Document: ${documentName}`, 14, 37);
  doc.text(`Results Found: ${searchResults.length}`, 14, 44);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 51);

  // Prepare table data
  const { _sheetName, _rowIndex, ...sampleRow } = searchResults[0];
  const headers = ['No.', 'Source Sheet', 'Original Row', ...Object.keys(sampleRow)];
  
  const tableData = searchResults.map((row, index) => {
    const { _sheetName, _rowIndex, ...cleanRow } = row;
    return [
      index + 1,
      _sheetName,
      _rowIndex,
      ...Object.values(cleanRow).map(value => String(value))
    ];
  });

  // Add table using autoTable
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 60,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue header
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Light gray for alternate rows
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 }, // No. column
      1: { cellWidth: 25 }, // Source Sheet column
      2: { halign: 'center', cellWidth: 20 }, // Original Row column
    },
    margin: { top: 60, left: 14, right: 14 },
    tableWidth: 'auto',
    theme: 'striped',
  });

  // Generate filename and download
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Search_Results_${searchQuery}_${documentName}_${timestamp}.pdf`;
  
  doc.save(filename);
};

export const downloadSheetAsExcel = (
  sheetData: any[],
  sheetName: string,
  documentName: string
) => {
  if (sheetData.length === 0) return;

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sheetData);

  // Set column widths
  const columnWidths = Object.keys(sheetData[0] || {}).map(key => ({
    wch: Math.max(key.length, 12)
  }));
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate filename and download
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${sheetName}_${documentName}_${timestamp}.xlsx`;
  
  XLSX.writeFile(workbook, filename);
};

export const downloadSheetAsPDF = (
  sheetData: any[],
  sheetName: string,
  documentName: string
) => {
  if (sheetData.length === 0) return;

  const doc = new jsPDF('l', 'mm', 'a4');

  // Add title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${sheetName} - ${documentName}`, 14, 20);

  // Add details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Records: ${sheetData.length}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 37);

  // Prepare table data
  const headers = Object.keys(sheetData[0]);
  const tableData = sheetData.map(row => 
    Object.values(row).map(value => String(value))
  );

  // Add table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 45,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [34, 197, 94], // Green header
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 45, left: 14, right: 14 },
    tableWidth: 'auto',
    theme: 'striped',
  });

  // Generate filename and download
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${sheetName}_${documentName}_${timestamp}.pdf`;
  
  doc.save(filename);
};