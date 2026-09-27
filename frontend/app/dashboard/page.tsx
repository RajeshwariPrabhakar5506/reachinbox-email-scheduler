'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import ComposeModal from '../../components/ComposeModal';
import EmailTable from '../../components/EmailTable';
import SlackConnect from '../../components/SlackConnect';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<{ id: string; name: string; email: string; avatar?: string } | null>(null);

  // 1. Single unified Authentication & Session Check on Mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!token || !storedUser) {
        // Redirect to login if no valid session found
        router.push('/login');
        return;
      }

      setUser(JSON.parse(storedUser));
    } catch (err) {
      console.error('Error reading session:', err);
      router.push('/login');
    } finally {
      setIsCheckingAuth(false);
    }
  }, [router]);

  // 2. Fetch Emails whenever activeTab or user updates
  const fetchEmails = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const endpoint = activeTab === 'scheduled' ? '/api/emails/scheduled' : '/api/emails/sent';
      const res = await fetch(`http://127.0.0.1:5000${endpoint}?userId=${user.id}`);

      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setEmails(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch emails:', err);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !isCheckingAuth) {
      fetchEmails();
    }
  }, [activeTab, user, isCheckingAuth]);

  // Loading state during SSR / Initial Auth Check
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header user={user || { name: 'User', email: '', avatar: '' }} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              type="button"
              className={`pb-3 px-4 text-sm font-medium transition ${
                activeTab === 'scheduled'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('scheduled')}
            >
              Scheduled Emails
            </button>
            <button
              type="button"
              className={`pb-3 px-4 text-sm font-medium transition ${
                activeTab === 'sent'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('sent')}
            >
              Sent Emails
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <SlackConnect userId={user?.id || 'user-123'} />
            <button
              type="button"
              onClick={() => setIsComposeOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition"
            >
              + Compose New Email
            </button>
          </div>
        </div>

        <EmailTable emails={emails} loading={loading} type={activeTab} />
      </main>

      {isComposeOpen && (
        <ComposeModal
          userId={user?.id || 'user-123'}
          onClose={() => setIsComposeOpen(false)}
          onSuccess={() => {
            setIsComposeOpen(false);
            fetchEmails();
          }}
        />
      )}
    </div>
  );
}