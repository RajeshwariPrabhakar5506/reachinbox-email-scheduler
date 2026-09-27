'use client';

import { useState } from 'react';

interface ComposeModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ComposeModal({ userId, onClose, onSuccess }: ComposeModalProps) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsedLeads, setParsedLeads] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Handle regular email attachment selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 2. Handle CSV / TXT Lead List parsing (ReachInbox Requirement)
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Extract unique emails from file text via Regex
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = text.match(emailRegex) || [];
      const uniqueEmails = Array.from(new Set(matches.map((email) => email.toLowerCase())));

      if (uniqueEmails.length === 0) {
        setError('No valid email addresses found in the selected CSV file.');
        return;
      }

      setError('');
      setParsedLeads(uniqueEmails);
      setCsvFileName(file.name);
      setRecipient(uniqueEmails.join(', ')); // Populate recipient field with extracted leads
    };

    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('recipient', recipient);
      formData.append('subject', subject);
      formData.append('body', body);
      if (scheduledAt) formData.append('scheduledAt', scheduledAt);

      // Append selected attachments
      selectedFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      // Updated endpoint pointing to /api/emails/schedule
      const res = await fetch('http://127.0.0.1:5000/api/emails/schedule', {
        method: 'POST',
        body: formData, // Do NOT set Content-Type header when sending FormData
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.error || json.message || 'Failed to send/schedule email');
        } catch {
          throw new Error(text || `Server error: ${res.status}`);
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Added max-h-[90vh], overflow-y-auto, and flex flex-col to enable smooth scrolling */}
      <div className="bg-white text-gray-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col p-6 shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2 border-b">
          <h2 className="text-lg font-bold text-gray-900">Compose New Email Campaign</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-semibold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CSV / TXT Lead List Parser Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Upload Lead List (CSV / TXT)
            </label>
            <input
              type="file"
              accept=".csv, .txt"
              onChange={handleCsvUpload}
              className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            {csvFileName && parsedLeads.length > 0 && (
              <p className="mt-1 text-xs text-emerald-600 font-medium">
                ✓ Extracted <strong>{parsedLeads.length}</strong> lead address(es) from <strong>{csvFileName}</strong>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              To (Recipients)
            </label>
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="recipient@example.com or comma-separated emails"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Meeting Updates"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Message Body
            </label>
            <textarea
              rows={4}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email body here..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* File Attachments Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Attachments
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            {selectedFiles.length > 0 && (
              <ul className="mt-2 space-y-1">
                {selectedFiles.map((file, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded border border-gray-200"
                  >
                    <span className="truncate max-w-[200px] text-gray-700 font-medium">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-red-500 hover:text-red-700 font-bold ml-2"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Schedule Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t sticky bottom-0 bg-white pb-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : scheduledAt ? 'Schedule Email' : 'Send Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}