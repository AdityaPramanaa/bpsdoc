import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DocumentList } from './components/DocumentList';
import { DocumentViewer } from './components/DocumentViewer';
import { SearchInterface } from './components/SearchInterface';
import { UploadInterface } from './components/UploadInterface';
import { AdminPanel } from './components/AdminPanel';
import { LoginForm } from './components/LoginForm';
import { Document, User } from './types';
import * as XLSX from 'xlsx';

function App() {
  const [currentView, setCurrentView] = useState('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch daftar file dari backend saat aplikasi load
  useEffect(() => {
    fetchFilesFromBackend();
  }, []);

  // Notifikasi otomatis hilang setelah 5 detik
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchFilesFromBackend = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost/bps/list_files.php');
      const files = await res.json();
      const docs: Document[] = files.map((file: any) => ({
        id: file.public_id,
        name: file.original_filename + '.' + file.format,
        type: file.format === 'pdf' ? 'pdf' : 'excel',
        size: file.bytes,
        uploadDate: file.created_at,
        url: file.url,
        public_id: file.public_id,
      }));
      setDocuments(docs);
    } catch (e) {
      setNotification({ type: 'error', message: 'Gagal mengambil daftar file dari server.' });
    }
    setLoading(false);
  };

  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    setNotification(null);
    if (username === 'bpsprov' && password === '@bps2025') {
      setUser({
        id: '1',
        username,
        role: 'admin'
      });
      setShowLogin(false);
      setCurrentView('admin');
      setNotification({ type: 'success', message: 'Login berhasil.' });
    } else {
      setNotification({ type: 'error', message: 'Username atau password salah.' });
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('documents');
  };

  const handleViewChange = (view: string) => {
    if (view === 'admin') {
      if (!user) {
        setShowLogin(true);
        return;
      }
    }
    setCurrentView(view);
  };

  // Upload file ke Cloudinary langsung dari frontend
  const handleUpload = async (files: FileList) => {
    setLoading(true);
    let success = true;
    const cloudName = 'dqwnckoeu';
    const uploadPreset = 'bps_unsigned';
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      try {
        const res = await fetch(url, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!data.secure_url) success = false;
      } catch {
        success = false;
      }
    }
    setLoading(false);
    setNotification(success
      ? { type: 'success', message: 'Upload file berhasil ke Cloudinary.' }
      : { type: 'error', message: 'Upload file gagal pada salah satu file.' });
    if (success) {
      setTimeout(() => {
        window.location.reload();
      }, 500); // beri jeda 0.5 detik agar notifikasi sempat tampil
    }
  };

  // Hapus file dari Cloudinary hanya bisa dari dashboard Cloudinary (tidak bisa dari frontend)
  const handleDeleteDocument = async (public_id: string) => {
    setLoading(true);
    let success = true;
    try {
      const res = await fetch('/.netlify/functions/delete-cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id })
      });
      const data = await res.json();
      if (!data.success) success = false;
    } catch {
      success = false;
    }
    // Refresh halaman agar data terbaru muncul
    setLoading(false);
    setNotification(success
      ? { type: 'success', message: 'File berhasil dihapus dari Cloudinary.' }
      : { type: 'error', message: 'Gagal menghapus file dari Cloudinary.' });
    if (success) {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  // Saat user ingin melihat dokumen Excel, download file dari Cloudinary, lalu parse
  const handleViewDocument = async (doc: Document) => {
    if (doc.type === 'excel') {
      setLoading(true);
      try {
        const res = await fetch(doc.url!);
        const arrayBuffer = await res.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheets = workbook.SheetNames.map(name => ({
          name,
          data: XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '' }) as Record<string, string | number>[]
        }));
        setViewingDocument({ ...doc, sheets });
      } catch {
        setNotification({ type: 'error', message: 'Gagal membaca file Excel.' });
      }
      setLoading(false);
    } else {
      setViewingDocument(doc);
    }
  };

  const handleBackToList = () => {
    setViewingDocument(null);
  };

  // Show login form when accessing admin
  if (showLogin) {
    return (
      <div className="relative">
        <LoginForm onLogin={handleLogin} />
        <button
          onClick={() => setShowLogin(false)}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm text-gray-600 hover:text-gray-900 p-2 rounded-lg shadow-lg border border-white/20 transition-colors"
        >
          ✕ Close
        </button>
      </div>
    );
  }

  if (viewingDocument) {
    return (
      <Layout
        currentView={currentView}
        onViewChange={handleViewChange}
        user={user}
        onLogout={handleLogout}
      >
        <DocumentViewer 
          currentDocument={viewingDocument} 
          onBack={handleBackToList}
          allDocuments={documents}
        />
      </Layout>
    );
  }

  return (
    <div className="relative">
      {/* Notifikasi */}
      {notification && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold transition-all duration-300 ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.message}
          <button className="ml-4 text-white/80 hover:text-white font-bold" onClick={() => setNotification(null)}>
            ×
          </button>
        </div>
      )}
      {/* Spinner loading */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-40">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <Layout
        currentView={currentView}
        onViewChange={handleViewChange}
        user={user}
        onLogout={handleLogout}
      >
        {currentView === 'documents' && (
          <>
          <DocumentList
            documents={documents}
            onViewDocument={handleViewDocument}
          />
            {documents.length === 0 && !loading && (
              <div className="text-center text-gray-400 mt-8">Belum ada dokumen yang diupload.</div>
            )}
          </>
        )}
        
        {currentView === 'search' && (
          <SearchInterface
            documents={documents}
            onViewDocument={handleViewDocument}
          />
        )}
        
        {currentView === 'upload' && (
          <UploadInterface onUpload={handleUpload} />
        )}
        
        {currentView === 'admin' && user && (
          <AdminPanel
            documents={documents}
            onDeleteDocument={handleDeleteDocument}
          />
        )}
      </Layout>
    </div>
  );
}

export default App;
