import { useState } from 'react';
import { AlertTriangle, User, Clock, Tag, Download, X, Image, FileVideo, Code, File } from 'lucide-react';
import { Report } from '../types';
import ReactMarkdown from 'react-markdown';

interface ReportViewerProps {
  report: Report;
}

function ReportViewer({ report }: ReportViewerProps) {
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);

  // Helper function to determine status badge color
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'Informative': 'bg-blue-950 text-blue-200 border-blue-800',
      'Duplicate': 'bg-purple-950 text-purple-200 border-purple-800',
      'Resolved': 'bg-green-950 text-green-200 border-green-800',
      'Not Applicable': 'bg-gray-950 text-gray-200 border-gray-800',
      'Triaged': 'bg-yellow-950 text-yellow-200 border-yellow-800',
      'In Progress': 'bg-cyan-950 text-cyan-200 border-cyan-800'
    };
    return statusMap[status] || 'bg-gray-950 text-gray-200 border-gray-800';
  };

  // Helper function to determine attachment icon
  const getAttachmentIcon = (attachment: string) => {
    // Get the full filename if available
    const fileName = report.attachmentFilenames?.[attachment] || attachment;
    const lowerFileName = fileName.toLowerCase();
    
    if (lowerFileName.includes('_demo') || lowerFileName.endsWith('.mp4') || lowerFileName.endsWith('.avi') || lowerFileName.endsWith('.mov')) {
      return <FileVideo className="w-5 h-5 text-blue-400" />;
    }
    if (lowerFileName.endsWith('.png') || lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg') || lowerFileName.endsWith('.gif')) {
      return <Image className="w-5 h-5 text-green-400" />;
    }
    if (lowerFileName.endsWith('.js') || lowerFileName.endsWith('.html') || lowerFileName.endsWith('.css') || lowerFileName.endsWith('.ts')) {
      return <Code className="w-5 h-5 text-yellow-400" />;
    }
    return <File className="w-5 h-5 text-gray-400" />;
  };

  // Helper function to create attachment URL
  const getAttachmentUrl = (attachmentId: string) => {
    if (report.attachmentFiles && report.attachmentFiles[attachmentId]) {
      const blob = new Blob([report.attachmentFiles[attachmentId]]);
      return URL.createObjectURL(blob);
    }
    return null;
  };

  // Handle download attachment
  const handleDownloadAttachment = (attachmentId: string) => {
    const url = getAttachmentUrl(attachmentId);
    const filename = getAttachmentFilename(attachmentId);
    
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Render attachment content
  const renderAttachmentPreview = () => {
    if (!selectedAttachment) return null;
    
    const url = getAttachmentUrl(selectedAttachment);
    if (!url) return <div className="text-center p-8 text-gray-400">Unable to preview attachment</div>;
    
    const fileName = report.attachmentFilenames?.[selectedAttachment] || selectedAttachment;
    const lowerFileName = fileName.toLowerCase();
    
    if (lowerFileName.endsWith('.mp4') || lowerFileName.includes('_demo') || lowerFileName.endsWith('.avi') || lowerFileName.endsWith('.mov')) {
      return (
        <video 
          controls 
          className="max-w-full max-h-[500px] mx-auto"
          src={url}
        >
          Your browser does not support the video tag.
        </video>
      );
    }
    
    if (lowerFileName.endsWith('.png') || lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg') || lowerFileName.endsWith('.gif')) {
      return <img src={url} alt="Attachment preview" className="max-w-full max-h-[500px] mx-auto" />;
    }
    
    return <div className="text-center p-8 text-gray-400">Preview not available for this file type</div>;
  };

  // Helper function to get attachment filename
  const getAttachmentFilename = (attachmentId: string) => {
    // First check if we have a stored filename
    if (report.attachmentFilenames && report.attachmentFilenames[attachmentId]) {
      // Get the part after the ID_ if it exists
      const filename = report.attachmentFilenames[attachmentId];
      const parts = filename.split('_');
      if (parts.length > 1) {
        // Return everything after the first underscore
        return parts.slice(1).join('_');
      }
      return filename;
    }
    
    // Fallback: Try to extract from the ID
    const match = attachmentId.match(/\d+_(.+)$/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Last resort
    return `Attachment ${attachmentId}`;
  };

  return (
    <div className="bg-zinc-950 rounded-lg shadow-lg border border-zinc-800">
      {/* Report Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">{report.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <span className="flex items-center text-sm text-gray-400">
                <User className="w-4 h-4 mr-1" />
                {report.reporter}
              </span>
              <span className="flex items-center text-sm text-gray-400">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(report.reportedAt).toLocaleDateString()}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                report.severity === 'critical' ? 'bg-red-950 text-red-200 border border-red-800' :
                report.severity === 'high' ? 'bg-orange-950 text-orange-200 border border-orange-800' :
                report.severity === 'medium' ? 'bg-yellow-950 text-yellow-200 border border-yellow-800' :
                'bg-green-950 text-green-200 border border-green-800'
              }`}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                {report.severity}
              </span>
              {report.weakness && (
                <span className="flex items-center text-sm text-gray-400">
                  <Tag className="w-4 h-4 mr-1" />
                  {report.weakness}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {report.content && (
        <div className="p-6 prose prose-invert max-w-none border-b border-zinc-800">
          {report.content.startsWith('#') || report.content.includes('**') || report.content.includes('__') ? (
            <ReactMarkdown>{report.content}</ReactMarkdown>
          ) : (
            <div className="whitespace-pre-wrap">{report.content}</div>
          )}
        </div>
      )}

      {/* Attachment Preview Modal */}
      {selectedAttachment && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto border border-zinc-700 shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">{getAttachmentFilename(selectedAttachment)}</h3>
              <button 
                onClick={() => setSelectedAttachment(null)}
                className="p-1 rounded-full hover:bg-zinc-800"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 flex justify-center">
              {renderAttachmentPreview()}
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-center">
              <button
                onClick={() => handleDownloadAttachment(selectedAttachment)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-md flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachments */}
      {report.attachments && report.attachments.length > 0 && (
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-medium text-white mb-4">Attachments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.attachments.map((attachment, index) => (
              <button 
                key={index} 
                className="bg-black rounded-lg p-3 border border-zinc-800 flex items-center hover:bg-zinc-900 transition-colors text-left"
                onClick={() => setSelectedAttachment(attachment)}
              >
                {getAttachmentIcon(attachment)}
                <span className="text-sm text-gray-300 truncate ml-3">{getAttachmentFilename(attachment)}</span>
                <Download 
                  className="w-4 h-4 text-gray-500 ml-auto hover:text-blue-400" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadAttachment(attachment);
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div>
        <div className="p-6">
          <h3 className="text-lg font-medium text-white mb-4">Messages</h3>
          <div className="space-y-4">
            {report.messages && report.messages.map((message, index) => (
              <div key={index} className="bg-black rounded-lg p-4 border border-zinc-800">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-200">{message.author}</span>
                  {message.oldSeverity && (
                    <span className="text-sm text-gray-400">
                      changed severity from {message.oldSeverity.rating} to {message.newSeverity?.rating}
                    </span>
                  )}
                  {message.newStatus && (
                    <span className="text-sm text-gray-400 ml-2">
                      changed the status to <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(message.newStatus)}`}>{message.newStatus}</span>
                    </span>
                  )}
                </div>
                
                {/* Message Content */}
                <p className="text-gray-300 mb-3 whitespace-pre-wrap">{message.content}</p>
                
                {/* Bounty Information */}
                {message.bounty && (
                  <div className="mb-3 p-3 bg-green-950/30 border border-green-800 rounded-md">
                    <div className="flex items-center text-green-200">
                      <span className="font-medium">Bounty awarded: </span>
                      <span className="ml-2 text-green-100 font-bold">${message.bounty.amount}</span>
                      {message.bounty.bonusAmount && Number(message.bounty.bonusAmount) > 0 && (
                        <span className="ml-2 text-green-300">(+${message.bounty.bonusAmount} bonus)</span>
                      )}
                      {message.bounty.user && (
                        <span className="ml-auto text-sm text-green-300">Awarded by {message.bounty.user}</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Message Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Attachments:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {message.attachments.map((attachment, idx) => (
                        <button
                          key={idx} 
                          className="bg-zinc-900 rounded p-2 border border-zinc-800 flex items-center hover:bg-zinc-800 transition-colors text-left"
                          onClick={() => setSelectedAttachment(attachment)}
                        >
                          {getAttachmentIcon(attachment)}
                          <span className="text-sm text-gray-300 ml-2">{getAttachmentFilename(attachment)}</span>
                          <Download 
                            className="w-4 h-4 text-gray-500 ml-auto hover:text-blue-400" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadAttachment(attachment);
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportViewer;