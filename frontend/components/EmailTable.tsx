'use client';

interface EmailItem {
  id: string;
  recipient: string;
  subject: string;
  status: string;
  scheduledAt: string;
  sentAt?: string;
  senderEmail: string;
}

interface EmailTableProps {
  emails: EmailItem[];
  loading: boolean;
  type: 'scheduled' | 'sent';
}

export default function EmailTable({ emails, loading, type }: EmailTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3"></div>
        <p>Loading emails...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-lg font-medium">No {type} emails found.</p>
        <p className="text-gray-400 text-sm mt-1">
          {type === 'scheduled'
            ? 'Click "Compose New Email" to schedule a campaign.'
            : 'Emails will appear here once they are dispatched.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Recipient
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Subject
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Sender
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {type === 'scheduled' ? 'Scheduled For' : 'Sent At'}
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 text-sm">
          {emails.map((email) => (
            <tr key={email.id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4 font-medium text-gray-900">{email.recipient}</td>
              <td className="px-6 py-4 text-gray-700">{email.subject}</td>
              <td className="px-6 py-4 text-gray-500">{email.senderEmail}</td>
              <td className="px-6 py-4 text-gray-500">
                {type === 'scheduled'
                  ? new Date(email.scheduledAt).toLocaleString()
                  : email.sentAt
                  ? new Date(email.sentAt).toLocaleString()
                  : 'N/A'}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    email.status === 'SENT'
                      ? 'bg-green-100 text-green-800'
                      : email.status === 'DELAYED_RATE_LIMIT'
                      ? 'bg-yellow-100 text-yellow-800'
                      : email.status === 'FAILED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {email.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}