import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Document, ExcelSheet } from '../types';
import { ArrowLeft, Download, FileText, Table, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  downloadSearchResultsAsExcel, 
  downloadSearchResultsAsPDF,
  downloadSheetAsExcel,
  downloadSheetAsPDF 
} from '../utils/downloadUtils';
import { PDFDocument } from 'pdf-lib';

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
  const [excelSearchResults, setExcelSearchResults] = useState<any[]>([]);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);

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

  // Fungsi untuk memastikan URL PDF Cloudinary benar
  const getPdfUrl = (doc: Document) => {
    if (!doc.url) return '';
    
    // Pastikan URL menggunakan format yang benar untuk PDF
    let url = doc.url;
    
    // Jika resource_type adalah image, ubah ke raw
    if (doc.resource_type === 'image') {
      url = url.replace('/image/upload/', '/raw/upload/');
    }
    
    // Pastikan URL menggunakan HTTPS
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }
    
    // Hapus parameter yang mungkin menyebabkan masalah
    url = url.split('?')[0];
    
    // Tambahkan parameter untuk memastikan PDF ditampilkan dengan benar
    url += '?fl_attachment';
    
    console.log('PDF URL:', url);
    return url;
  };

  // PDF Viewer UI
  const renderPDFViewer = () => (
    <div className="space-y-6">
      {/* Document Info Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{currentDocument.name}</h3>
              <p className="text-sm text-gray-600">
                PDF • {new Date(currentDocument.uploadDate).toLocaleDateString('id-ID')} • 
                {(currentDocument.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(getPdfUrl(currentDocument));
                alert('URL PDF telah disalin ke clipboard!');
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Salin URL
            </button>
            <button
              onClick={() => {
                const shareData = {
                  title: currentDocument.name,
                  text: `Lihat dokumen: ${currentDocument.name}`,
                  url: getPdfUrl(currentDocument)
                };
                if (navigator.share) {
                  navigator.share(shareData);
                } else {
                  navigator.clipboard.writeText(getPdfUrl(currentDocument));
                  alert('URL telah disalin ke clipboard!');
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Bagikan
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          {/* PDF Viewer Options */}
          <div className="mb-6 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => window.open(getPdfUrl(currentDocument), '_blank')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Buka di Tab Baru
            </button>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = getPdfUrl(currentDocument);
                link.download = currentDocument.name;
                link.click();
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
          </div>
          
          {/* PDF iframe viewer with error handling */}
          <div className="w-full">
            <div className="relative">
              {pdfLoading && (
                <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600">Memuat PDF...</p>
                  </div>
                </div>
              )}
              
              <iframe
                src={`${getPdfUrl(currentDocument)}#toolbar=1&navpanes=1&scrollbar=1`}
                width="100%"
                height="600"
                className="border border-gray-300 rounded-lg shadow-lg"
                title="PDF Viewer"
                onLoad={() => {
                  console.log('PDF iframe loaded successfully');
                  setPdfLoading(false);
                  setPdfError(false);
                }}
                onError={() => {
                  console.error('PDF iframe failed to load');
                  setPdfLoading(false);
                  setPdfError(true);
                }}
                sandbox="allow-same-origin allow-scripts allow-forms"
              />
              
              {pdfError && (
                <div className="absolute inset-0 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="text-red-600 text-lg font-medium mb-2">PDF tidak dapat dimuat</div>
                    <p className="text-red-500 text-sm">Coba gunakan tombol alternatif di bawah</p>
                  </div>
                </div>
              )}
              
              {/* Fallback message */}
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>Jika PDF tidak tampil, gunakan tombol "Buka di Tab Baru" di atas.</p>
                <p className="mt-2 text-xs text-gray-500">
                  URL: {getPdfUrl(currentDocument)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Alternative viewer options */}
          <div className="mt-6 text-center">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Alternatif Lain:</h4>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => {
                  const url = getPdfUrl(currentDocument);
                  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
                  window.open(googleViewerUrl, '_blank');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Buka dengan Google Viewer
              </button>
              <button
                onClick={() => {
                  const url = getPdfUrl(currentDocument);
                  const pdfjsViewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`;
                  window.open(pdfjsViewerUrl, '_blank');
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Buka dengan PDF.js Viewer
              </button>
            </div>
          </div>
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
        {/* Document Info Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Table className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentDocument.name}</h3>
                <p className="text-sm text-gray-600">
                  Excel • {new Date(currentDocument.uploadDate).toLocaleDateString('id-ID')} • 
                  {currentDocument.sheets?.length || 0} sheet{currentDocument.sheets?.length !== 1 ? 's' : ''} • 
                  {currentDocument.sheets?.reduce((total, sheet) => total + sheet.data.length, 0) || 0} total rows
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const data = {
                    filename: currentDocument.name,
                    sheets: currentDocument.sheets?.map(sheet => ({
                      name: sheet.name,
                      data: sheet.data
                    }))
                  };
                  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                  alert('Data Excel telah disalin ke clipboard!');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Salin Data
              </button>
              <button
                onClick={() => {
                  const url = getPdfUrl(currentDocument);
                  const shareData = {
                    title: currentDocument.name,
                    text: `Lihat dokumen Excel: ${currentDocument.name}`,
                    url: url
                  };
                  if (navigator.share) {
                    navigator.share(shareData);
                  } else {
                    navigator.clipboard.writeText(url);
                    alert('URL telah disalin ke clipboard!');
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Bagikan
              </button>
            </div>
          </div>
        </div>

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
        
        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center shadow-lg shadow-blue-500/25"
          onClick={() => {
            // Download original file
            const link = document.createElement('a');
            link.href = getPdfUrl(currentDocument);
            link.download = currentDocument.name;
            link.target = '_blank';
            link.click();
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Original
        </button>
      </div>

      {/* Content */}
      {currentDocument.type === 'pdf' ? (
        renderPDFViewer()
      ) : currentDocument.type === 'excel' ? (
        renderExcelViewer()
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tipe file tidak didukung</h3>
          <p className="text-gray-600">
            Hanya file PDF dan Excel yang dapat ditampilkan.
          </p>
        </div>
      )}
    </div>
  );
};