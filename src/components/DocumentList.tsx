import React, { useState, useMemo } from 'react';
import { Document } from '../types';
import { FileText, Table, Download, Eye, Calendar, Filter, SortAsc, SortDesc } from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onViewDocument: (doc: Document) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, onViewDocument }) => {
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'excel'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => doc.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.uploadDate).getTime();
          bValue = new Date(b.uploadDate).getTime();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [documents, sortBy, sortOrder, filterType, searchTerm]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentIcon = (type: string) => {
    return type === 'pdf' ? (
      <FileText className="h-6 w-6 text-red-500" />
    ) : (
      <Table className="h-6 w-6 text-green-500" />
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = type === 'pdf' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors}`}>
        {type.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Documents
            </h1>
            <p className="text-gray-600 mt-1">
              {filteredAndSortedDocuments.length} of {documents.length} documents
            </p>
          </div>
          <button
            onClick={() => {
              const csvContent = filteredAndSortedDocuments.map(doc => 
                `${doc.name},${doc.type},${formatFileSize(doc.size)},${new Date(doc.uploadDate).toLocaleDateString()}`
              ).join('\n');
              const blob = new Blob([`Name,Type,Size,Date\n${csvContent}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'documents_list.csv';
              link.click();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'pdf' | 'excel')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="pdf">PDF Only</option>
            <option value="excel">Excel Only</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size' | 'type')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
            <option value="type">Sort by Type</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedDocuments.map((doc) => (
          <div
            key={doc.id}
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 hover:shadow-xl transition-all duration-300 cursor-pointer group h-full"
            onClick={() => onViewDocument(doc)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getDocumentIcon(doc.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm leading-tight line-clamp-2" title={doc.name}>
                    {doc.name}
                  </h3>
                  <div className="mt-1">
                    {getTypeBadge(doc.type)}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement('a');
                  link.href = doc.url || '';
                  link.download = doc.name;
                  link.click();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
                title="Download"
              >
                <Download className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{new Date(doc.uploadDate).toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{formatFileSize(doc.size)}</span>
              </div>
              {doc.type === 'excel' && doc.sheets && (
                <div className="flex items-center space-x-2">
                  <Table className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{doc.sheets.length} sheet{doc.sheets.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDocument(doc);
                }}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors w-full"
              >
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">View Document</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-600">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Upload your first document to get started.'
            }
          </p>
        </div>
      )}
    </div>
  );
};