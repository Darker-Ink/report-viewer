import React, { useState } from 'react';
import { Upload, FileText, AlertTriangle, Clock } from 'lucide-react';
import JSZip from 'jszip';
import ReportViewer from './components/ReportViewer';
import { Report } from './types';

function App() {
  const [reports, setReports] = useState<Record<string, Report>>({});
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading ZIP file:', file.name);
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      console.log('ZIP contents:', Object.keys(contents.files));
      
      const reports: Record<string, Report> = {};
      const attachmentMap: Record<string, ArrayBuffer> = {};

      // First pass: collect attachments
      for (const [path, zipEntry] of Object.entries(contents.files)) {
        if (!zipEntry.dir && path.includes('attachments/')) {
          try {
            // Extract attachment ID and full filename
            // Path format: reports/reportId/attachments/123456_filename.ext
            const fileName = path.split('/').pop() || '';
            const attachmentId = fileName.split('_')[0]; // The number before the underscore

            console.log('Processing attachment:', attachmentId, fileName);
            
            if (attachmentId) {
              const content = await zipEntry.async('arraybuffer');
              attachmentMap[attachmentId] = content; // Store with attachment ID as key
              
              // Store the full attachment filename if it contains an underscore
              if (fileName.includes('_')) {
                console.log(`Storing filename mapping: ${attachmentId} -> ${fileName}`);
              } else {
                console.log(`No filename found in: ${fileName}, using ID as filename`);
              }
              
              console.log('Processed attachment:', attachmentId, fileName);
            }
          } catch (err) {
            console.error('Error processing attachment:', path, err);
          }
        }
      }

      const filenameMap: Record<string, string> = {};
      
      for (const path of Object.keys(contents.files)) {
        if (!contents.files[path].dir && path.includes('attachments/')) {
          const fileName = path.split('/').pop() || '';
          const parts = fileName.split('_');
          const attachmentId = parts[0];
          
          if (attachmentId && parts.length > 1) {
            filenameMap[attachmentId] = fileName; // Store the mapping
            console.log(`Added filename mapping: ${attachmentId} -> ${fileName}`);
          }
        }
      }

      for (const [path, zipEntry] of Object.entries(contents.files)) {
        console.log('Processing file:', path);
        
        if (!zipEntry.dir && path.endsWith('pretty.json')) {
          const pathParts = path.split('/');
          const reportId = pathParts.length >= 3 ? pathParts[1] : pathParts[0];
          console.log('Found report ID:', reportId);
          
          const content = await zipEntry.async('string');
          console.log('Report content:', content.substring(0, 100) + '...');
          
          const reportData = JSON.parse(content);
          
          if (reportData.attachments) {
            reportData.attachmentFiles = {};
            reportData.attachmentFilenames = {};
            
            for (const attachmentId of reportData.attachments) {
              if (attachmentMap[attachmentId]) {
                reportData.attachmentFiles[attachmentId] = attachmentMap[attachmentId];
              }
              
              if (filenameMap[attachmentId]) {
                reportData.attachmentFilenames[attachmentId] = filenameMap[attachmentId];
                console.log(`Assigned filename to report: ${attachmentId} -> ${filenameMap[attachmentId]}`);
              }
            }
          }
          
          reports[reportId] = reportData;
          console.log('Processed report:', reportId, reportData.title);
        }
      }

      console.log('Final reports object:', reports);
      console.log('Number of reports:', Object.keys(reports).length);
      
      setReports(reports);
    } catch (error) {
      console.error('Error processing zip file:', error);
      setError('Failed to process the ZIP file. Please make sure it\'s a valid bug report archive.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Header */}
      <header className="bg-zinc-950 shadow-lg border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-white">Bug Report Viewer</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col">
        {/* Upload Section */}
        <div className="mb-8">
          <label
            htmlFor="file-upload"
            className={`relative cursor-pointer bg-zinc-950 rounded-lg border-2 border-dashed border-zinc-800 p-12 text-center hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out flex flex-col items-center justify-center ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <span className="mt-2 block text-sm font-medium text-gray-300">
              {isLoading ? 'Processing...' : 'Upload a ZIP file containing bug reports'}
            </span>
            <span className="mt-1 block text-sm text-gray-500">
              {isLoading ? 'Please wait while we process your file' : 'Drop your file here or click to browse'}
            </span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              accept=".zip"
              className="sr-only"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
          </label>
          {error && (
            <div className="mt-4 p-4 bg-red-900/50 rounded-md border border-red-800">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Debug Info</h3>
          <p className="text-xs text-gray-400">Number of reports: {Object.keys(reports).length}</p>
          <p className="text-xs text-gray-400">Report IDs: {Object.keys(reports).join(', ')}</p>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow">
          {/* Reports List */}
          <div className="lg:col-span-1 bg-zinc-950 rounded-lg shadow-lg border border-zinc-800 flex flex-col max-h-[calc(100vh-250px)] lg:h-auto">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-lg font-medium text-white">Reports</h2>
            </div>
            <div className="divide-y divide-zinc-800 overflow-y-auto flex-grow custom-scrollbar">
              {Object.entries(reports).length > 0 ? (
                Object.entries(reports).map(([id, report]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedReport(id)}
                    className={`w-full px-4 py-3 text-left hover:bg-zinc-900 transition-colors duration-150 ${
                      selectedReport === id ? 'bg-zinc-900' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 min-w-[20px] min-h-[20px] text-gray-400 mt-1" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-gray-200 break-words">
                          {report.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                          <span className="flex items-center">
                            <AlertTriangle className="w-3 h-3 min-w-[12px] min-h-[12px] mr-1" />
                            {report.severity}
                          </span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 min-w-[12px] min-h-[12px] mr-1" />
                            {new Date(report.reportedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No reports available
                </div>
              )}
            </div>
          </div>

          {/* Report Viewer */}
          <div className="lg:col-span-3">
            {selectedReport ? (
              <ReportViewer report={reports[selectedReport]} />
            ) : (
              <div className="bg-zinc-950 rounded-lg shadow-lg border border-zinc-800 p-6 text-center text-gray-400">
                Select a report to view its details
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;