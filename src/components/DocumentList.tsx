import React, { useState } from 'react';
import { Document } from '../types';
import { FileText, Eye, Download, Calendar, HardDrive } from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onViewDocument: (doc: Document) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onViewDocument,
}) => {
  const [filter, setFilter] = useState('all');

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'all') return true;
    return doc.type === filter;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          Document
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Browse your uploaded documents. Click "View & Search" to open and search within documents.
      
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 bg-white/60 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-white/20 w-fit">
        {['all', 'pdf', 'excel'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 capitalize ${
              filter === type
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
            }`}
          >
            {type === 'all' ? 'All Files' : type.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center min-w-0 flex-1">
                  <div className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ${
                    doc.type === 'pdf' 
                      ? 'bg-gradient-to-r from-red-100 to-red-200' 
                      : 'bg-gradient-to-r from-green-100 to-green-200'
                  }`}>
                    <FileText className={`h-4 w-4 sm:h-6 sm:w-6 ${
                      doc.type === 'pdf' ? 'text-red-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    <p className={`text-xs font-medium ${
                      doc.type === 'pdf' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {doc.type.toUpperCase()}
                      {doc.type === 'excel' && doc.sheets && (
                        <span className="ml-1 text-gray-500">
                          • {doc.sheets.length} sheet{doc.sheets.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-xs text-gray-500">
                  <HardDrive className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{formatFileSize(doc.size)}</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{formatDate(doc.uploadDate)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => onViewDocument(doc)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center shadow-lg shadow-blue-500/25"
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">View & Search</span>
                  <span className="sm:hidden">View</span>
                </button>
                <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center sm:w-auto">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 sm:p-8">
            <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-500">No documents found</p>
          </div>
        </div>
      )}
    </div>
  );
};