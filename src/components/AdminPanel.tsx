import React, { useState } from 'react';
import { Document } from '../types';
import { Settings, Users, FileText, BarChart3, Edit3, Trash } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface AdminPanelProps {
  documents: Document[];
  onDeleteDocument: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ documents, onDeleteDocument }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDoc, setConfirmDoc] = useState<Document | null>(null);

  const stats = {
    totalDocuments: documents.length,
    pdfDocuments: documents.filter(d => d.type === 'pdf').length,
    excelDocuments: documents.filter(d => d.type === 'excel').length,
    totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
    totalSheets: documents.filter(d => d.type === 'excel').reduce((sum, doc) => sum + (doc.sheets?.length || 0), 0),
    totalRows: documents.filter(d => d.type === 'excel').reduce((sum, doc) => 
      sum + (doc.sheets?.reduce((sheetSum, sheet) => sheetSum + sheet.data.length, 0) || 0), 0
    ),
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'documents', label: 'Manage Documents', icon: FileText },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 sm:p-6">
          <div className="flex items-center">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-3 w-3 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">PDF Files</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.pdfDocuments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Excel Files</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.excelDocuments}</p>
              <p className="text-xs text-gray-500">{stats.totalSheets} sheets • {stats.totalRows} rows</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-3 w-3 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Size</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatFileSize(stats.totalSize)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {documents.slice(0, 5).map((doc) => (
            <div key={doc.id} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  doc.type === 'pdf' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <FileText className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    doc.type === 'pdf' ? 'text-red-600' : 'text-green-600'
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{doc.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                    {doc.type === 'excel' && doc.sheets && (
                      <span className="ml-2">
                        • {doc.sheets.length} sheet{doc.sheets.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  doc.type === 'pdf' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {doc.type.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDocumentManagement = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Document Management</h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">View and manage uploaded documents (Admin can delete)</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {documents.map((doc) => (
          <div key={doc.id} className="p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                doc.type === 'pdf' ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <FileText className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  doc.type === 'pdf' ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">{doc.name}</h4>
                <p className="text-xs sm:text-sm text-gray-500">
                  {formatFileSize(doc.size)} • {new Date(doc.uploadDate).toLocaleDateString()}
                  {doc.type === 'excel' && doc.sheets && (
                    <span className="ml-2">
                      • {doc.sheets.length} sheet{doc.sheets.length > 1 ? 's' : ''}
                      • {doc.sheets.reduce((sum, sheet) => sum + sheet.data.length, 0)} rows
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button className="text-gray-400 hover:text-blue-600 transition-colors p-1" title="View Only">
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                className="text-gray-400 hover:text-red-600 transition-colors p-1 ml-2"
                title="Delete Document"
                onClick={() => {
                  setConfirmDoc(doc);
                  setConfirmOpen(true);
                }}
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmModal
        open={confirmOpen}
        title="Konfirmasi Hapus Dokumen"
        message={confirmDoc ? `Yakin hapus dokumen '${confirmDoc.name}'? Dokumen akan hilang dari database & Cloudinary!` : ''}
        onCancel={() => { setConfirmOpen(false); setConfirmDoc(null); }}
        onConfirm={() => {
          if (confirmDoc) onDeleteDocument(confirmDoc.id);
          setConfirmOpen(false); setConfirmDoc(null);
        }}
      />
    </div>
  );

  const renderUserManagement = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">User Management</h3>
      <p className="text-sm sm:text-base text-gray-600">User management features would be implemented here.</p>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm sm:text-base font-medium text-blue-900 mb-2">Performance Optimization</h4>
          <p className="text-xs sm:text-sm text-blue-700">
            Large Excel files are automatically paginated (50 rows per page) for optimal performance.
            Search results are also paginated to ensure smooth user experience.
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="text-sm sm:text-base font-medium text-green-900 mb-2">Read-Only Mode</h4>
          <p className="text-xs sm:text-sm text-green-700">
            Users can only view and search documents. No deletion or modification capabilities are available.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2 sm:mb-4">
          Admin Panel
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Monitor documents and system performance. All operations are in read-only mode.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 bg-white/60 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-white/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
            }`}
          >
            <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'documents' && renderDocumentManagement()}
      {activeTab === 'users' && renderUserManagement()}
      {activeTab === 'settings' && renderSettings()}
    </div>
  );
};