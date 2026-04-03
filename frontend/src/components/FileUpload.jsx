import React, { useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const FileUpload = ({ sessionId }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setStatus('idle');
      setMessage('');
    } else if (selected) {
      setStatus('error');
      setMessage('Please select a valid PDF file.');
      setFile(null);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setStatus('idle');
    setMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setStatus('uploading');
    setMessage('Uploading document...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId || 'default');

    try {
      let headers = {};
      if (isAuthenticated) {
        const token = await getAccessTokenSilently();
        headers['Authorization'] = `Bearer ${token}`;
      }

      await axios.post('http://localhost:3000/api/uploadDocument', formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });

      setStatus('success');
      setMessage('Document uploaded successfully. You can now chat about it!');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err.response?.data?.error || 'Failed to upload document.');
    }
  };

  return (
    <div className="w-80 bg-slate-800/60 backdrop-blur-md rounded-xl p-2.5 border border-slate-700/50 shrink-0 shadow-lg">
      <div className="flex items-center gap-3">
        <input 
          type="file" 
          accept=".pdf" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          disabled={status === 'uploading'}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-blue-400 transition-colors shrink-0 flex items-center justify-center border border-slate-600/30"
          disabled={status === 'uploading'}
          title="Select PDF"
        >
          <Upload className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0" onClick={() => !file && fileInputRef.current?.click()}>
          {file ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          ) : (
            <div className="flex flex-col cursor-pointer">
              <span className="text-sm text-slate-400">Upload Document Context</span>
              <span className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">PDF Files Only</span>
            </div>
          )}
        </div>

        {file && status !== 'uploading' && status !== 'success' && (
          <div className="flex gap-2">
             <button 
              onClick={clearSelection}
              className="px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors shrink-0 text-xs font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              Upload
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={`mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2 border ${
          status === 'error' ? 'text-red-300 bg-red-500/10 border-red-500/20' :
          status === 'success' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' :
          'text-blue-300 bg-blue-500/10 border-blue-500/20'
        }`}>
          {status === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          {status === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
          {status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
          <span className="font-medium">{message}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
