import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Document, ExcelSheet } from '../types';
import { ArrowLeft, Download, FileText, Table, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  downloadSearchResultsAsExcel, 
  downloadSearchResultsAsPDF,
  downloadSheetAsExcel,
  downloadSheetAsPDF 
} from '../utils/downloadUtils';
import { Document as PDFViewerDocument, Page, pdfjs } from 'react-pdf';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min?worker&url';
import { PDFDocument } from 'pdf-lib';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface DocumentViewerProps {
  currentDocument: Document;
  onBack: () => void;
  allDocuments: Document[];
}

const ROWS_PER_PAGE = 50; // Pagination for large datasets

// Tambahkan kembali komponen PaginationControls
const PaginationControls = ({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {/* Page numbers */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
          if (pageNum > totalPages) return null;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1 text-sm rounded ${
                pageNum === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ currentDocument, onBack }) => {
  const [activeSheet, setActiveSheet] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]); // halaman yang cocok
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfTextPerPage, setPdfTextPerPage] = useState<string[]>([]);
  const [excelSearchResults, setExcelSearchResults] = useState<any[]>([]);

  // Untuk Excel tetap
  const currentSheetData = useMemo(() => {
    if (!currentDocument.sheets || currentDocument.sheets.length === 0) return [];
    return currentDocument.sheets[activeSheet]?.data || [];
  }, [currentDocument.sheets, activeSheet]);

  // Paginated data for large sheets
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const endIndex = startIndex + ROWS_PER_PAGE;
    return currentSheetData.slice(startIndex, endIndex);
  }, [currentSheetData, currentPage]);

  // PDF: Ambil teks per halaman saat PDF dimuat
  const onDocumentLoadSuccess = useCallback(async (pdf: any) => {
    setNumPages(pdf.numPages);
    const textPromises = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      textPromises.push(pdf.getPage(i).then((page: any) => page.getTextContent().then((tc: any) => tc.items.map((it: any) => it.str).join(' '))));
    }
    const allText = await Promise.all(textPromises);
    setPdfTextPerPage(allText);
  }, []);

  // PDF: Search seluruh halaman
  const handlePDFSearch = useCallback(() => {
    if (!searchQuery.trim() || pdfTextPerPage.length === 0) return;
    setIsSearching(true);
    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const foundPages: number[] = [];
      pdfTextPerPage.forEach((text, idx) => {
        if (text.toLowerCase().includes(query)) {
          foundPages.push(idx + 1); // halaman dimulai dari 1
        }
      });
      setSearchResults(foundPages);
      setShowSearchResults(true);
      setIsSearching(false);
    }, 100);
  }, [searchQuery, pdfTextPerPage]);

  // PDF: Download hasil pencarian sebagai PDF baru (hanya halaman hasil)
  const handleDownloadPDFSearchResults = useCallback(async () => {
    if (!currentDocument.url || searchResults.length === 0) return;
    const existingPdfBytes = await fetch(currentDocument.url).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const newPdf = await PDFDocument.create();
    for (const pageNum of searchResults) {
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
      newPdf.addPage(copiedPage);
    }
    const newPdfBytes = await newPdf.save();
    const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentDocument.name}-search-results.pdf`;
    link.click();
  }, [currentDocument, searchResults]);

  const totalPages = Math.ceil(currentSheetData.length / ROWS_PER_PAGE);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || currentDocument.type !== 'excel' || !currentDocument.sheets) return;
    setIsSearching(true);
    setTimeout(() => {
      const results: any[] = [];
      const queryLower = searchQuery.toLowerCase();
      if (!currentDocument.sheets) return;
      currentDocument.sheets.forEach((sheet, sheetIdx) => {
        sheet.data.forEach((row, rowIndex) => {
          Object.entries(row).forEach(([column, value]) => {
            const valueStr = String(value).toLowerCase();
            if (valueStr.includes(queryLower)) {
              results.push({
                sheet: sheet.name,
                row: rowIndex + 1,
                column,
                value,
                matchText: searchQuery
              });
            }
          });
        });
      });
      setExcelSearchResults(results);
      setShowSearchResults(true);
      setIsSearching(false);
    }, 100);
  }, [searchQuery, currentDocument]);

  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query) return text;
    const parts = String(text).split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-yellow-400 text-red-700 font-bold px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  }, []);

  const handleDownloadSearchResults = useCallback((format: 'excel' | 'pdf') => {
    if (excelSearchResults.length === 0) return;

    if (format === 'excel') {
      downloadSearchResultsAsExcel(
        excelSearchResults,
        searchQuery,
        currentDocument.name
      );
    } else {
      downloadSearchResultsAsPDF(
        excelSearchResults,
        searchQuery,
        currentDocument.name
      );
    }
  }, [excelSearchResults, searchQuery, currentDocument]);

  const handleDownloadSheet = useCallback((format: 'excel' | 'pdf') => {
    if (currentSheetData.length === 0) return;

    const currentSheet = currentDocument.sheets?.[activeSheet];
    if (!currentSheet) return;

    if (format === 'excel') {
      downloadSheetAsExcel(currentSheetData, currentSheet.name, currentDocument.name);
    } else {
      downloadSheetAsPDF(currentSheetData, currentSheet.name, currentDocument.name);
    }
  }, [currentSheetData, currentDocument, activeSheet]);

  // PDF Viewer UI
  const renderPDFViewer = () => (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cari di PDF</h3>
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handlePDFSearch()}
              placeholder="Cari kata/frasa di PDF..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90"
            />
          </div>
          <button
            onClick={handlePDFSearch}
            disabled={!searchQuery.trim() || isSearching}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center shadow-lg shadow-blue-500/25"
          >
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? 'Mencari...' : 'Cari'}
          </button>
        </div>
      </div>
      {/* Search Results */}
      {showSearchResults && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Hasil pencarian "{searchQuery}" ({searchResults.length} halaman ditemukan)
              </h3>
              <button
                onClick={() => setShowSearchResults(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {searchResults.length > 0 && (
              <button
                onClick={handleDownloadPDFSearchResults}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm shadow-lg shadow-red-500/25"
              >
                <Download className="h-4 w-4 mr-1" />
                Download PDF Hasil
              </button>
            )}
          </div>
          {searchResults.length > 0 ? (
            <div className="p-6 flex flex-wrap gap-2">
              {searchResults.map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'} hover:bg-blue-100`}
                >
                  Halaman {pageNum}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-600">Tidak ditemukan hasil di PDF.</div>
          )}
        </div>
      )}
      {/* PDF Viewer */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-8 flex flex-col items-center">
        <PDFViewerDocument
          file={currentDocument.url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div>Memuat PDF...</div>}
          error={<div className="text-red-600">Gagal memuat PDF.</div>}
        >
          <Page pageNumber={currentPage} width={800} loading={<div>Memuat halaman...</div>} />
        </PDFViewerDocument>
        <div className="flex items-center space-x-4 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span>Halaman {currentPage} dari {numPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
            disabled={currentPage === numPages}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderExcelViewer = () => {
    if (!currentDocument.sheets || currentDocument.sheets.length === 0) {
      return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-8">
          <div className="text-center">
            <Table className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No sheets available</p>
          </div>
        </div>
      );
    }

    const currentSheet = currentDocument.sheets[activeSheet];
    
    return (
      <div className="space-y-6">
        {/* Search Interface */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search in Document</h3>
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for data in this document..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center shadow-lg shadow-blue-500/25"
            >
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Search Results */}
        {showSearchResults && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Search Results for "{searchQuery}" ({excelSearchResults.length} found)
                  </h3>
                  <button
                    onClick={() => setShowSearchResults(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {excelSearchResults.length > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownloadSearchResults('excel')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm shadow-lg shadow-green-500/25"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Excel
                    </button>
                    <button
                      onClick={() => handleDownloadSearchResults('pdf')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm shadow-lg shadow-red-500/25"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download PDF
                    </button>
                  </div>
                )}
              </div>
            </div>

            {excelSearchResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sheet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {excelSearchResults.map((result, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{result.sheet}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{result.row}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{result.column}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{highlightMatch(String(result.value), result.matchText)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600">
                  No data found matching "{searchQuery}". Try different search terms.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Excel Sheet Viewer */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
          {/* Sheet Tabs and Download Options */}
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2 overflow-x-auto">
                {currentDocument.sheets.map((sheet, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setActiveSheet(index);
                      setCurrentPage(1); // Reset pagination when switching sheets
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                      activeSheet === index
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {sheet.name} ({sheet.data.length} rows)
                  </button>
                ))}
              </div>
              
              {/* Download Current Sheet */}
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleDownloadSheet('excel')}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm shadow-lg shadow-green-500/25"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Excel
                </button>
                <button
                  onClick={() => handleDownloadSheet('pdf')}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm shadow-lg shadow-red-500/25"
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                <tr>
                  {currentSheetData.length > 0 && currentSheetData[0] && Object.keys(currentSheetData[0]).map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-blue-50 transition-colors" id={`data-row-${currentSheet.name}-${rowIndex + 1}`}>
                    {Object.values(row).map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {currentSheetData.length === 0 ? (
            <div className="p-8 text-center">
              <Table className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No data available in this sheet</p>
            </div>
          ) : (
            <PaginationControls 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-white/60 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {currentDocument.name}
            </h1>
            <p className="text-sm text-gray-500">
              {currentDocument.type.toUpperCase()} • {new Date(currentDocument.uploadDate).toLocaleDateString()}
              {currentDocument.type === 'excel' && currentDocument.sheets && (
                <span className="ml-2">
                  • {currentDocument.sheets.length} sheet{currentDocument.sheets.length > 1 ? 's' : ''}
                  • {currentDocument.sheets.reduce((total, sheet) => total + sheet.data.length, 0)} total rows
                </span>
              )}
            </p>
          </div>
        </div>
        
        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center shadow-lg shadow-blue-500/25">
          <Download className="h-4 w-4 mr-2" />
          Download Original
        </button>
      </div>

      {/* Content */}
      {(
        currentDocument.type === 'pdf' ||
        currentDocument.name.toLowerCase().endsWith('.pdf') ||
        currentDocument.name.toLowerCase().endsWith('.pdf.tmp')
      )
        ? renderPDFViewer()
        : currentDocument.type === 'excel' ||
          currentDocument.name.toLowerCase().endsWith('.xlsx') ||
          currentDocument.name.toLowerCase().endsWith('.xls')
        ? renderExcelViewer()
        : <div className="p-8 text-center text-red-600">Tipe file tidak dikenali.</div>
      }
    </div>
  );
};