'use client';

import { useRouter } from 'next/navigation';

interface UserProps {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface HeaderProps {
  user?: UserProps;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    // 1. Clear session keys from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // 2. Clear any session cookies if applicable
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // 3. Redirect back to login page
    router.push('/login');
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center space-x-2">
        <span className="text-xl font-bold text-indigo-600 tracking-tight">ReachInbox</span>
        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium border border-indigo-100">
          Scheduler
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 text-right">
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-none">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.email || ''}
            </p>
          </div>

          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          type="button"
          className="text-xs font-semibold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}