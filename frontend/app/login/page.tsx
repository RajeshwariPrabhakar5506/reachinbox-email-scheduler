'use client';

import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const router = useRouter();

  const handleDemoLogin = () => {
    const demoUser = {
      id: 'user-123',
      name: 'Rajeshwari P',
      email: 'prabhakarrajeshwari306@gmail.com',
      avatar: 'https://via.placeholder.com/40',
    };
    localStorage.setItem('token', 'demo-token-123');
    localStorage.setItem('user', JSON.stringify(demoUser));
    router.push('/dashboard');
  };

  const handleGoogleSuccess = (credentialResponse: any) => {
    const demoUser = {
      id: 'user-google-123',
      name: 'Rajeshwari P',
      email: 'prabhakarrajeshwari306@gmail.com',
      avatar: 'https://via.placeholder.com/40',
    };
    localStorage.setItem('token', 'demo-token-google');
    localStorage.setItem('user', JSON.stringify(demoUser));
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
        <h1 className="text-2xl font-bold text-indigo-600 mb-2">ReachInbox Scheduler</h1>
        <p className="text-sm text-gray-500 mb-8">Sign in to manage and schedule your cold email outreach campaigns.</p>

        <div className="flex flex-col items-center justify-center space-y-4 w-full">
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert('Google Login Failed')}
            />
          </div>

          <div className="w-full border-t border-gray-200 my-4"></div>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2.5 px-4 rounded-xl transition border border-gray-300 shadow-xs cursor-pointer"
          >
            🚀 Quick Demo Login (Bypass Google)
          </button>
        </div>
      </div>
    </div>
  );
}