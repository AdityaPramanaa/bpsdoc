import React, { useState } from 'react';
import { Search, Download, FileText } from 'lucide-react';
import { Document, SearchResult } from '../types';
import { downloadSearchResultsAsExcel, downloadSearchResultsAsPDF } from '../utils/downloadUtils';
import * as XLSX from 'xlsx';

interface SearchInterfaceProps {
  documents: Document[];
  onViewDocument: (doc: Document) => void;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({ documents, onViewDocument }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0 });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const results: SearchResult[] = [];
      const queryLower = searchQuery.toLowerCase();
      const searchableDocs = documents.filter(doc => doc.type === 'excel' || doc.type === 'pdf');
      
      setSearchProgress({ current: 0, total: searchableDocs.length });
      
      // Search through all documents
      for (let i = 0; i < searchableDocs.length; i++) {
        const doc = searchableDocs[i];
        setSearchProgress({ current: i + 1, total: searchableDocs.length });
        
        if (doc.type === 'excel') {
          // Download and search Excel files
          try {
            const response = await fetch(doc.url!);
            if (!response.ok) continue;
            
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Search through all sheets
            workbook.SheetNames.forEach((sheetName, sheetIndex) => {
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
              
              // Search through all rows and columns
              jsonData.forEach((row: any, rowIndex: number) => {
                Object.entries(row).forEach(([column, value]) => {
                  const valueStr = String(value).toLowerCase();
                  if (valueStr.includes(queryLower)) {
                    results.push({
                      file: doc.name,
                      type: 'excel',
                      sheet: sheetName,
                      row: rowIndex + 1,
                      column: column,
                      value: String(value)
                    });
                  }
                });
              });
            });
          } catch (error) {
            console.error(`Error searching Excel file ${doc.name}:`, error);
          }
        } else if (doc.type === 'pdf') {
          // For PDF files, we'll add a placeholder since text extraction requires backend
          // In a real implementation, you'd need a PDF text extraction service
          results.push({
            file: doc.name,
            type: 'pdf',
            page: 1,
            snippet: `PDF file detected - ${doc.name} may contain "${searchQuery}". Use browser's PDF search (Ctrl+F) when viewing.`
          });
        }
      }
      
      console.log('Search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    
    setIsSearching(false);
    setSearchProgress({ current: 0, total: 0 });
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-yellow-200 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleDownloadResults = (format: 'excel' | 'pdf') => {
    if (searchResults.length === 0) return;

    // Convert SearchResult[] to the format expected by download functions
    const formattedResults = searchResults.map((result, index) => ({
      _sheetName: result.sheet || 'Unknown',
      _rowIndex: result.row || index + 1,
      'Document': result.file,
      'Type': result.type,
      'Sheet': result.sheet || 'N/A',
      'Row': result.row || 'N/A',
      'Column': result.column || 'N/A',
      'Value': result.value || result.snippet || 'N/A',
      'Page': result.page || 'N/A'
    }));

    if (format === 'excel') {
      downloadSearchResultsAsExcel(formattedResults, searchQuery, 'Global_Search');
    } else {
      downloadSearchResultsAsPDF(formattedResults, searchQuery, 'Global_Search');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
          Global Search
        </h1>
        <p className="text-gray-600 mb-6">
          Search through all Excel file contents to find specific data quickly and efficiently.
        </p>
        
        {/* Search Input */}
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter search term..."
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
        
        {/* Search Progress */}
        {isSearching && searchProgress.total > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Searching files...</span>
              <span>{searchProgress.current} / {searchProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(searchProgress.current / searchProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results for "{searchQuery}" ({searchResults.length} found)
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownloadResults('excel')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm shadow-lg shadow-green-500/25"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Excel
                </button>
                <button
                  onClick={() => handleDownloadResults('pdf')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm shadow-lg shadow-red-500/25"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {searchResults.map((result, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-3 mb-1">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="font-bold text-blue-700">{result.file}</span>
                    <span className="text-xs bg-gray-200 text-gray-700 rounded px-2 py-1">{result.type?.toUpperCase()}</span>
                  </div>
                  {result.type === 'excel' ? (
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div><span className="text-gray-500">Sheet:</span> <span className="font-medium">{result.sheet}</span></div>
                      <div><span className="text-gray-500">Row:</span> <span className="font-medium">{result.row}</span></div>
                      <div><span className="text-gray-500">Column:</span> <span className="font-medium">{result.column}</span></div>
                      <div><span className="text-gray-500">Value:</span> <span className="ml-2">{highlightMatch(String(result.value || ''), searchQuery)}</span></div>
                    </div>
                  ) : result.type === 'pdf' ? (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><span className="text-gray-500">Page:</span> <span className="font-medium">{result.page}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">Snippet:</span> <span className="ml-2">{highlightMatch(String(result.snippet || ''), searchQuery)}</span></div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery && searchResults.length === 0 && !isSearching && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-12 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or check the spelling.
          </p>
        </div>
      )}
    </div>
  );
};